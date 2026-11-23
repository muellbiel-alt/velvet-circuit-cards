// Bespoke vector card renderer for Velvet Circuit.
// Every suit has a distinct geometric shape AND color palette so cards read
// clearly at full resolution and at contact-sheet thumbnail size.

import { SUITS } from './cards.js';

export function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawSuitEmblem(ctx, suitId, cx, cy, radius, colorOverride = null) {
  const suit = SUITS[suitId] || SUITS.overclock;
  const fill = colorOverride || suit.color;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.1, radius * 0.11);

  if (suit.shape === 'dagger') {
    // Sharp crimson blade/spade spearhead
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.15);
    ctx.lineTo(radius * 0.72, -radius * 0.1);
    ctx.lineTo(radius * 0.28, radius * 0.35);
    ctx.lineTo(radius * 0.52, radius * 0.55);
    ctx.lineTo(0, radius * 1.05);
    ctx.lineTo(-radius * 0.52, radius * 0.55);
    ctx.lineTo(-radius * 0.28, radius * 0.35);
    ctx.lineTo(-radius * 0.72, -radius * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (suit.shape === 'diamond') {
    // Faceted cyan circuit hex-diamond
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.1);
    ctx.lineTo(radius * 0.92, -radius * 0.22);
    ctx.lineTo(radius * 0.92, radius * 0.22);
    ctx.lineTo(0, radius * 1.1);
    ctx.lineTo(-radius * 0.92, radius * 0.22);
    ctx.lineTo(-radius * 0.92, -radius * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#071c24';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.45);
    ctx.lineTo(radius * 0.38, 0);
    ctx.lineTo(0, radius * 0.45);
    ctx.lineTo(-radius * 0.38, 0);
    ctx.closePath();
    ctx.fill();
  } else if (suit.shape === 'bolt') {
    // Amber overclock lightning chevron
    ctx.beginPath();
    ctx.moveTo(radius * 0.22, -radius * 1.12);
    ctx.lineTo(-radius * 0.78, radius * 0.08);
    ctx.lineTo(-radius * 0.08, radius * 0.08);
    ctx.lineTo(-radius * 0.28, radius * 1.12);
    ctx.lineTo(radius * 0.82, -radius * 0.16);
    ctx.lineTo(radius * 0.08, -radius * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Jade siphon clover-heart
    ctx.beginPath();
    ctx.arc(-radius * 0.42, -radius * 0.24, radius * 0.48, 0, Math.PI * 2);
    ctx.arc(radius * 0.42, -radius * 0.24, radius * 0.48, 0, Math.PI * 2);
    ctx.arc(0, radius * 0.26, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#062015';
    ctx.lineWidth = Math.max(1.2, radius * 0.14);
    ctx.beginPath();
    ctx.arc(0, -radius * 0.04, radius * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCardMotif(ctx, card, cx, cy, r, suit) {
  ctx.save();
  ctx.translate(cx, cy);

  // Illuminated dark-velvet medallion
  const grad = ctx.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r * 1.15);
  grad.addColorStop(0, suit.dark);
  grad.addColorStop(1, '#090e14');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = suit.color;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Bespoke geometric art per card motif
  ctx.strokeStyle = suit.glow;
  ctx.fillStyle = suit.color;
  ctx.lineWidth = 2.4;

  const motif = card.motif || 'slash';
  if (motif === 'slash' || motif === 'pierce' || motif === 'ace_blade') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, r * 0.62);
    ctx.quadraticCurveTo(0, -r * 0.12, r * 0.76, -r * 0.68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.55);
    ctx.lineTo(r * 0.55, r * 0.48);
    ctx.stroke();
    drawSuitEmblem(ctx, card.suit, 0, -r * 0.08, r * 0.44);
  } else if (motif === 'crown_blade') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, r * 0.35);
    ctx.lineTo(-r * 0.52, -r * 0.35);
    ctx.lineTo(-r * 0.15, 0);
    ctx.lineTo(0, -r * 0.62);
    ctx.lineTo(r * 0.15, 0);
    ctx.lineTo(r * 0.52, -r * 0.35);
    ctx.lineTo(r * 0.65, r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (motif === 'shield' || motif === 'fortress' || motif === 'parry') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72);
    ctx.lineTo(r * 0.64, -r * 0.36);
    ctx.lineTo(r * 0.52, r * 0.36);
    ctx.lineTo(0, r * 0.76);
    ctx.lineTo(-r * 0.52, r * 0.36);
    ctx.lineTo(-r * 0.64, -r * 0.36);
    ctx.closePath();
    ctx.fillStyle = suit.dark;
    ctx.fill();
    ctx.stroke();
    drawSuitEmblem(ctx, card.suit, 0, 0, r * 0.38);
  } else if (motif === 'wave') {
    for (let k = -1; k <= 1; k += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.36 + (k + 1) * 0.24), -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.36 + (k + 1) * 0.24), Math.PI - 0.8, Math.PI + 0.8);
      ctx.stroke();
    }
    drawSuitEmblem(ctx, card.suit, 0, 0, r * 0.32);
  } else if (motif === 'chip_stack' || motif === 'spark') {
    ctx.fillStyle = suit.dark;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawSuitEmblem(ctx, card.suit, 0, 0, r * 0.38);
  } else {
    // siphon / hex
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(a) * r * 0.68;
      const py = Math.sin(a) * r * 0.68;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = suit.dark;
    ctx.fill();
    ctx.stroke();
    drawSuitEmblem(ctx, card.suit, 0, 0, r * 0.4);
  }

  ctx.restore();
}

export function drawCardFace(ctx, card, opts = {}) {
  const {
    x = 0,
    y = 0,
    width = 148,
    height = 208,
    angle = 0,
    scale = 1,
    playable = true,
    highlighted = false,
    comboReady = false,
    slotIndex = null,
    ampBonus = 0,
    compact = false,
  } = opts;

  const suit = SUITS[card.suit] || SUITS.overclock;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const radius = Math.max(10, width * 0.085);

  // Drop shadow & neon rim glow
  ctx.save();
  ctx.shadowColor = highlighted
    ? suit.color
    : comboReady
      ? '#ffbe30'
      : 'rgba(0, 0, 0, 0.72)';
  ctx.shadowBlur = highlighted ? 28 : comboReady ? 20 : 16;
  ctx.shadowOffsetY = highlighted ? 12 : 9;

  const bodyGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
  bodyGrad.addColorStop(0, '#18202c');
  bodyGrad.addColorStop(0.55, '#10151f');
  bodyGrad.addColorStop(1, suit.panel);
  roundedRectPath(ctx, -halfW, -halfH, width, height, radius);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.restore();

  // Outer bevel border
  roundedRectPath(ctx, -halfW, -halfH, width, height, radius);
  ctx.lineWidth = highlighted ? 3.2 : 2.2;
  ctx.strokeStyle = highlighted ? '#fff3cf' : playable ? suit.color : '#475361';
  ctx.stroke();

  // Inner antique-brass art-deco hairline frame
  roundedRectPath(ctx, -halfW + 6, -halfH + 6, width - 12, height - 12, radius - 3);
  ctx.lineWidth = 1;
  ctx.strokeStyle = highlighted ? 'rgba(255, 224, 138, 0.8)' : 'rgba(212, 175, 90, 0.34)';
  ctx.stroke();

  // Top header ribbon tinted by suit
  ctx.save();
  roundedRectPath(ctx, -halfW + 7, -halfH + 7, width - 14, height * 0.19, radius - 4);
  ctx.fillStyle = suit.dark;
  ctx.fill();
  ctx.restore();

  // Top-left Energy Cost Orb (large, high-contrast)
  const orbR = Math.max(15, width * 0.125);
  const orbX = -halfW + orbR + 7;
  const orbY = -halfH + orbR + 6;
  const orbGrad = ctx.createRadialGradient(orbX - 4, orbY - 5, 2, orbX, orbY, orbR);
  orbGrad.addColorStop(0, card.cost === 0 ? '#74ffbf' : '#ffe38e');
  orbGrad.addColorStop(1, card.cost === 0 ? '#0d8a50' : '#c47b08');
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.fillStyle = orbGrad;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#14120c';
  ctx.stroke();

  ctx.fillStyle = '#0d0f12';
  ctx.font = `900 ${Math.round(orbR * 1.28)}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), orbX, orbY + 1);

  // Top-right Geometric Suit Emblem
  drawSuitEmblem(ctx, card.suit, halfW - orbR - 7, orbY, orbR * 0.88);

  // Optional keyboard hotkey pill (1-7)
  if (slotIndex !== null && !compact) {
    ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
    roundedRectPath(ctx, -13, -halfH + 9, 26, 17, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 90, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#e7d5a8';
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(slotIndex + 1), 0, -halfH + 18);
  }

  // Center bespoke motif medallion
  const motifR = width * 0.285;
  const motifY = -halfH + height * 0.43;
  drawCardMotif(ctx, card, 0, motifY, motifR, suit);

  // Big bold power value pill right below/overlapping medallion bottom (super readable!)
  const effectiveValue =
    card.effects && card.effects.damage && ampBonus > 0
      ? card.value + ampBonus
      : card.value;
  const pillW = width * 0.44;
  const pillH = Math.max(24, height * 0.145);
  const pillY = motifY + motifR * 0.72;
  roundedRectPath(ctx, -pillW * 0.5, pillY - pillH * 0.5, pillW, pillH, 9);
  ctx.fillStyle = '#0b1017';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = ampBonus > 0 && card.effects.damage ? '#ffbe30' : suit.color;
  ctx.stroke();

  const valPrefix =
    card.effects.damage ? '' : card.effects.shield ? '+' : card.effects.energy ? '+' : '+';
  ctx.fillStyle = ampBonus > 0 && card.effects.damage ? '#ffe08a' : '#ffffff';
  ctx.font = `900 ${Math.round(pillH * 0.74)}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${valPrefix}${effectiveValue}`, 0, pillY + 1);

  // Card Title Plate
  const titleY = halfH - height * 0.235;
  ctx.fillStyle = '#f8f2e4';
  ctx.font = `800 ${Math.max(11, Math.round(width * 0.1))}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, 0, titleY);

  // Crisp summary text plate
  const boxH = height * 0.16;
  const boxY = halfH - boxH - 9;
  roundedRectPath(ctx, -halfW + 10, boxY, width - 20, boxH, 7);
  ctx.fillStyle = 'rgba(6, 10, 15, 0.84)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = suit.glow;
  ctx.font = `700 ${Math.max(9.5, Math.round(width * 0.076))}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.summary, 0, boxY + boxH * 0.52, width - 28);

  // Combo-ready badge pulse
  if (comboReady && playable) {
    roundedRectPath(ctx, -width * 0.34, -halfH - 13, width * 0.68, 20, 8);
    ctx.fillStyle = '#ffbe30';
    ctx.fill();
    ctx.fillStyle = '#120d04';
    ctx.font = '900 11px "Trebuchet MS", sans-serif';
    ctx.fillText('COMBO READY', 0, -halfH - 2);
  }

  // Dim overlay if unaffordable
  if (!playable) {
    roundedRectPath(ctx, -halfW, -halfH, width, height, radius);
    ctx.fillStyle = 'rgba(5, 8, 12, 0.48)';
    ctx.fill();
  }

  ctx.restore();
}

export function drawCardBack(ctx, opts = {}) {
  const { x = 0, y = 0, width = 94, height = 132, angle = 0, accent = '#d4af5a' } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const radius = Math.max(8, width * 0.1);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.62)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  roundedRectPath(ctx, -halfW, -halfH, width, height, radius);
  const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
  grad.addColorStop(0, '#18242e');
  grad.addColorStop(1, '#0c131a');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx, -halfW, -halfH, width, height, radius);
  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  ctx.stroke();

  // Art-deco geometric diamond lattice
  roundedRectPath(ctx, -halfW + 6, -halfH + 6, width - 12, height - 12, radius - 3);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(212, 175, 90, 0.45)';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 90, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -halfH + 14);
  ctx.lineTo(halfW - 14, 0);
  ctx.lineTo(0, halfH - 14);
  ctx.lineTo(-halfW + 14, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
