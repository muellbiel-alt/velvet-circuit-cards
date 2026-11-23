// Pure headless deterministic game engine for Velvet Circuit.
// Contains zero DOM or Canvas references so it can be unit-tested directly under Node.

import { createRng, pickDeterministic, shuffleDeterministic } from './prng.js';
import {
  CARD_CATALOG,
  VAULT_POOL_IDS,
  createCardInstance,
  createStarterDeck,
  evaluateCircuitSynergy,
} from './cards.js';
import {
  createOpponentState,
  getEffectiveIntentDamage,
  planOpponentIntent,
} from './opponents.js';

export const ENGINE_CONFIG = {
  playerMaxHp: 48,
  baseEnergy: 3,
  handDrawCount: 5,
  maxHandSize: 7,
  totalTables: 3,
  healBetweenTables: 12,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function createGameState(seed = 42) {
  const rng = createRng(seed);
  let uidCounter = 1;
  const nextUid = () => `c${uidCounter++}`;

  const starterDeck = createStarterDeck(nextUid);
  const opponent = createOpponentState(1);
  planOpponentIntent(opponent, rng);

  const state = {
    seed,
    rng,
    nextUid,
    phase: 'title', // 'title' | 'playing' | 'draft' | 'victory' | 'defeat'
    tableIndex: 1,
    totalTables: ENGINE_CONFIG.totalTables,
    turn: 1,
    totalTurns: 1,
    score: 0,
    credits: 250,
    combosTriggered: 0,
    cardsPlayedTotal: 0,
    bestChain: 0,
    player: {
      hp: ENGINE_CONFIG.playerMaxHp,
      maxHp: ENGINE_CONFIG.playerMaxHp,
      shield: 0,
      energy: ENGINE_CONFIG.baseEnergy,
      maxEnergy: ENGINE_CONFIG.baseEnergy,
      counter: 0,
      amp: 0,
    },
    masterDeck: starterDeck,
    drawPile: [],
    hand: [],
    discardPile: [],
    circuitRail: [],
    triggeredSynergies: new Set(),
    activeBanner: null,
    opponent,
    draftChoices: [],
    selectedHandIndex: -1,
    hoveredHandIndex: -1,
    lastEvents: [],
    elapsedTime: 0,
    turnLockTimer: 0,
  };

  // Deal an initial preview hand for the live attract cover table.
  setupTableDeck(state, false);
  drawCards(state, ENGINE_CONFIG.handDrawCount);
  return state;
}

function setupTableDeck(state, resetPlayerStats) {
  state.drawPile = shuffleDeterministic(
    state.masterDeck.map((c) => ({ ...c, effects: { ...c.effects } })),
    state.rng,
  );
  state.hand = [];
  state.discardPile = [];
  state.circuitRail = [];
  state.triggeredSynergies = new Set();
  state.selectedHandIndex = -1;
  state.hoveredHandIndex = -1;
  if (resetPlayerStats) {
    state.player.shield = 0;
    state.player.counter = 0;
    state.player.amp = 0;
    state.player.energy = state.player.maxEnergy;
  }
}

export function drawCards(state, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (state.hand.length >= ENGINE_CONFIG.maxHandSize) break;
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      state.drawPile = shuffleDeterministic(state.discardPile, state.rng);
      state.discardPile = [];
    }
    const card = state.drawPile.pop();
    if (card) {
      state.hand.push(card);
      drawn.push(card);
    }
  }
  return drawn;
}

export function startMatch(state) {
  state.phase = 'playing';
  state.tableIndex = 1;
  state.turn = 1;
  state.totalTurns = 1;
  state.score = 0;
  state.credits = 250;
  state.combosTriggered = 0;
  state.cardsPlayedTotal = 0;
  state.bestChain = 0;
  state.activeBanner = {
    title: 'TABLE I · DEAL IN',
    subtitle: 'MATCH 2 SUITS FOR CIRCUIT FLUSH',
    suit: 'overclock',
    timer: 2.2,
  };
  state.player = {
    hp: ENGINE_CONFIG.playerMaxHp,
    maxHp: ENGINE_CONFIG.playerMaxHp,
    shield: 0,
    energy: ENGINE_CONFIG.baseEnergy,
    maxEnergy: ENGINE_CONFIG.baseEnergy,
    counter: 0,
    amp: 0,
  };
  state.rng = createRng(state.seed);
  let uidCounter = 1;
  state.nextUid = () => `c${uidCounter++}`;
  state.masterDeck = createStarterDeck(state.nextUid);
  state.opponent = createOpponentState(1);
  planOpponentIntent(state.opponent, state.rng);
  setupTableDeck(state, true);
  drawCards(state, ENGINE_CONFIG.handDrawCount);
  state.lastEvents = [{ type: 'match_start', tableIndex: 1 }];
  return state;
}

export function restartRun(state, newSeed = state.seed) {
  state.seed = newSeed;
  return startMatch(state);
}

export function previewCardOutcome(state, handIndex) {
  const card = state.hand[handIndex];
  if (!card) return null;
  const canAfford = state.phase === 'playing' && card.cost <= state.player.energy;
  const eff = card.effects;

  let rawDamage = eff.damage || 0;
  if (rawDamage > 0) {
    if (eff.bonusIfMarked && state.opponent.marked > 0) {
      rawDamage += eff.bonusIfMarked;
    }
    rawDamage += state.player.amp;
    if (state.opponent.marked > 0) {
      rawDamage += 2;
    }
  }

  let shieldGain = eff.shield || 0;
  if (rawDamage === 0 && shieldGain > 0 && state.player.amp > 0) {
    shieldGain += state.player.amp;
  }

  const simulatedRail = [...state.circuitRail, card];
  const simSet = new Set(state.triggeredSynergies);
  const potentialCombos = evaluateCircuitSynergy(simulatedRail, simSet);

  return {
    card,
    canAfford,
    damage: rawDamage,
    pierce: Boolean(eff.pierce),
    shield: shieldGain,
    heal: eff.heal || 0,
    jam: eff.jam || 0,
    energyGain: eff.energy || 0,
    potentialCombos,
  };
}

function applyDamageToOpponent(state, amount, pierce, events, sourceLabel) {
  if (amount <= 0) return 0;
  let remaining = amount;
  let absorbed = 0;

  if (!pierce && state.opponent.shield > 0) {
    absorbed = Math.min(state.opponent.shield, remaining);
    state.opponent.shield -= absorbed;
    remaining -= absorbed;
  }

  const dealt = Math.min(state.opponent.hp, remaining);
  state.opponent.hp = Math.max(0, state.opponent.hp - dealt);
  state.score += dealt * 15 + (pierce ? 25 : 0);

  events.push({
    type: 'opponent_hit',
    damage: dealt,
    absorbed,
    pierce,
    source: sourceLabel,
  });

  return dealt;
}

export function playCardFromHand(state, handIndex) {
  if (state.phase !== 'playing') return { ok: false, reason: 'not_playing', events: [] };
  const card = state.hand[handIndex];
  if (!card) return { ok: false, reason: 'invalid_index', events: [] };
  if (card.cost > state.player.energy) return { ok: false, reason: 'no_energy', events: [] };

  const events = [];
  state.player.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  state.circuitRail.push(card);
  state.cardsPlayedTotal += 1;
  state.bestChain = Math.max(state.bestChain, state.circuitRail.length);
  state.selectedHandIndex = -1;

  events.push({ type: 'card_played', card, slotIndex: state.circuitRail.length - 1 });

  const eff = card.effects;
  const ampUsed = state.player.amp;
  let consumedAmp = false;

  if (eff.damage) {
    let totalDamage = eff.damage;
    if (eff.bonusIfMarked && state.opponent.marked > 0) {
      totalDamage += eff.bonusIfMarked;
    }
    if (ampUsed > 0) {
      totalDamage += ampUsed;
      consumedAmp = true;
    }
    if (state.opponent.marked > 0) {
      totalDamage += 2;
    }
    applyDamageToOpponent(state, totalDamage, Boolean(eff.pierce), events, card.name);
  }

  if (eff.shield) {
    let shieldGain = eff.shield;
    if (!eff.damage && ampUsed > 0) {
      shieldGain += ampUsed;
      consumedAmp = true;
    }
    state.player.shield += shieldGain;
    state.score += shieldGain * 5;
    events.push({ type: 'player_shield', amount: shieldGain });
  }

  if (consumedAmp) {
    state.player.amp = 0;
  }

  if (eff.counter) {
    state.player.counter += eff.counter;
    events.push({ type: 'player_counter', amount: eff.counter });
  }

  if (eff.mark) {
    state.opponent.marked += eff.mark;
    events.push({ type: 'opponent_mark', amount: eff.mark });
  }

  if (eff.jam) {
    state.opponent.jammed += eff.jam;
    state.score += eff.jam * 12;
    events.push({ type: 'opponent_jam', amount: eff.jam });
  }

  if (eff.heal) {
    const before = state.player.hp;
    state.player.hp = clamp(state.player.hp + eff.heal, 0, state.player.maxHp);
    const healed = state.player.hp - before;
    if (healed > 0) {
      events.push({ type: 'player_heal', amount: healed });
    }
  }

  if (eff.energy) {
    state.player.energy += eff.energy;
    events.push({ type: 'player_energy', amount: eff.energy });
  }

  if (eff.amp) {
    state.player.amp += eff.amp;
    events.push({ type: 'player_amp', amount: eff.amp });
  }

  if (eff.credits) {
    state.credits += eff.credits;
    state.score += eff.credits;
    events.push({ type: 'credits_gain', amount: eff.credits });
  }

  if (eff.draw) {
    const drawn = drawCards(state, eff.draw);
    if (drawn.length > 0) {
      events.push({ type: 'cards_drawn', count: drawn.length });
    }
  }

  // Evaluate Circuit Rail combos!
  const newCombos = evaluateCircuitSynergy(state.circuitRail, state.triggeredSynergies);
  for (const combo of newCombos) {
    state.combosTriggered += 1;
    state.score += combo.score || 150;
    state.credits += 75;
    state.activeBanner = {
      title: combo.name,
      subtitle: combo.subtitle,
      suit: combo.suit,
      timer: 2.6,
    };
    events.push({ type: 'combo_triggered', combo });

    if (combo.damage) {
      applyDamageToOpponent(state, combo.damage, Boolean(combo.pierce), events, combo.name);
    }
    if (combo.shield) {
      state.player.shield += combo.shield;
      events.push({ type: 'player_shield', amount: combo.shield });
    }
    if (combo.counter) {
      state.player.counter += combo.counter;
      events.push({ type: 'player_counter', amount: combo.counter });
    }
    if (combo.energy) {
      state.player.energy += combo.energy;
      events.push({ type: 'player_energy', amount: combo.energy });
    }
    if (combo.draw) {
      const drawn = drawCards(state, combo.draw);
      if (drawn.length > 0) {
        events.push({ type: 'cards_drawn', count: drawn.length });
      }
    }
    if (combo.heal) {
      const before = state.player.hp;
      state.player.hp = clamp(state.player.hp + combo.heal, 0, state.player.maxHp);
      if (state.player.hp > before) {
        events.push({ type: 'player_heal', amount: state.player.hp - before });
      }
    }
    if (combo.jam) {
      state.opponent.jammed += combo.jam;
      events.push({ type: 'opponent_jam', amount: combo.jam });
    }
  }

  checkTableVictory(state, events);
  state.lastEvents = events;
  return { ok: true, events };
}

function checkTableVictory(state, events) {
  if (state.opponent.hp > 0) return false;

  const tableBonus = state.tableIndex * 500 + state.player.hp * 10;
  state.score += tableBonus;
  state.credits += state.tableIndex * 200;

  if (state.tableIndex >= state.totalTables) {
    state.phase = 'victory';
    state.activeBanner = {
      title: 'HOUSE BROKEN',
      subtitle: 'ALL 3 TABLES CLEARED',
      suit: 'overclock',
      timer: 5,
    };
    events.push({ type: 'run_victory', bonus: tableBonus });
  } else {
    state.phase = 'draft';
    const pickedIds = pickDeterministic(VAULT_POOL_IDS, 3, state.rng);
    state.draftChoices = pickedIds.map((id) => createCardInstance(id, state.nextUid()));
    state.activeBanner = {
      title: `TABLE ${state.tableIndex} CLEARED`,
      subtitle: 'DRAFT 1 VAULT CARD · +12 HP',
      suit: 'siphon',
      timer: 4,
    };
    events.push({ type: 'table_cleared', tableIndex: state.tableIndex, bonus: tableBonus });
  }
  return true;
}

export function endPlayerTurn(state) {
  if (state.phase !== 'playing') return { ok: false, events: [] };
  const events = [];

  // Move played rail cards and remaining hand into discard pile
  while (state.circuitRail.length > 0) {
    state.discardPile.push(state.circuitRail.pop());
  }
  while (state.hand.length > 0) {
    state.discardPile.push(state.hand.pop());
  }
  state.triggeredSynergies.clear();
  state.player.amp = 0;

  // Opponent executes their telegraphed intent
  const intent = state.opponent.intent;
  if (intent && state.opponent.hp > 0) {
    events.push({ type: 'opponent_action', intent });

    if (intent.shield > 0) {
      state.opponent.shield += intent.shield;
      events.push({ type: 'opponent_shield', amount: intent.shield });
    }

    if (intent.heal > 0) {
      const before = state.opponent.hp;
      state.opponent.hp = clamp(state.opponent.hp + intent.heal, 0, state.opponent.maxHp);
      if (state.opponent.hp > before) {
        events.push({ type: 'opponent_heal', amount: state.opponent.hp - before });
      }
    }

    const totalIncoming = getEffectiveIntentDamage(state.opponent);
    const hits = intent.hits || 1;
    const perHit = hits > 0 ? Math.floor(totalIncoming / hits) : 0;

    for (let h = 0; h < hits; h += 1) {
      if (perHit <= 0 || state.player.hp <= 0) break;
      const blocked = Math.min(state.player.shield, perHit);
      state.player.shield -= blocked;
      const hpDamage = perHit - blocked;
      state.player.hp = Math.max(0, state.player.hp - hpDamage);

      events.push({
        type: 'player_hit',
        damage: hpDamage,
        blocked,
        hitIndex: h,
      });

      if (state.player.counter > 0 && state.opponent.hp > 0) {
        applyDamageToOpponent(state, state.player.counter, false, events, 'COUNTER');
      }
    }
  }

  // Check defeat or counter-kill victory
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    state.activeBanner = {
      title: 'FLATLINED',
      subtitle: 'THE HOUSE TAKES THE POT',
      suit: 'blade',
      timer: 5,
    };
    events.push({ type: 'run_defeat' });
    state.lastEvents = events;
    return { ok: true, events };
  }

  if (checkTableVictory(state, events)) {
    state.lastEvents = events;
    return { ok: true, events };
  }

  // Start next turn cleanly
  state.turn += 1;
  state.totalTurns += 1;
  state.player.shield = 0;
  state.player.counter = 0;
  state.player.energy = state.player.maxEnergy;
  state.opponent.jammed = 0;
  if (state.opponent.marked > 0) {
    state.opponent.marked = Math.max(0, state.opponent.marked - 1);
  }
  planOpponentIntent(state.opponent, state.rng);
  drawCards(state, ENGINE_CONFIG.handDrawCount);
  events.push({ type: 'turn_start', turn: state.turn });

  state.lastEvents = events;
  return { ok: true, events };
}

export function pickDraftCard(state, choiceIndex) {
  if (state.phase !== 'draft') return { ok: false, events: [] };
  const chosen = state.draftChoices[choiceIndex];
  if (!chosen) return { ok: false, events: [] };

  const events = [];
  state.masterDeck.push({ ...chosen, effects: { ...chosen.effects } });
  state.draftChoices = [];
  state.player.hp = clamp(
    state.player.hp + ENGINE_CONFIG.healBetweenTables,
    0,
    state.player.maxHp,
  );
  state.tableIndex += 1;
  state.turn = 1;
  state.totalTurns += 1;
  state.phase = 'playing';
  state.opponent = createOpponentState(state.tableIndex);
  planOpponentIntent(state.opponent, state.rng);
  setupTableDeck(state, true);
  drawCards(state, ENGINE_CONFIG.handDrawCount);
  state.activeBanner = {
    title: `${state.opponent.name}`,
    subtitle: state.opponent.title,
    suit: 'circuit',
    timer: 2.4,
  };
  events.push({ type: 'draft_picked', card: chosen, tableIndex: state.tableIndex });
  state.lastEvents = events;
  return { ok: true, events };
}

export function stepEngine(state, dt) {
  const safeDt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
  state.elapsedTime += safeDt;
  if (state.turnLockTimer > 0) {
    state.turnLockTimer = Math.max(0, state.turnLockTimer - safeDt);
  }
  if (state.activeBanner) {
    state.activeBanner.timer -= safeDt;
    if (state.activeBanner.timer <= 0 && state.phase === 'playing') {
      state.activeBanner = null;
    }
  }
}

export function getCardCatalogCount() {
  return Object.keys(CARD_CATALOG).length;
}
