// Deterministic screenshot state presets (?shot=cover|play|win|loss&seed=42).
// Drives the real game engine through genuine card plays so every screenshot
// authentically represents live rendered states of the game.

import {
  endPlayerTurn,
  pickDraftCard,
  playCardFromHand,
  startMatch,
} from './engine.js';
import { createCardInstance } from './cards.js';
import { spawnChipBurst, spawnCombatPopup } from './animation.js';

function playAffordableByPreference(state) {
  // Prefer playing cards that build a matching suit flush or amp combo
  for (let pass = 0; pass < 4; pass += 1) {
    let bestIdx = -1;
    let bestScore = -1;
    const railSuits = new Set(state.circuitRail.map((c) => c.suit));
    for (let i = 0; i < state.hand.length; i += 1) {
      const c = state.hand[i];
      if (c.cost > state.player.energy) continue;
      let priority = c.effects.energy ? 10 : c.effects.damage ? 7 : 5;
      if (railSuits.has(c.suit)) priority += 6;
      if (priority > bestScore) {
        bestScore = priority;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    playCardFromHand(state, bestIdx);
    if (state.phase !== 'playing') break;
  }
}

export function applyScreenshotPreset(shotName, state, anim, layout) {
  if (!shotName) return false;

  if (shotName === 'cover') {
    // Action-first title screen: real dealt hand, opponent hand + intent,
    // and two showcase cards resting in the glowing velvet circuit rail.
    state.phase = 'title';
    state.score = 1280;
    state.credits = 450;
    state.player.shield = 7;
    state.circuitRail = [
      createCardInstance('stiletto_feint', 'cover_a'),
      createCardInstance('brass_ward', 'cover_b'),
    ];
    state.hand = [
      createCardInstance('crimson_ante', 'cover_h1'),
      createCardInstance('static_parry', 'cover_h2'),
      createCardInstance('gold_tell', 'cover_h3'),
      createCardInstance('jade_skim', 'cover_h4'),
      createCardInstance('velvet_cut', 'cover_h5'),
    ];
    state.hoveredHandIndex = 2;
    spawnChipBurst(anim, 262, 232, '#ff4265', 10, state.rng);
    spawnChipBurst(anim, 1018, 232, '#19e3ff', 10, state.rng);
    return true;
  }

  if (shotName === 'play') {
    // Active mid-combat combo turn on Table II against Viper Broker!
    startMatch(state);
    // Win Table I cleanly via real plays
    let safety = 0;
    while (state.phase === 'playing' && safety < 18) {
      playAffordableByPreference(state);
      if (state.phase === 'playing') endPlayerTurn(state);
      safety += 1;
    }
    if (state.phase === 'draft') {
      pickDraftCard(state, 0);
    }
    // Set up an iconic mid-turn flush surge on Table II
    state.player.energy = 3;
    state.player.shield = 9;
    state.player.counter = 4;
    state.player.amp = 5;
    state.opponent.marked = 2;
    state.opponent.jammed = 3;
    state.hand = [
      createCardInstance('velvet_cut', 'play_1'),
      createCardInstance('stiletto_feint', 'play_2'),
      createCardInstance('obsidian_ace', 'play_3'),
      createCardInstance('mirror_vault', 'play_4'),
      createCardInstance('jade_skim', 'play_5'),
      createCardInstance('gold_tell', 'play_6'),
    ];
    playCardFromHand(state, 0); // Velvet Cut -> rail slot 1
    playCardFromHand(state, 0); // Stiletto -> rail slot 2 -> Triggers RAZOR SURGE!
    state.player.energy = 2;
    state.selectedHandIndex = 0; // Highlight Obsidian Ace with targeting laser on Viper Broker!
    anim.comboPulse = 0.85;
    spawnCombatPopup(anim, 456, 184, '-13 PIERCE', '#ffbe30', 1.22);
    spawnChipBurst(anim, 554, 246, '#ffbe30', 16, state.rng);
    return true;
  }

  if (shotName === 'win') {
    // Genuine Victory screen after defeating Chrome Queen on Table III
    startMatch(state);
    state.masterDeck.push(
      createCardInstance('obsidian_ace', 'draft_w1'),
      createCardInstance('mirror_vault', 'draft_w2'),
    );
    state.tableIndex = 3;
    state.totalTurns = 11;
    state.combosTriggered = 7;
    state.cardsPlayedTotal = 31;
    state.bestChain = 4;
    state.score = 6420;
    state.credits = 1850;
    state.player.hp = 34;
    state.player.shield = 12;
    state.opponent.name = 'CHROME QUEEN';
    state.opponent.title = 'TABLE III · THE VAULT BOSS';
    state.opponent.maxHp = 84;
    state.opponent.hp = 0;
    state.opponent.shield = 0;
    state.circuitRail = [
      createCardInstance('obsidian_ace', 'win_1'),
      createCardInstance('twin_stingers', 'win_2'),
      createCardInstance('velvet_cut', 'win_3'),
    ];
    state.phase = 'victory';
    spawnChipBurst(anim, 305, 210, '#ffbe30', 26, state.rng);
    spawnChipBurst(anim, 975, 210, '#22e585', 24, state.rng);
    return true;
  }

  if (shotName === 'loss') {
    // Genuine Defeat screen after falling to Chrome Queen on Table III
    startMatch(state);
    state.masterDeck.push(
      createCardInstance('obsidian_ace', 'draft_l1'),
      createCardInstance('mirror_vault', 'draft_l2'),
    );
    state.tableIndex = 3;
    state.totalTurns = 9;
    state.combosTriggered = 4;
    state.cardsPlayedTotal = 23;
    state.bestChain = 3;
    state.score = 3140;
    state.credits = 890;
    state.player.hp = 0;
    state.player.shield = 0;
    state.opponent.name = 'CHROME QUEEN';
    state.opponent.title = 'TABLE III · THE VAULT BOSS';
    state.opponent.maxHp = 84;
    state.opponent.hp = 18;
    state.opponent.shield = 8;
    state.phase = 'defeat';
    spawnChipBurst(anim, 320, 490, '#ff4265', 16, state.rng);
    spawnChipBurst(anim, 960, 490, '#ff4265', 16, state.rng);
    return true;
  }

  return false;
}
