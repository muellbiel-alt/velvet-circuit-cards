// Card flight arcs, combat popups, chip/spark particle bursts, and screen shake.

import { SUITS } from './cards.js';

export function createAnimationState() {
  return {
    flights: [],
    popups: [],
    particles: [],
    shakeTime: 0,
    shakeMagnitude: 0,
    enemyFlash: 0,
    playerFlash: 0,
    enemyLunge: 0,
    handHoverLift: new Map(),
    comboPulse: 0,
    time: 0,
  };
}

export function spawnCardFlight(anim, card, fromX, fromY, toX, toY, duration = 0.28) {
  anim.flights.push({
    card,
    fromX,
    fromY,
    toX,
    toY,
    ctrlX: (fromX + toX) * 0.5,
    ctrlY: Math.min(fromY, toY) - 95,
    age: 0,
    duration,
  });
}

export function spawnCombatPopup(anim, x, y, text, color = '#ffe08a', scale = 1) {
  anim.popups.push({
    x,
    y,
    vy: -56,
    text,
    color,
    scale,
    age: 0,
    duration: 1.05,
  });
}

export function spawnChipBurst(anim, x, y, color, count = 18, rng = null) {
  for (let i = 0; i < count; i += 1) {
    const r1 = rng ? rng.next() : ((i * 73) % 97) / 97;
    const r2 = rng ? rng.next() : ((i * 41) % 89) / 89;
    const angle = r1 * Math.PI * 2;
    const speed = 90 + r2 * 260;
    anim.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 65,
      gravity: 340,
      size: 3 + (i % 4) * 1.6,
      color,
      shape: i % 3 === 0 ? 'chip' : 'spark',
      rotation: r1 * Math.PI * 2,
      spin: (r2 - 0.5) * 10,
      age: 0,
      duration: 0.55 + r2 * 0.55,
    });
  }
}

export function triggerShake(anim, magnitude = 7, duration = 0.22) {
  anim.shakeMagnitude = Math.max(anim.shakeMagnitude, magnitude);
  anim.shakeTime = Math.max(anim.shakeTime, duration);
}

export function applyEventsToAnimation(anim, events, layout, rng = null) {
  const foeX = layout.enemyCenter.x;
  const foeY = layout.enemyCenter.y;
  const plyX = layout.playerCenter.x;
  const plyY = layout.playerCenter.y;

  for (const ev of events) {
    if (ev.type === 'card_played') {
      const slot = layout.railSlots[ev.slotIndex % layout.railSlots.length] || layout.railCenter;
      const suit = SUITS[ev.card.suit] || SUITS.overclock;
      spawnCardFlight(anim, ev.card, plyX, plyY + 30, slot.x, slot.y, 0.26);
      spawnChipBurst(anim, slot.x, slot.y, suit.color, 10, rng);
    } else if (ev.type === 'opponent_hit') {
      anim.enemyFlash = 0.35;
      if (ev.damage > 0) {
        spawnCombatPopup(
          anim,
          foeX + (ev.pierce ? 24 : 0),
          foeY + 12,
          ev.pierce ? `-${ev.damage} PIERCE` : `-${ev.damage}`,
          ev.pierce ? '#ffbe30' : '#ff4d6d',
          ev.damage >= 12 ? 1.28 : 1.05,
        );
        spawnChipBurst(anim, foeX, foeY + 10, '#ff4265', ev.damage >= 10 ? 22 : 12, rng);
        triggerShake(anim, ev.damage >= 12 ? 9 : 5, 0.2);
      } else if (ev.absorbed > 0) {
        spawnCombatPopup(anim, foeX, foeY + 14, `BLOCKED ${ev.absorbed}`, '#66e8ff', 0.95);
      }
    } else if (ev.type === 'player_shield') {
      spawnCombatPopup(anim, plyX - 110, plyY - 35, `+${ev.amount} SHD`, '#19e3ff', 1.05);
      spawnChipBurst(anim, plyX - 105, plyY - 20, '#19e3ff', 10, rng);
    } else if (ev.type === 'player_heal') {
      spawnCombatPopup(anim, plyX - 40, plyY - 48, `+${ev.amount} HP`, '#22e585', 1.05);
    } else if (ev.type === 'player_energy') {
      spawnCombatPopup(anim, layout.energyDial.x, layout.energyDial.y - 34, `+${ev.amount} NRG`, '#ffbe30', 1.1);
    } else if (ev.type === 'opponent_jam') {
      spawnCombatPopup(anim, foeX + 115, foeY + 18, `-${ev.amount} ATK`, '#19e3ff', 1.0);
    } else if (ev.type === 'combo_triggered') {
      const suit = SUITS[ev.combo.suit] || SUITS.overclock;
      anim.comboPulse = 1.0;
      spawnCombatPopup(anim, layout.railCenter.x, layout.railCenter.y - 72, ev.combo.name, suit.glow, 1.35);
      spawnChipBurst(anim, layout.railCenter.x, layout.railCenter.y, suit.color, 26, rng);
      triggerShake(anim, 8, 0.25);
    } else if (ev.type === 'opponent_action') {
      anim.enemyLunge = 0.32;
    } else if (ev.type === 'player_hit') {
      if (ev.damage > 0) {
        anim.playerFlash = 0.35;
        spawnCombatPopup(anim, plyX, plyY - 56, `-${ev.damage} HP`, '#ff4265', 1.18);
        triggerShake(anim, 8, 0.22);
      } else if (ev.blocked > 0) {
        spawnCombatPopup(anim, plyX, plyY - 56, `PARRIED ${ev.blocked}`, '#19e3ff', 1.02);
      }
    } else if (ev.type === 'run_victory') {
      spawnChipBurst(anim, 640, 260, '#ffbe30', 44, rng);
      spawnChipBurst(anim, 420, 320, '#22e585', 28, rng);
      spawnChipBurst(anim, 860, 320, '#19e3ff', 28, rng);
    }
  }
}

export function updateAnimations(anim, dt) {
  anim.time += dt;
  if (anim.shakeTime > 0) {
    anim.shakeTime = Math.max(0, anim.shakeTime - dt);
    if (anim.shakeTime === 0) anim.shakeMagnitude = 0;
  }
  anim.enemyFlash = Math.max(0, anim.enemyFlash - dt);
  anim.playerFlash = Math.max(0, anim.playerFlash - dt);
  anim.enemyLunge = Math.max(0, anim.enemyLunge - dt);
  anim.comboPulse = Math.max(0, anim.comboPulse - dt * 1.4);

  for (let i = anim.flights.length - 1; i >= 0; i -= 1) {
    anim.flights[i].age += dt;
    if (anim.flights[i].age >= anim.flights[i].duration) {
      anim.flights.splice(i, 1);
    }
  }

  for (let i = anim.popups.length - 1; i >= 0; i -= 1) {
    const p = anim.popups[i];
    p.age += dt;
    p.y += p.vy * dt;
    p.vy *= Math.pow(0.25, dt);
    if (p.age >= p.duration) {
      anim.popups.splice(i, 1);
    }
  }

  for (let i = anim.particles.length - 1; i >= 0; i -= 1) {
    const pt = anim.particles[i];
    pt.age += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += pt.gravity * dt;
    pt.rotation += pt.spin * dt;
    if (pt.age >= pt.duration) {
      anim.particles.splice(i, 1);
    }
  }
}
