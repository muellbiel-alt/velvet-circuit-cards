// Syndicate table dealers and their readable, counterable intent cards.

export const OPPONENTS = [
  {
    id: 'croupier',
    tableIndex: 1,
    name: 'THE CROUPIER',
    title: 'TABLE I · VELVET FLOOR',
    maxHp: 42,
    startingShield: 4,
    accent: '#ff526f',
    emblem: 'spade_crown',
    handSize: 5,
    deck: [
      { id: 'house_cut', name: 'HOUSE CUT', suit: 'blade', type: 'attack', damage: 9, hits: 1, shield: 0, label: '9 DMG' },
      { id: 'brass_deal', name: 'BRASS DEAL', suit: 'circuit', type: 'guard', damage: 5, hits: 1, shield: 7, label: '5 DMG + 7 SHD' },
      { id: 'cold_deck', name: 'COLD DECK', suit: 'blade', type: 'attack', damage: 12, hits: 1, shield: 0, label: '12 DMG' },
      { id: 'rake_fee', name: 'RAKE FEE', suit: 'siphon', type: 'drain', damage: 7, hits: 1, shield: 4, heal: 3, label: '7 DMG + HEAL 3' },
      { id: 'double_flick', name: 'DOUBLE FLICK', suit: 'blade', type: 'multi', damage: 5, hits: 2, shield: 0, label: '5×2 DMG' },
    ],
  },
  {
    id: 'viper_broker',
    tableIndex: 2,
    name: 'VIPER BROKER',
    title: 'TABLE II · HIGH STAKES',
    maxHp: 62,
    startingShield: 8,
    accent: '#19e3ff',
    emblem: 'viper_hex',
    handSize: 5,
    deck: [
      { id: 'twin_fangs', name: 'TWIN FANGS', suit: 'blade', type: 'multi', damage: 6, hits: 2, shield: 0, label: '6×2 DMG' },
      { id: 'vault_hedge', name: 'VAULT HEDGE', suit: 'circuit', type: 'guard', damage: 7, hits: 1, shield: 10, label: '7 DMG + 10 SHD' },
      { id: 'margin_call', name: 'MARGIN CALL', suit: 'overclock', type: 'attack', damage: 15, hits: 1, shield: 0, label: '15 DMG' },
      { id: 'skim_wire', name: 'SKIM WIRE', suit: 'siphon', type: 'drain', damage: 9, hits: 1, shield: 5, heal: 5, label: '9 DMG + HEAL 5' },
      { id: 'rapid_barrage', name: 'RAPID DEAL', suit: 'blade', type: 'multi', damage: 5, hits: 3, shield: 0, label: '5×3 DMG' },
    ],
  },
  {
    id: 'chrome_queen',
    tableIndex: 3,
    name: 'CHROME QUEEN',
    title: 'TABLE III · THE VAULT BOSS',
    maxHp: 84,
    startingShield: 12,
    accent: '#ffbe30',
    emblem: 'queen_diadem',
    handSize: 5,
    deck: [
      { id: 'royal_flush', name: 'ROYAL SLASH', suit: 'blade', type: 'multi', damage: 7, hits: 2, shield: 4, label: '7×2 + 4 SHD' },
      { id: 'gilded_wall', name: 'GILDED WALL', suit: 'circuit', type: 'guard', damage: 10, hits: 1, shield: 13, label: '10 DMG + 13 SHD' },
      { id: 'guillotine_ace', name: 'EXECUTION', suit: 'blade', type: 'attack', damage: 19, hits: 1, shield: 0, label: '19 DMG' },
      { id: 'sovereign_tax', name: 'CROWN TAX', suit: 'siphon', type: 'drain', damage: 11, hits: 1, shield: 6, heal: 6, label: '11 DMG + HEAL 6' },
      { id: 'overclock_deal', name: 'OVERCLOCK', suit: 'overclock', type: 'multi', damage: 6, hits: 3, shield: 0, label: '6×3 DMG' },
    ],
  },
];

export function createOpponentState(tableIndex) {
  const idx = Math.max(0, Math.min(OPPONENTS.length - 1, tableIndex - 1));
  const template = OPPONENTS[idx];
  return {
    id: template.id,
    tableIndex: template.tableIndex,
    name: template.name,
    title: template.title,
    hp: template.maxHp,
    maxHp: template.maxHp,
    shield: template.startingShield,
    accent: template.accent,
    emblem: template.emblem,
    handSize: template.handSize,
    deck: template.deck.map((item) => ({ ...item })),
    turnCursor: 0,
    marked: 0,
    jammed: 0,
    intent: null,
    handCards: [],
  };
}

export function planOpponentIntent(opponent, rng) {
  const pool = opponent.deck;
  const primaryIndex = opponent.turnCursor % pool.length;
  const primary = { ...pool[primaryIndex] };
  opponent.turnCursor += 1;

  // Build opponent's visible 5-card fanned hand with the active intent card marked.
  const handCards = [];
  for (let i = 0; i < opponent.handSize; i += 1) {
    const isIntent = i === 2;
    const def = isIntent ? primary : pool[(primaryIndex + i + 1) % pool.length];
    handCards.push({
      slot: i,
      revealed: isIntent,
      activeIntent: isIntent,
      card: { ...def },
      jitter: rng ? (rng.next() - 0.5) * 0.04 : 0,
    });
  }

  opponent.intent = primary;
  opponent.handCards = handCards;
  return primary;
}

export function getEffectiveIntentDamage(opponent) {
  if (!opponent || !opponent.intent) return 0;
  const basePerHit = Math.max(0, opponent.intent.damage - opponent.jammed);
  return basePerHit * (opponent.intent.hits || 1);
}
