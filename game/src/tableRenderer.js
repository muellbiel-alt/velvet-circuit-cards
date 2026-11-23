// High-contrast Noir Cyber-Casino table renderer for Velvet Circuit.
// Uses a virtual 1280x720 coordinate system scaled cleanly to any viewport.

import { SUITS } from './cards.js';
import { getEffectiveIntentDamage } from './opponents.js';
import { previewCardOutcome } from './engine.js';
import { drawCardBack, drawCardFace, drawSuitEmblem, roundedRectPath } from './cardArt.js';

export const VIRTUAL_WIDTH = 1280;
export const VIRTUAL_HEIGHT = 720;

export function getTableLayout() {
  return {
    enemyCenter: { x: 640, y: 122 },
    railCenter: { x: 640, y: 316 },
    railSlots: [
      { x: 468, y: 316 },
      { x: 640, y: 316 },
      { x: 812, y: 316 },
    ],
    playerCenter: { x: 640, y: 572 },
    energyDial: { x: 132, y: 576, r: 42 },
    endTurnBtn: { x: 1094, y: 556, w: 148, h: 58 },
    drawPile: { x: 96, y: 446 },
    discardPile: { x: 1184, y: 446 },
    muteBtn: { x: 1148, y: 18, w: 50, h: 32 },
    restartBtn: { x: 1206, y: 18, w: 56, h: 32 },
    titlePlayBtn: { x: 520, y: 392, w: 240, h: 54 },
    modalActionBtn: { x: 510, y: 540, w: 260, h: 58 },
  };
}

function buildFeltCanvas() {
  if (typeof document === 'undefined') return null;
  const off = document.createElement('canvas');
  off.width = VIRTUAL_WIDTH;
  off.height = VIRTUAL_HEIGHT;
  const ctx = off.getContext('2d');

  // Deep radial emerald-obsidian casino felt
  const bg = ctx.createRadialGradient(640, 320, 60, 640, 360, 780);
  bg.addColorStop(0, '#13423b');
  bg.addColorStop(0.42, '#0c2c28');
  bg.addColorStop(0.78, '#071b1c');
  bg.addColorStop(1, '#040d0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Subtle deterministic woven felt micro-texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
  for (let y = 0; y < VIRTUAL_HEIGHT; y += 4) {
    for (let x = (y % 8 === 0 ? 0 : 2); x < VIRTUAL_WIDTH; x += 6) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // Outer mahogany & dark brass table border rail
  roundedRectPath(ctx, 22, 16, VIRTUAL_WIDTH - 44, VIRTUAL_HEIGHT - 32, 34);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#1b1410';
  ctx.stroke();

  roundedRectPath(ctx, 27, 21, VIRTUAL_WIDTH - 54, VIRTUAL_HEIGHT - 42, 28);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.58)';
  ctx.stroke();

  roundedRectPath(ctx, 37, 31, VIRTUAL_WIDTH - 74, VIRTUAL_HEIGHT - 62, 22);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.22)';
  ctx.stroke();

  // Art-deco inlaid felt arcs & geometric circuit traces
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(640, 348, 430, 172, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(25, 227, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(640, 348, 396, 146, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Corner art-deco brass diamonds
  const corners = [
    [66, 60],
    [VIRTUAL_WIDTH - 66, 60],
    [66, VIRTUAL_HEIGHT - 60],
    [VIRTUAL_WIDTH - 66, VIRTUAL_HEIGHT - 60],
  ];
  ctx.fillStyle = 'rgba(212, 175, 90, 0.45)';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx - 9, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Decorative brass & neon casino chip stacks on left/right felt wings
  drawChipStack(ctx, 84, 290, '#d4af5a', '#261b0b', 5);
  drawChipStack(ctx, 114, 314, '#ff4265', '#340b15', 3);
  drawChipStack(ctx, 1196, 290, '#19e3ff', '#07222b', 5);
  drawChipStack(ctx, 1166, 314, '#22e585', '#082919', 4);

  // Warm overhead banker's lamp spotlight bloom
  const lamp = ctx.createRadialGradient(640, 290, 30, 640, 330, 520);
  lamp.addColorStop(0, 'rgba(255, 223, 145, 0.14)');
  lamp.addColorStop(0.5, 'rgba(255, 200, 110, 0.04)');
  lamp.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  return off;
}

function drawChipStack(ctx, x, y, rimColor, coreColor, count) {
  for (let i = 0; i < count; i += 1) {
    const cy = y - i * 6;
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, cy, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, cy, 13, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function createTableRenderer() {
  const feltCanvas = buildFeltCanvas();
  const layout = getTableLayout();
  return {
    feltCanvas,
    layout,
    handCardRects: [],
    draftCardRects: [],
  };
}

function computeHandTransforms(hand, hoveredIndex, selectedIndex, isTitle) {
  const n = hand.length;
  if (n === 0) return [];
  const cardW = n >= 6 ? 128 : 138;
  const cardH = n >= 6 ? 182 : 194;
  const spread = n <= 4 ? 140 : n === 5 ? 126 : 112;
  const totalW = (n - 1) * spread;
  const baseY = isTitle ? 580 : 574;
  const transforms = [];

  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const isActive = i === hoveredIndex || i === selectedIndex;
    let pushX = 0;
    const focus = hoveredIndex >= 0 ? hoveredIndex : selectedIndex;
    if (focus >= 0 && focus !== i) {
      pushX = i < focus ? -18 : 18;
    }
    const x = 668 - totalW * 0.5 + i * spread + pushX;
    const arcY = t * t * 18;
    const lift = isActive ? (isTitle ? 16 : 30) : 0;
    const y = baseY + arcY - lift;
    const angle = isActive ? 0 : t * 0.085;
    const scale = isActive ? 1.09 : 1.0;
    transforms.push({ x, y, width: cardW, height: cardH, angle, scale, isActive });
  }
  return transforms;
}

function drawTopHudStrip(ctx, state, layout, audioMuted) {
  // Left status bar: Table & Turn & Suit Legend
  roundedRectPath(ctx, 44, 16, 372, 36, 10);
  ctx.fillStyle = 'rgba(7, 14, 18, 0.84)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.42)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#f5e4bd';
  ctx.font = '800 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TABLE ${state.tableIndex}/${state.totalTables}`, 60, 34);

  ctx.fillStyle = '#8aa8a6';
  ctx.fillText(`·  TURN ${state.turn}`, 142, 34);

  // Mini suit color+shape legend dots
  const suits = ['blade', 'circuit', 'overclock', 'siphon'];
  for (let i = 0; i < suits.length; i += 1) {
    drawSuitEmblem(ctx, suits[i], 246 + i * 40, 34, 8.5);
  }

  // Right status bar: Score, Chips, Controls
  roundedRectPath(ctx, 846, 16, 294, 36, 10);
  ctx.fillStyle = 'rgba(7, 14, 18, 0.84)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.42)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#9db7b5';
  ctx.font = '700 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 862, 34);
  ctx.fillStyle = '#ffe08a';
  ctx.font = '900 16px "Trebuchet MS", sans-serif';
  ctx.fillText(String(state.score).padStart(5, '0'), 912, 34);

  ctx.fillStyle = '#9db7b5';
  ctx.font = '700 11px "Trebuchet MS", sans-serif';
  ctx.fillText('CHIPS', 998, 34);
  ctx.fillStyle = '#22e585';
  ctx.font = '900 16px "Trebuchet MS", sans-serif';
  ctx.fillText(`$${state.credits}`, 1044, 34);

  // Mute button
  const m = layout.muteBtn;
  roundedRectPath(ctx, m.x, m.y, m.w, m.h, 8);
  ctx.fillStyle = 'rgba(10, 18, 22, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = audioMuted ? '#ff647f' : '#e9d6a7';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(audioMuted ? 'MUTE' : 'SFX', m.x + m.w * 0.5, m.y + m.h * 0.52);

  // Restart button
  const r = layout.restartBtn;
  roundedRectPath(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fillStyle = 'rgba(10, 18, 22, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#e9d6a7';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.fillText('RESET', r.x + r.w * 0.5, r.y + r.h * 0.52);
}

function drawOpponentZone(ctx, state, anim) {
  const opp = state.opponent;
  const lungeY = Math.sin((anim.enemyLunge / 0.32) * Math.PI) * 28;
  const baseY = 104 + lungeY;

  // Opponent's fanned 5-card hand at top of table: draw backs first, face-up intent card LAST on top!
  const cards = opp.handCards || [];
  const spread = 82;
  const startX = 640 - ((cards.length - 1) * spread) * 0.5;
  let intentItem = null;
  let intentCx = 640;
  let intentCy = baseY + 14;

  for (let i = 0; i < cards.length; i += 1) {
    const item = cards[i];
    const t = cards.length === 1 ? 0 : (i / (cards.length - 1)) * 2 - 1;
    const cx = startX + i * spread;
    const cy = baseY + 14 - Math.abs(t) * 14 + (item.activeIntent ? 12 : 0);
    const ang = -t * 0.14;

    if (item.revealed && item.card) {
      intentItem = item;
      intentCx = cx;
      intentCy = cy;
    } else {
      drawCardBack(ctx, {
        x: cx,
        y: cy,
        width: 82,
        height: 114,
        angle: ang,
        accent: opp.accent,
      });
    }
  }

  if (intentItem && intentItem.card) {
    const suit = SUITS[intentItem.card.suit] || SUITS.blade;
    const effDmg = getEffectiveIntentDamage(opp);
    const perHit = Math.max(0, intentItem.card.damage - opp.jammed);
    const pseudoCard = {
      name: intentItem.card.name,
      suit: intentItem.card.suit,
      cost: intentItem.card.hits || 1,
      value: intentItem.card.damage > 0 ? perHit : intentItem.card.shield,
      motif:
        intentItem.card.type === 'guard'
          ? 'shield'
          : intentItem.card.type === 'drain'
            ? 'siphon'
            : 'slash',
      summary:
        intentItem.card.hits > 1
          ? `${perHit}×${intentItem.card.hits} DMG`
          : intentItem.card.label,
      effects: { damage: effDmg, shield: intentItem.card.shield },
    };
    drawCardFace(ctx, pseudoCard, {
      x: intentCx,
      y: intentCy + 6,
      width: 112,
      height: 152,
      angle: 0,
      scale: 1,
      playable: true,
      highlighted: true,
      compact: true,
    });

    // Dedicated symmetrical INTENT CALLOUT PANEL on the right side of the opponent's hand
    const badgeX = 954;
    const badgeY = 112;
    roundedRectPath(ctx, badgeX - 118, badgeY - 42, 236, 86, 14);
    ctx.fillStyle = 'rgba(18, 9, 14, 0.92)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = opp.jammed > 0 ? '#19e3ff' : suit.color;
    ctx.stroke();

    drawSuitEmblem(ctx, intentItem.card.suit, badgeX - 88, badgeY, 15);

    ctx.fillStyle = '#c4b59c';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OPPONENT INTENT', badgeX - 60, badgeY - 20);

    ctx.fillStyle = opp.jammed > 0 ? '#74f0ff' : '#ff6b86';
    ctx.font = '900 22px "Trebuchet MS", sans-serif';
    const intentText =
      effDmg > 0
        ? intentItem.card.hits > 1
          ? `ATK ${perHit} × ${intentItem.card.hits}`
          : `ATK ${effDmg} DMG`
        : `SHD +${intentItem.card.shield}`;
    ctx.fillText(intentText, badgeX - 60, badgeY + 4);

    ctx.fillStyle = opp.jammed > 0 ? '#88f2ff' : '#a7b4b8';
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    const subText =
      opp.jammed > 0
        ? `JAMMED (-${opp.jammed} PER HIT)`
        : intentItem.card.shield > 0
          ? `ALSO GAINS +${intentItem.card.shield} SHD`
          : 'COUNTER WITH SHIELD OR JAM';
    ctx.fillText(subText, badgeX - 60, badgeY + 25, 168);
  }

  // Opponent Nameplate & HP / Shield Bar (left of opponent hand for crystal clarity)
  const px = 216;
  const py = 112;
  roundedRectPath(ctx, px - 166, py - 42, 294, 86, 14);
  ctx.fillStyle = anim.enemyFlash > 0 ? 'rgba(130, 24, 42, 0.92)' : 'rgba(9, 15, 21, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = anim.enemyFlash > 0 ? '#ff6b86' : opp.accent;
  ctx.stroke();

  ctx.fillStyle = '#f8f2e4';
  ctx.font = '900 17px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(opp.name, px - 148, py - 18);

  ctx.fillStyle = '#a5b8b8';
  ctx.font = '700 11px "Trebuchet MS", sans-serif';
  ctx.fillText(opp.title, px - 148, py - 1);

  // Opponent HP bar
  const barX = px - 148;
  const barY = py + 12;
  const barW = 196;
  const barH = 20;
  roundedRectPath(ctx, barX, barY, barW, barH, 8);
  ctx.fillStyle = '#1b0d13';
  ctx.fill();
  const hpRatio = Math.max(0, Math.min(1, opp.hp / Math.max(1, opp.maxHp)));
  if (hpRatio > 0) {
    roundedRectPath(ctx, barX, barY, Math.max(14, barW * hpRatio), barH, 8);
    const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    hpGrad.addColorStop(0, '#d92347');
    hpGrad.addColorStop(1, '#ff5f7d');
    ctx.fillStyle = hpGrad;
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.2;
  roundedRectPath(ctx, barX, barY, barW, barH, 8);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP ${opp.hp} / ${opp.maxHp}`, barX + barW * 0.5, barY + barH * 0.55);

  // Opponent Shield Pill
  roundedRectPath(ctx, barX + barW + 10, barY - 2, 54, 24, 8);
  ctx.fillStyle = opp.shield > 0 ? '#0c3340' : '#111820';
  ctx.fill();
  ctx.strokeStyle = opp.shield > 0 ? '#19e3ff' : '#354552';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = opp.shield > 0 ? '#88f2ff' : '#6c7c88';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.fillText(`SHD ${opp.shield}`, barX + barW + 37, barY + 11);

  // Status badges (Marked / Jammed) right of opponent panel
  let badgeOffset = 0;
  if (opp.marked > 0) {
    roundedRectPath(ctx, px - 148 + badgeOffset, py + 48, 92, 22, 8);
    ctx.fillStyle = 'rgba(255, 66, 101, 0.24)';
    ctx.fill();
    ctx.strokeStyle = '#ff4265';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#ff9aad';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MARKED +2`, px - 102 + badgeOffset, py + 60);
    badgeOffset += 100;
  }
  if (opp.jammed > 0) {
    roundedRectPath(ctx, px - 148 + badgeOffset, py + 48, 96, 22, 8);
    ctx.fillStyle = 'rgba(25, 227, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#19e3ff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#8ef3ff';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`JAMMED -${opp.jammed}`, px - 100 + badgeOffset, py + 60);
  }
}

function drawCircuitRail(ctx, state, anim, layout) {
  const slots = layout.railSlots;
  const railCards = state.circuitRail;

  // Glowing golden/cyan circuit bus connecting the 3 center card slots
  ctx.save();
  ctx.strokeStyle = anim.comboPulse > 0 ? '#ffbe30' : 'rgba(212, 175, 90, 0.38)';
  ctx.lineWidth = anim.comboPulse > 0 ? 4.5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(slots[0].x, slots[0].y);
  ctx.lineTo(slots[2].x, slots[2].y);
  ctx.stroke();

  // Suit link pulse between played cards on the rail
  if (railCards.length >= 2) {
    const lastSuit = SUITS[railCards[railCards.length - 1].suit] || SUITS.overclock;
    ctx.strokeStyle = lastSuit.color;
    ctx.lineWidth = 4;
    ctx.shadowColor = lastSuit.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(slots[0].x, slots[0].y);
    ctx.lineTo(slots[Math.min(2, railCards.length - 1)].x, slots[0].y);
    ctx.stroke();
  }
  ctx.restore();

  // Draw the 3 velvet circuit slots & played cards
  for (let i = 0; i < slots.length; i += 1) {
    const s = slots[i];
    const card = railCards[i];
    if (card) {
      drawCardFace(ctx, card, {
        x: s.x,
        y: s.y,
        width: 122,
        height: 170,
        angle: (i - 1) * 0.03,
        scale: 1,
        playable: true,
        highlighted: anim.comboPulse > 0,
        compact: true,
      });
    } else {
      ctx.save();
      roundedRectPath(ctx, s.x - 58, s.y - 82, 116, 164, 12);
      ctx.fillStyle = 'rgba(5, 16, 17, 0.45)';
      ctx.fill();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(212, 175, 90, 0.34)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(212, 175, 90, 0.34)';
      ctx.font = '800 11px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CIRCUIT ${i + 1}`, s.x, s.y);
      ctx.restore();
    }
  }

  // Synergy progress indicator right under the rail
  const syY = 418;
  const suitCounts = { blade: 0, circuit: 0, overclock: 0, siphon: 0 };
  for (const c of railCards) {
    if (suitCounts[c.suit] !== undefined) suitCounts[c.suit] += 1;
  }
  const activeSynergyText =
    state.activeBanner && state.phase === 'playing'
      ? `${state.activeBanner.title} · ${state.activeBanner.subtitle}`
      : railCards.length === 0
        ? 'PLAY 2 SAME-SUIT CARDS FOR FLUSH SURGE · 3 SUITS FOR PRISM BREACH'
        : `CIRCUIT CHAIN ${railCards.length}/3 — ADD MATCHING SUIT TO TRIGGER SURGE`;

  roundedRectPath(ctx, 355, syY - 14, 570, 28, 12);
  ctx.fillStyle =
    anim.comboPulse > 0 ? 'rgba(62, 42, 8, 0.92)' : 'rgba(6, 15, 18, 0.8)';
  ctx.fill();
  ctx.strokeStyle = anim.comboPulse > 0 ? '#ffbe30' : 'rgba(212, 175, 90, 0.36)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = anim.comboPulse > 0 ? '#ffe08a' : '#d2c29d';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(activeSynergyText, 640, syY + 1);
}

function drawPlayerHudAndPiles(ctx, state, anim, layout) {
  // Draw Pile stack (left)
  for (let i = 0; i < Math.min(3, Math.max(1, state.drawPile.length)); i += 1) {
    drawCardBack(ctx, {
      x: layout.drawPile.x - i * 3,
      y: layout.drawPile.y - i * 3,
      width: 68,
      height: 94,
      accent: '#d4af5a',
    });
  }
  roundedRectPath(ctx, layout.drawPile.x - 36, layout.drawPile.y + 38, 72, 22, 8);
  ctx.fillStyle = 'rgba(7, 13, 18, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#f2e2bb';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`DECK ${state.drawPile.length}`, layout.drawPile.x, layout.drawPile.y + 50);

  // Discard Pile stack (right)
  if (state.discardPile.length > 0) {
    for (let i = 0; i < Math.min(3, state.discardPile.length); i += 1) {
      drawCardBack(ctx, {
        x: layout.discardPile.x + i * 2,
        y: layout.discardPile.y - i * 3,
        width: 68,
        height: 94,
        accent: '#6d7b8c',
      });
    }
  } else {
    roundedRectPath(ctx, layout.discardPile.x - 34, layout.discardPile.y - 47, 68, 94, 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  roundedRectPath(ctx, layout.discardPile.x - 38, layout.discardPile.y + 38, 76, 22, 8);
  ctx.fillStyle = 'rgba(7, 13, 18, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(130, 150, 165, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#c0cfd6';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.fillText(`DISC ${state.discardPile.length}`, layout.discardPile.x, layout.discardPile.y + 50);

  // Energy Core Dial (bottom-left)
  const dial = layout.energyDial;
  ctx.save();
  const hasEnergy = state.player.energy > 0;
  ctx.shadowColor = hasEnergy ? '#ffbe30' : 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = hasEnergy ? 24 : 8;
  const dGrad = ctx.createRadialGradient(dial.x - 10, dial.y - 12, 4, dial.x, dial.y, dial.r);
  dGrad.addColorStop(0, hasEnergy ? '#fff0b3' : '#4a5560');
  dGrad.addColorStop(0.55, hasEnergy ? '#e69b12' : '#252c33');
  dGrad.addColorStop(1, '#261805');
  ctx.beginPath();
  ctx.arc(dial.x, dial.y, dial.r, 0, Math.PI * 2);
  ctx.fillStyle = dGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f8e6b5';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#120d04';
  ctx.font = '900 28px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${state.player.energy}/${state.player.maxEnergy}`, dial.x, dial.y - 2);
  ctx.fillStyle = '#291a04';
  ctx.font = '900 10px "Trebuchet MS", sans-serif';
  ctx.fillText('ENERGY', dial.x, dial.y + 22);

  // Player Vitality Panel (bottom-left, cleanly separated from fanned hand)
  const pX = 44;
  const pY = 644;
  roundedRectPath(ctx, pX, pY, 246, 46, 12);
  ctx.fillStyle = anim.playerFlash > 0 ? 'rgba(130, 22, 40, 0.92)' : 'rgba(8, 16, 20, 0.92)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = anim.playerFlash > 0 ? '#ff627d' : '#22e585';
  ctx.stroke();

  // HP Bar
  const hpX = pX + 10;
  const hpY = pY + 12;
  const hpW = 140;
  const hpH = 22;
  roundedRectPath(ctx, hpX, hpY, hpW, hpH, 8);
  ctx.fillStyle = '#0c2419';
  ctx.fill();
  const pRatio = Math.max(0, Math.min(1, state.player.hp / Math.max(1, state.player.maxHp)));
  if (pRatio > 0) {
    roundedRectPath(ctx, hpX, hpY, Math.max(14, hpW * pRatio), hpH, 8);
    const pGrad = ctx.createLinearGradient(hpX, hpY, hpX + hpW, hpY);
    pGrad.addColorStop(0, '#0da65a');
    pGrad.addColorStop(1, '#31f597');
    ctx.fillStyle = pGrad;
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP ${state.player.hp} / ${state.player.maxHp}`, hpX + hpW * 0.5, hpY + 12);

  // Player Shield Pill
  roundedRectPath(ctx, hpX + hpW + 8, hpY, 78, hpH, 8);
  ctx.fillStyle = state.player.shield > 0 ? '#0d3645' : '#101820';
  ctx.fill();
  ctx.strokeStyle = state.player.shield > 0 ? '#19e3ff' : '#354854';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = state.player.shield > 0 ? '#8ef4ff' : '#738996';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.fillText(`SHD ${state.player.shield}`, hpX + hpW + 47, hpY + 12);

  // Active Counter / Amp indicators above player HP
  let pillY = 516;
  if (state.player.counter > 0) {
    roundedRectPath(ctx, 184, pillY, 106, 24, 8);
    ctx.fillStyle = 'rgba(25, 227, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#19e3ff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#8ef3ff';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillText(`COUNTER ${state.player.counter}`, 237, pillY + 13);
    pillY += 30;
  }
  if (state.player.amp > 0) {
    roundedRectPath(ctx, 184, pillY, 106, 24, 8);
    ctx.fillStyle = 'rgba(255, 190, 48, 0.24)';
    ctx.fill();
    ctx.strokeStyle = '#ffbe30';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillText(`AMP +${state.player.amp}`, 237, pillY + 13);
  }

  // END TURN Button (bottom-right)
  const btn = layout.endTurnBtn;
  const activeBtn = state.phase === 'playing';
  ctx.save();
  if (activeBtn) {
    ctx.shadowColor = 'rgba(255, 66, 101, 0.45)';
    ctx.shadowBlur = 16;
  }
  roundedRectPath(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  const bGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
  bGrad.addColorStop(0, activeBtn ? '#d63354' : '#2a333c');
  bGrad.addColorStop(1, activeBtn ? '#881630' : '#181e24');
  ctx.fillStyle = bGrad;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = activeBtn ? '#ffbe30' : '#4a5560';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = activeBtn ? '#fff6e0' : '#8593a0';
  ctx.font = '900 16px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('END TURN', btn.x + btn.w * 0.5, btn.y + 24);
  ctx.fillStyle = activeBtn ? '#ffd480' : '#65727d';
  ctx.font = '700 11px "Trebuchet MS", sans-serif';
  ctx.fillText('[SPACE / E]', btn.x + btn.w * 0.5, btn.y + 43);
}

function drawPlayerHand(ctx, state, renderer) {
  const isTitle = state.phase === 'title';
  const transforms = computeHandTransforms(
    state.hand,
    state.hoveredHandIndex,
    state.selectedHandIndex,
    isTitle,
  );
  renderer.handCardRects = [];

  // Draw non-active cards first, then active card on top for crisp overlap
  const order = [];
  for (let i = 0; i < state.hand.length; i += 1) {
    if (!transforms[i].isActive) order.push(i);
  }
  for (let i = 0; i < state.hand.length; i += 1) {
    if (transforms[i].isActive) order.push(i);
  }

  for (const i of order) {
    const card = state.hand[i];
    const tf = transforms[i];
    const preview = previewCardOutcome(state, i);
    const playable = isTitle ? true : Boolean(preview && preview.canAfford);
    const comboReady = !isTitle && Boolean(preview && preview.potentialCombos.length > 0);

    drawCardFace(ctx, card, {
      x: tf.x,
      y: tf.y,
      width: tf.width,
      height: tf.height,
      angle: tf.angle,
      scale: tf.scale,
      playable,
      highlighted: tf.isActive,
      comboReady,
      slotIndex: i,
      ampBonus: state.player.amp,
    });

    renderer.handCardRects[i] = {
      index: i,
      x: tf.x - (tf.width * tf.scale) * 0.5,
      y: tf.y - (tf.height * tf.scale) * 0.5,
      w: tf.width * tf.scale,
      h: tf.height * tf.scale,
      cx: tf.x,
      cy: tf.y,
    };
  }

  // Curved targeting laser arc when hovering or selecting a playable attack card!
  const focusIdx = state.hoveredHandIndex >= 0 ? state.hoveredHandIndex : state.selectedHandIndex;
  if (state.phase === 'playing' && focusIdx >= 0 && transforms[focusIdx]) {
    const preview = previewCardOutcome(state, focusIdx);
    if (preview && preview.canAfford && preview.damage > 0) {
      const from = transforms[focusIdx];
      const to = renderer.layout.enemyCenter;
      const suit = SUITS[preview.card.suit] || SUITS.blade;
      ctx.save();
      ctx.strokeStyle = suit.color;
      ctx.lineWidth = 3.2;
      ctx.setLineDash([10, 8]);
      ctx.shadowColor = suit.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y - from.height * 0.52);
      ctx.quadraticCurveTo((from.x + to.x) * 0.5, 290, to.x, to.y + 42);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live damage preview tag near target
      const tagText = preview.pierce ? `-${preview.damage} PIERCE` : `-${preview.damage} DMG`;
      roundedRectPath(ctx, to.x - 58, to.y + 58, 116, 28, 9);
      ctx.fillStyle = 'rgba(20, 8, 12, 0.94)';
      ctx.fill();
      ctx.strokeStyle = suit.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffe08a';
      ctx.font = '900 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tagText, to.x, to.y + 73);
      ctx.restore();
    }
  }
}

function drawTitleOverlay(ctx, state, layout) {
  // Action-first Art-Deco title crest flanked cleanly by two illuminated showcase cards
  // so nothing collides behind the crest and the player's fanned hand stays razor-sharp!
  ctx.save();
  const cx = 640;
  const cy = 310;

  // Luminous golden circuit traces connecting flanking showcase cards to the crest
  ctx.strokeStyle = 'rgba(255, 190, 48, 0.42)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(270, 326);
  ctx.lineTo(1010, 326);
  ctx.stroke();

  if (state.circuitRail[0]) {
    drawCardFace(ctx, state.circuitRail[0], {
      x: 262,
      y: 326,
      width: 122,
      height: 170,
      angle: -0.1,
      playable: true,
      highlighted: true,
      compact: true,
    });
  }
  if (state.circuitRail[1]) {
    drawCardFace(ctx, state.circuitRail[1], {
      x: 1018,
      y: 326,
      width: 122,
      height: 170,
      angle: 0.1,
      playable: true,
      highlighted: true,
      compact: true,
    });
  }

  // Art-Deco brass title plate
  roundedRectPath(ctx, cx - 252, cy - 72, 504, 134, 20);
  const pGrad = ctx.createLinearGradient(cx - 250, cy - 72, cx + 250, cy + 62);
  pGrad.addColorStop(0, 'rgba(13, 24, 28, 0.96)');
  pGrad.addColorStop(0.5, 'rgba(18, 34, 36, 0.96)');
  pGrad.addColorStop(1, 'rgba(11, 20, 24, 0.96)');
  ctx.fillStyle = pGrad;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#d4af5a';
  ctx.stroke();

  roundedRectPath(ctx, cx - 244, cy - 64, 488, 118, 15);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 224, 138, 0.35)';
  ctx.stroke();

  // 4 suit emblems flanking the top ribbon
  drawSuitEmblem(ctx, 'blade', cx - 196, cy - 36, 11);
  drawSuitEmblem(ctx, 'circuit', cx - 166, cy - 36, 11);
  drawSuitEmblem(ctx, 'overclock', cx + 166, cy - 36, 11);
  drawSuitEmblem(ctx, 'siphon', cx + 196, cy - 36, 11);

  ctx.fillStyle = '#d4af5a';
  ctx.font = '800 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CYBER-NOIR TACTICAL DECKBUILDER', cx, cy - 36);

  // Main Title
  ctx.shadowColor = 'rgba(255, 190, 48, 0.45)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#fff5dc';
  ctx.font = '900 50px "Trebuchet MS", sans-serif';
  ctx.fillText('VELVET CIRCUIT', cx, cy + 16);
  ctx.shadowBlur = 0;

  // Compact tactile CTA Button
  const btn = layout.titlePlayBtn;
  ctx.shadowColor = 'rgba(255, 190, 48, 0.55)';
  ctx.shadowBlur = 22;
  roundedRectPath(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  const bGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
  bGrad.addColorStop(0, '#ffd466');
  bGrad.addColorStop(1, '#c98812');
  ctx.fillStyle = bGrad;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#fff6dc';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#120d04';
  ctx.font = '900 22px "Trebuchet MS", sans-serif';
  ctx.fillText('DEAL IN  [ENTER]', btn.x + btn.w * 0.5, btn.y + btn.h * 0.53);

  ctx.restore();
}

function drawDraftOverlay(ctx, state, renderer) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 10, 12, 0.78)';
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  roundedRectPath(ctx, 210, 106, 860, 506, 22);
  ctx.fillStyle = 'rgba(11, 22, 26, 0.96)';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#d4af5a';
  ctx.stroke();

  ctx.fillStyle = '#22e585';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`TABLE ${state.tableIndex} CLEARED · +12 HP RESTORED`, 640, 152);

  ctx.fillStyle = '#fff3d6';
  ctx.font = '900 34px "Trebuchet MS", sans-serif';
  ctx.fillText('VAULT DRAFT — ADD 1 RARE CARD', 640, 194);

  renderer.draftCardRects = [];
  const choices = state.draftChoices || [];
  const spacing = 248;
  const startX = 640 - ((choices.length - 1) * spacing) * 0.5;

  for (let i = 0; i < choices.length; i += 1) {
    const cx = startX + i * spacing;
    const cy = 382;
    const hovered = state.hoveredHandIndex === i;
    drawCardFace(ctx, choices[i], {
      x: cx,
      y: cy - (hovered ? 14 : 0),
      width: 184,
      height: 256,
      scale: hovered ? 1.06 : 1,
      playable: true,
      highlighted: hovered,
      slotIndex: i,
    });
    renderer.draftCardRects[i] = {
      index: i,
      x: cx - 96,
      y: cy - 134,
      w: 192,
      h: 268,
    };
  }

  ctx.fillStyle = '#c2b494';
  ctx.font = '700 13px "Trebuchet MS", sans-serif';
  ctx.fillText('CLICK A CARD OR PRESS [1] [2] [3] TO ADVANCE TO THE NEXT TABLE', 640, 566);
  ctx.restore();
}

function drawEndOverlay(ctx, state, layout, isVictory) {
  ctx.save();
  ctx.fillStyle = isVictory ? 'rgba(4, 18, 14, 0.72)' : 'rgba(22, 5, 9, 0.76)';
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  const accent = isVictory ? '#ffbe30' : '#ff4265';
  const secondary = isVictory ? '#22e585' : '#ff8a9e';

  // Radial spotlight behind panel
  const spot = ctx.createRadialGradient(640, 340, 40, 640, 340, 440);
  spot.addColorStop(0, isVictory ? 'rgba(255, 190, 48, 0.24)' : 'rgba(255, 66, 101, 0.26)');
  spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Main Result Plaque
  roundedRectPath(ctx, 290, 134, 700, 488, 24);
  const grad = ctx.createLinearGradient(290, 134, 290, 622);
  grad.addColorStop(0, isVictory ? '#112622' : '#240c13');
  grad.addColorStop(1, '#081014');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.stroke();

  roundedRectPath(ctx, 302, 146, 676, 464, 18);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.stroke();

  // Suit emblem crown header
  drawSuitEmblem(ctx, isVictory ? 'overclock' : 'blade', 640, 186, 20, accent);

  ctx.fillStyle = secondary;
  ctx.font = '800 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    isVictory ? 'ALL THREE SYNDICATE TABLES CLEARED' : `ELIMINATED AT TABLE ${state.tableIndex} · ${state.opponent.name}`,
    640,
    228,
  );

  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  ctx.fillStyle = isVictory ? '#fff3cf' : '#ffdce3';
  ctx.font = '900 54px "Trebuchet MS", sans-serif';
  ctx.fillText(isVictory ? 'VICTORY' : 'DEFEAT', 640, 286);
  ctx.shadowBlur = 0;

  ctx.fillStyle = accent;
  ctx.font = '800 16px "Trebuchet MS", sans-serif';
  ctx.fillText(isVictory ? 'HOUSE BROKEN · VAULT CLEARED' : 'FLATLINED · THE HOUSE WINS', 640, 326);

  // 4-Stat Crisp Breakdown Grid
  const stats = [
    { label: 'FINAL SCORE', value: String(state.score).padStart(5, '0'), color: '#ffe08a' },
    { label: 'CHIPS WON', value: `$${state.credits}`, color: '#22e585' },
    { label: 'COMBOS', value: String(state.combosTriggered), color: '#19e3ff' },
    { label: 'TURNS / DECK', value: `${state.totalTurns}T · ${state.masterDeck.length}C`, color: '#f3e7d1' },
  ];

  for (let i = 0; i < stats.length; i += 1) {
    const sx = 342 + i * 154;
    const sy = 374;
    roundedRectPath(ctx, sx, sy, 138, 92, 12);
    ctx.fillStyle = 'rgba(5, 11, 15, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 90, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#96aba9';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillText(stats[i].label, sx + 69, sy + 28);

    ctx.fillStyle = stats[i].color;
    ctx.font = '900 23px "Trebuchet MS", sans-serif';
    ctx.fillText(stats[i].value, sx + 69, sy + 62);
  }

  // Primary Action Button
  const btn = layout.modalActionBtn;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  roundedRectPath(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  const btnGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
  btnGrad.addColorStop(0, isVictory ? '#ffd466' : '#ff5273');
  btnGrad.addColorStop(1, isVictory ? '#c7830d' : '#a81936');
  ctx.fillStyle = btnGrad;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#fff5dd';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = isVictory ? '#120d04' : '#ffffff';
  ctx.font = '900 20px "Trebuchet MS", sans-serif';
  ctx.fillText(isVictory ? 'DEAL NEW RUN  [R]' : 'DEAL AGAIN  [R]', btn.x + btn.w * 0.5, btn.y + btn.h * 0.53);

  ctx.restore();
}

function drawAnimationsOverlay(ctx, anim) {
  // Active flying cards
  for (const f of anim.flights) {
    const t = Math.min(1, f.age / f.duration);
    const e = 1 - Math.pow(1 - t, 3);
    const inv = 1 - e;
    const x = inv * inv * f.fromX + 2 * inv * e * f.ctrlX + e * e * f.toX;
    const y = inv * inv * f.fromY + 2 * inv * e * f.ctrlY + e * e * f.toY;
    drawCardFace(ctx, f.card, {
      x,
      y,
      width: 128,
      height: 178,
      angle: (1 - e) * 0.25,
      scale: 0.92 + Math.sin(e * Math.PI) * 0.16,
      playable: true,
      highlighted: true,
      compact: true,
    });
  }

  // Particles (casino chips & sparks)
  for (const pt of anim.particles) {
    const alpha = Math.max(0, 1 - pt.age / pt.duration);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rotation);
    if (pt.shape === 'chip') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.fillRect(-pt.size, -pt.size * 0.4, pt.size * 2, pt.size * 0.8);
    }
    ctx.restore();
  }

  // Floating combat popups
  for (const pop of anim.popups) {
    const alpha = Math.max(0, 1 - Math.pow(pop.age / pop.duration, 1.8));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${Math.round(24 * pop.scale)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(5, 8, 12, 0.92)';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }
}

export function renderGameFrame(ctx, canvasWidth, canvasHeight, state, anim, renderer, audioMuted = false) {
  ctx.save();
  ctx.fillStyle = '#040b0c';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const scale = Math.min(canvasWidth / VIRTUAL_WIDTH, canvasHeight / VIRTUAL_HEIGHT);
  const offsetX = (canvasWidth - VIRTUAL_WIDTH * scale) * 0.5;
  const offsetY = (canvasHeight - VIRTUAL_HEIGHT * scale) * 0.5;

  const shakeX =
    anim.shakeTime > 0 ? Math.sin(anim.time * 75) * anim.shakeMagnitude : 0;
  const shakeY =
    anim.shakeTime > 0 ? Math.cos(anim.time * 63) * anim.shakeMagnitude * 0.6 : 0;

  ctx.translate(offsetX + shakeX * scale, offsetY + shakeY * scale);
  ctx.scale(scale, scale);

  // 1. Pre-rendered woven noir felt table
  if (renderer.feltCanvas) {
    ctx.drawImage(renderer.feltCanvas, 0, 0);
  }

  // 2. Top HUD strip
  drawTopHudStrip(ctx, state, renderer.layout, audioMuted);

  // 3. Opponent hand, intent card & HP/Shield panel
  drawOpponentZone(ctx, state, anim);

  // 4. Center 3-slot Circuit Rail (or Title Showcase Crest on title phase)
  if (state.phase === 'title') {
    drawTitleOverlay(ctx, state, renderer.layout);
  } else {
    drawCircuitRail(ctx, state, anim, renderer.layout);
  }

  // 5. Player decks, energy dial, vitality panel, End Turn button
  drawPlayerHudAndPiles(ctx, state, anim, renderer.layout);

  // 6. Player fanned hand & targeting arc (always razor-sharp in foreground!)
  drawPlayerHand(ctx, state, renderer);

  // 7. Phase modal overlays (Vault Draft / Victory / Defeat)
  if (state.phase === 'draft') {
    drawDraftOverlay(ctx, state, renderer);
  } else if (state.phase === 'victory') {
    drawEndOverlay(ctx, state, renderer.layout, true);
  } else if (state.phase === 'defeat') {
    drawEndOverlay(ctx, state, renderer.layout, false);
  }

  // 8. Particles, card flights, floating numbers (rendered on top for crisp flourish!)
  drawAnimationsOverlay(ctx, anim);

  ctx.restore();
}

export function clientToVirtual(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / VIRTUAL_WIDTH, rect.height / VIRTUAL_HEIGHT);
  const offsetX = (rect.width - VIRTUAL_WIDTH * scale) * 0.5;
  const offsetY = (rect.height - VIRTUAL_HEIGHT * scale) * 0.5;
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function hitTestInteractive(vx, vy, state, renderer) {
  const layout = renderer.layout;
  if (pointInRect(vx, vy, layout.muteBtn)) return { type: 'mute' };
  if (pointInRect(vx, vy, layout.restartBtn)) return { type: 'restart' };

  if (state.phase === 'title') {
    if (pointInRect(vx, vy, layout.titlePlayBtn)) return { type: 'start_game' };
    return null;
  }

  if (state.phase === 'draft') {
    for (let i = 0; i < renderer.draftCardRects.length; i += 1) {
      const r = renderer.draftCardRects[i];
      if (r && pointInRect(vx, vy, r)) return { type: 'draft_card', index: i };
    }
    return null;
  }

  if (state.phase === 'victory' || state.phase === 'defeat') {
    if (pointInRect(vx, vy, layout.modalActionBtn)) return { type: 'restart' };
    return null;
  }

  // Playing phase: check active/hovered card first, then right-to-left hand cards
  if (pointInRect(vx, vy, layout.endTurnBtn)) return { type: 'end_turn' };

  const activeIdx = state.hoveredHandIndex >= 0 ? state.hoveredHandIndex : state.selectedHandIndex;
  if (activeIdx >= 0 && renderer.handCardRects[activeIdx]) {
    if (pointInRect(vx, vy, renderer.handCardRects[activeIdx])) {
      return { type: 'hand_card', index: activeIdx };
    }
  }

  for (let i = renderer.handCardRects.length - 1; i >= 0; i -= 1) {
    const r = renderer.handCardRects[i];
    if (r && pointInRect(vx, vy, r)) {
      return { type: 'hand_card', index: i };
    }
  }
  return null;
}
