// Original Velvet Circuit card catalog, suit palette/shapes, starter deck,
// rare vault draft cards, and Circuit Rail synergy rules.

export const SUITS = {
  blade: {
    id: 'blade',
    name: 'BLADE',
    short: 'ATK',
    color: '#ff4265',
    glow: '#ff7a93',
    dark: '#3a0d19',
    panel: '#240b13',
    shape: 'dagger',
  },
  circuit: {
    id: 'circuit',
    name: 'CIRCUIT',
    short: 'DEF',
    color: '#19e3ff',
    glow: '#88f2ff',
    dark: '#092e3a',
    panel: '#081d26',
    shape: 'diamond',
  },
  overclock: {
    id: 'overclock',
    name: 'OVERCLOCK',
    short: 'AMP',
    color: '#ffbe30',
    glow: '#ffe08a',
    dark: '#3d2807',
    panel: '#241807',
    shape: 'bolt',
  },
  siphon: {
    id: 'siphon',
    name: 'SIPHON',
    short: 'DRN',
    color: '#22e585',
    glow: '#8bf5be',
    dark: '#0a3320',
    panel: '#081f15',
    shape: 'clover',
  },
};

export const CARD_CATALOG = {
  velvet_cut: {
    id: 'velvet_cut',
    name: 'VELVET CUT',
    suit: 'blade',
    cost: 1,
    value: 7,
    tag: 'STRIKE',
    motif: 'slash',
    summary: 'Deal 7 DMG',
    effects: { damage: 7 },
    rarity: 'starter',
  },
  stiletto_feint: {
    id: 'stiletto_feint',
    name: 'STILETTO',
    suit: 'blade',
    cost: 1,
    value: 5,
    tag: 'PIERCE',
    motif: 'pierce',
    summary: '5 Pierce + Mark',
    effects: { damage: 5, pierce: true, mark: 2 },
    rarity: 'starter',
  },
  crimson_ante: {
    id: 'crimson_ante',
    name: 'CRIMSON ANTE',
    suit: 'blade',
    cost: 2,
    value: 14,
    tag: 'HEAVY',
    motif: 'crown_blade',
    summary: 'Deal 14 DMG',
    effects: { damage: 14 },
    rarity: 'starter',
  },
  brass_ward: {
    id: 'brass_ward',
    name: 'BRASS WARD',
    suit: 'circuit',
    cost: 1,
    value: 7,
    tag: 'SHIELD',
    motif: 'shield',
    summary: 'Gain 7 Shield',
    effects: { shield: 7 },
    rarity: 'starter',
  },
  static_parry: {
    id: 'static_parry',
    name: 'STATIC PARRY',
    suit: 'circuit',
    cost: 1,
    value: 5,
    tag: 'COUNTER',
    motif: 'parry',
    summary: '+5 Shd, 4 Counter',
    effects: { shield: 5, counter: 4 },
    rarity: 'starter',
  },
  jam_signal: {
    id: 'jam_signal',
    name: 'SIGNAL JAM',
    suit: 'circuit',
    cost: 1,
    value: 4,
    tag: 'DISRUPT',
    motif: 'wave',
    summary: '+4 Shield, -4 Foe ATK',
    effects: { shield: 4, jam: 4 },
    rarity: 'starter',
  },
  gold_tell: {
    id: 'gold_tell',
    name: 'GOLD TELL',
    suit: 'overclock',
    cost: 0,
    value: 1,
    tag: 'SURGE',
    motif: 'spark',
    summary: '+1 Energy, Draw 1',
    effects: { energy: 1, draw: 1 },
    rarity: 'starter',
  },
  double_down: {
    id: 'double_down',
    name: 'DOUBLE DOWN',
    suit: 'overclock',
    cost: 1,
    value: 5,
    tag: 'AMP',
    motif: 'chip_stack',
    summary: 'Next Card +5, Draw 1',
    effects: { amp: 5, draw: 1 },
    rarity: 'starter',
  },
  jade_skim: {
    id: 'jade_skim',
    name: 'JADE SKIM',
    suit: 'siphon',
    cost: 1,
    value: 5,
    tag: 'DRAIN',
    motif: 'siphon',
    summary: '5 DMG, Heal 3 HP',
    effects: { damage: 5, heal: 3 },
    rarity: 'starter',
  },
  velvet_tax: {
    id: 'velvet_tax',
    name: 'VELVET TAX',
    suit: 'siphon',
    cost: 1,
    value: 4,
    tag: 'HEX',
    motif: 'hex',
    summary: '4 DMG, -3 Foe ATK',
    effects: { damage: 4, jam: 3, credits: 80 },
    rarity: 'starter',
  },

  // Rare Vault Draft Cards (unlocked between tables)
  obsidian_ace: {
    id: 'obsidian_ace',
    name: 'OBSIDIAN ACE',
    suit: 'blade',
    cost: 2,
    value: 18,
    tag: 'EXECUTE',
    motif: 'ace_blade',
    summary: '18 Pierce DMG',
    effects: { damage: 18, pierce: true },
    rarity: 'vault',
  },
  twin_stingers: {
    id: 'twin_stingers',
    name: 'TWIN STING',
    suit: 'blade',
    cost: 1,
    value: 9,
    tag: 'COMBO',
    motif: 'slash',
    summary: '9 DMG (+4 if Marked)',
    effects: { damage: 9, bonusIfMarked: 4 },
    rarity: 'vault',
  },
  mirror_vault: {
    id: 'mirror_vault',
    name: 'MIRROR VAULT',
    suit: 'circuit',
    cost: 2,
    value: 14,
    tag: 'FORTRESS',
    motif: 'fortress',
    summary: '+14 Shd, 6 Counter',
    effects: { shield: 14, counter: 6 },
    rarity: 'vault',
  },
  deadlock_chip: {
    id: 'deadlock_chip',
    name: 'DEADLOCK',
    suit: 'circuit',
    cost: 1,
    value: 6,
    tag: 'LOCK',
    motif: 'wave',
    summary: '+6 Shield, -6 Foe ATK',
    effects: { shield: 6, jam: 6 },
    rarity: 'vault',
  },
  high_roller: {
    id: 'high_roller',
    name: 'HIGH ROLLER',
    suit: 'overclock',
    cost: 1,
    value: 2,
    tag: 'JACKPOT',
    motif: 'chip_stack',
    summary: '+2 Energy, Draw 2',
    effects: { energy: 2, draw: 2, credits: 120 },
    rarity: 'vault',
  },
  prism_catalyst: {
    id: 'prism_catalyst',
    name: 'PRISM WIRE',
    suit: 'overclock',
    cost: 0,
    value: 7,
    tag: 'OVERDRIVE',
    motif: 'spark',
    summary: 'Next Card +7 & +3 Shd',
    effects: { amp: 7, shield: 3 },
    rarity: 'vault',
  },
  emerald_heist: {
    id: 'emerald_heist',
    name: 'JADE HEIST',
    suit: 'siphon',
    cost: 2,
    value: 11,
    tag: 'SIPHON',
    motif: 'siphon',
    summary: '11 DMG, Heal 7, +150$',
    effects: { damage: 11, heal: 7, credits: 150 },
    rarity: 'vault',
  },
  noir_ledger: {
    id: 'noir_ledger',
    name: 'NOIR LEDGER',
    suit: 'siphon',
    cost: 1,
    value: 6,
    tag: 'STEAL',
    motif: 'hex',
    summary: '6 DMG, Heal 4, Draw 1',
    effects: { damage: 6, heal: 4, draw: 1 },
    rarity: 'vault',
  },
};

export const STARTER_DECK_IDS = [
  'velvet_cut',
  'velvet_cut',
  'stiletto_feint',
  'crimson_ante',
  'brass_ward',
  'static_parry',
  'jam_signal',
  'gold_tell',
  'double_down',
  'jade_skim',
  'velvet_tax',
];

export const VAULT_POOL_IDS = Object.values(CARD_CATALOG)
  .filter((card) => card.rarity === 'vault')
  .map((card) => card.id);

export function createCardInstance(cardId, uid) {
  const def = CARD_CATALOG[cardId];
  if (!def) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return {
    uid,
    id: def.id,
    name: def.name,
    suit: def.suit,
    cost: def.cost,
    value: def.value,
    tag: def.tag,
    motif: def.motif,
    summary: def.summary,
    effects: { ...def.effects },
    rarity: def.rarity,
  };
}

export function createStarterDeck(nextUid) {
  return STARTER_DECK_IDS.map((id) => createCardInstance(id, nextUid()));
}

export function evaluateCircuitSynergy(playedCards, triggeredKeys) {
  const suitCounts = { blade: 0, circuit: 0, overclock: 0, siphon: 0 };
  for (const card of playedCards) {
    if (suitCounts[card.suit] !== undefined) {
      suitCounts[card.suit] += 1;
    }
  }

  const triggered = [];

  for (const suitId of Object.keys(suitCounts)) {
    const count = suitCounts[suitId];
    const flushKey = `flush:${suitId}`;
    if (count >= 2 && !triggeredKeys.has(flushKey)) {
      triggeredKeys.add(flushKey);
      if (suitId === 'blade') {
        triggered.push({
          key: flushKey,
          name: 'RAZOR SURGE',
          subtitle: 'BLADE FLUSH ×2',
          suit: 'blade',
          damage: 6,
          pierce: true,
          score: 160,
        });
      } else if (suitId === 'circuit') {
        triggered.push({
          key: flushKey,
          name: 'AEGIS LOCK',
          subtitle: 'CIRCUIT FLUSH ×2',
          suit: 'circuit',
          shield: 7,
          counter: 4,
          score: 160,
        });
      } else if (suitId === 'overclock') {
        triggered.push({
          key: flushKey,
          name: 'JACKPOT SURGE',
          subtitle: 'OVERCLOCK ×2',
          suit: 'overclock',
          energy: 1,
          draw: 1,
          score: 160,
        });
      } else if (suitId === 'siphon') {
        triggered.push({
          key: flushKey,
          name: 'VELVET DRAIN',
          subtitle: 'SIPHON FLUSH ×2',
          suit: 'siphon',
          heal: 5,
          jam: 3,
          score: 160,
        });
      }
    }

    const tripleKey = `triple:${suitId}`;
    if (count >= 3 && !triggeredKeys.has(tripleKey)) {
      triggeredKeys.add(tripleKey);
      triggered.push({
        key: tripleKey,
        name: 'SYNDICATE JACKPOT',
        subtitle: `${SUITS[suitId].name} TRIPLE ×3`,
        suit: suitId,
        damage: 12,
        pierce: true,
        shield: 6,
        score: 420,
      });
    }
  }

  const distinctSuits = Object.values(suitCounts).filter((n) => n > 0).length;
  const prismKey = 'prism:3';
  if (distinctSuits >= 3 && !triggeredKeys.has(prismKey)) {
    triggeredKeys.add(prismKey);
    triggered.push({
      key: prismKey,
      name: 'PRISM BREACH',
      subtitle: '3-SUIT SPECTRUM',
      suit: 'overclock',
      damage: 8,
      pierce: true,
      shield: 6,
      score: 320,
    });
  }

  return triggered;
}
