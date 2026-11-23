import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENGINE_CONFIG,
  createGameState,
  endPlayerTurn,
  getCardCatalogCount,
  pickDraftCard,
  playCardFromHand,
  previewCardOutcome,
  restartRun,
  startMatch,
  stepEngine,
} from '../game/src/engine.js';
import { createCardInstance, evaluateCircuitSynergy } from '../game/src/cards.js';
import { getEffectiveIntentDamage } from '../game/src/opponents.js';

function assertFiniteNumbers(obj, path = 'state') {
  if (typeof obj === 'number') {
    assert.ok(Number.isFinite(obj), `Expected finite number at ${path}, got ${obj}`);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => assertFiniteNumbers(v, `${path}[${i}]`));
    return;
  }
  if (obj && typeof obj === 'object' && !(obj instanceof Set)) {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'function') continue;
      assertFiniteNumbers(v, `${path}.${k}`);
    }
  }
}

test('catalog and deterministic initialization produce identical hands for identical seed', () => {
  assert.ok(getCardCatalogCount() >= 18);
  const a = startMatch(createGameState(77));
  const b = startMatch(createGameState(77));

  assert.equal(a.phase, 'playing');
  assert.equal(a.hand.length, ENGINE_CONFIG.handDrawCount);
  assert.deepEqual(
    a.hand.map((c) => c.id),
    b.hand.map((c) => c.id),
  );
  assert.equal(a.opponent.intent.id, b.opponent.intent.id);
  assertFiniteNumbers(a);
});

test('playing two matching suits triggers Circuit Flush synergy once per turn', () => {
  const state = startMatch(createGameState(101));
  state.player.energy = 5;
  state.opponent.hp = 40;
  state.opponent.shield = 6;
  state.hand = [
    createCardInstance('velvet_cut', 't1'),
    createCardInstance('stiletto_feint', 't2'),
  ];

  const r1 = playCardFromHand(state, 0);
  assert.equal(r1.ok, true);
  assert.equal(state.combosTriggered, 0);

  const preview = previewCardOutcome(state, 0);
  assert.equal(preview.potentialCombos.length, 1);
  assert.equal(preview.potentialCombos[0].name, 'RAZOR SURGE');

  const r2 = playCardFromHand(state, 0);
  assert.equal(r2.ok, true);
  assert.equal(state.combosTriggered, 1);
  assert.ok(r2.events.some((e) => e.type === 'combo_triggered' && e.combo.name === 'RAZOR SURGE'));
  assert.ok(state.opponent.hp < 40);
  assertFiniteNumbers(state);
});

test('playing three distinct suits triggers Prism Breach synergy', () => {
  const triggered = new Set();
  const played = [
    createCardInstance('velvet_cut', 'p1'),
    createCardInstance('brass_ward', 'p2'),
    createCardInstance('jade_skim', 'p3'),
  ];
  const combos = evaluateCircuitSynergy(played, triggered);
  assert.equal(combos.length, 1);
  assert.equal(combos[0].name, 'PRISM BREACH');
  assert.equal(evaluateCircuitSynergy(played, triggered).length, 0);
});

test('jamming opponent reduces effective intent damage and shield/counter mitigates hits', () => {
  const state = startMatch(createGameState(12));
  state.opponent.intent = {
    id: 'house_cut',
    name: 'HOUSE CUT',
    suit: 'blade',
    type: 'attack',
    damage: 10,
    hits: 1,
    shield: 0,
    label: '10 DMG',
  };
  state.player.energy = 3;
  state.hand = [
    createCardInstance('jam_signal', 'j1'),
    createCardInstance('static_parry', 'j2'),
  ];

  playCardFromHand(state, 0); // +4 shield, -4 foe ATK
  assert.equal(getEffectiveIntentDamage(state.opponent), 6);
  playCardFromHand(state, 0); // +5 shield, 4 counter + AEGIS LOCK (+7 shield, +4 counter)

  const hpBefore = state.player.hp;
  const foeHpBefore = state.opponent.hp;
  const endRes = endPlayerTurn(state);
  assert.equal(endRes.ok, true);
  assert.equal(state.player.hp, hpBefore, 'Shield should absorb the entire jammed attack');
  assert.ok(state.opponent.hp < foeHpBefore, 'Counter should punish attacking opponent');
  assertFiniteNumbers(state);
});

test('clearing table transitions to Vault Draft and advances to Table II with restored HP', () => {
  const state = startMatch(createGameState(55));
  state.player.hp = 30;
  state.player.energy = 4;
  state.opponent.hp = 10;
  state.opponent.shield = 0;
  state.hand = [createCardInstance('obsidian_ace', 'k1')];

  playCardFromHand(state, 0);
  assert.equal(state.phase, 'draft');
  assert.equal(state.draftChoices.length, 3);

  const deckBefore = state.masterDeck.length;
  const res = pickDraftCard(state, 1);
  assert.equal(res.ok, true);
  assert.equal(state.phase, 'playing');
  assert.equal(state.tableIndex, 2);
  assert.equal(state.masterDeck.length, deckBefore + 1);
  assert.equal(state.player.hp, 42);
  assertFiniteNumbers(state);
});

test('defeating Table III reaches victory and dropping to 0 HP reaches defeat', () => {
  const winState = startMatch(createGameState(9));
  winState.tableIndex = 3;
  winState.opponent.hp = 8;
  winState.opponent.shield = 0;
  winState.player.energy = 3;
  winState.hand = [createCardInstance('crimson_ante', 'w1')];
  playCardFromHand(winState, 0);
  assert.equal(winState.phase, 'victory');

  const lossState = startMatch(createGameState(9));
  lossState.player.hp = 4;
  lossState.player.shield = 0;
  lossState.opponent.intent = {
    id: 'cold_deck',
    name: 'COLD DECK',
    suit: 'blade',
    type: 'attack',
    damage: 12,
    hits: 1,
    shield: 0,
    label: '12 DMG',
  };
  endPlayerTurn(lossState);
  assert.equal(lossState.phase, 'defeat');
  assert.equal(lossState.player.hp, 0);
});

test('stepEngine clamps large dt and restartRun resets all state cleanly', () => {
  const state = startMatch(createGameState(42));
  playCardFromHand(state, 0);
  stepEngine(state, 5.0);
  assert.ok(state.elapsedTime <= 0.11, 'dt must be clamped');

  restartRun(state, 42);
  assert.equal(state.phase, 'playing');
  assert.equal(state.tableIndex, 1);
  assert.equal(state.turn, 1);
  assert.equal(state.score, 0);
  assert.equal(state.player.hp, ENGINE_CONFIG.playerMaxHp);
  assert.equal(state.circuitRail.length, 0);
  assert.equal(state.discardPile.length, 0);
  assert.equal(state.hand.length, ENGINE_CONFIG.handDrawCount);
  assertFiniteNumbers(state);
});
