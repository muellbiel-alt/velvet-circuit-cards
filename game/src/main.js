// Velvet Circuit main bootstrap: fixed-timestep deterministic loop (1/60s),
// clamped delta time, automatic visibility/blur pause, audio, input, and renderer wiring.

import {
  createGameState,
  endPlayerTurn,
  pickDraftCard,
  playCardFromHand,
  restartRun,
  startMatch,
  stepEngine,
} from './engine.js';
import {
  applyEventsToAnimation,
  createAnimationState,
  updateAnimations,
} from './animation.js';
import { createTableRenderer, renderGameFrame } from './tableRenderer.js';
import { createAudioEngine } from './audio.js';
import { bindGameInput } from './input.js';
import { applyScreenshotPreset } from './shots.js';

const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.05;

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const seedRaw = Number(params.get('seed'));
  const seed = Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 42;
  const shot = params.get('shot');
  return { seed, shot };
}

function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const { seed, shot } = parseUrlParams();

  const state = createGameState(seed);
  const anim = createAnimationState();
  const renderer = createTableRenderer();
  const audio = createAudioEngine();

  let paused = false;
  let accumulator = 0;
  let lastTimestamp = 0;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, window.innerWidth);
    const height = Math.max(240, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  function handleEngineEvents(events) {
    applyEventsToAnimation(anim, events, renderer.layout, state.rng);
    for (const ev of events) {
      if (ev.type === 'card_played') audio.playCardPlay(ev.card.suit);
      else if (ev.type === 'combo_triggered') audio.playComboChord();
      else if (ev.type === 'player_hit' && ev.damage > 0) audio.playHit();
      else if (ev.type === 'run_victory') audio.playVictory();
      else if (ev.type === 'run_defeat') audio.playDefeat();
    }
  }

  const callbacks = {
    onHoverChange() {
      audio.playCardFlick();
    },
    onToggleMute() {
      audio.toggleMute();
    },
    onStartGame() {
      startMatch(state);
      audio.playCardFlick();
    },
    onRestart() {
      restartRun(state, state.seed);
      audio.playCardFlick();
    },
    onPlayCard(index) {
      const res = playCardFromHand(state, index);
      if (res.ok) handleEngineEvents(res.events);
    },
    onEndTurn() {
      const res = endPlayerTurn(state);
      if (res.ok) handleEngineEvents(res.events);
    },
    onDraftCard(index) {
      const res = pickDraftCard(state, index);
      if (res.ok) {
        audio.playComboChord();
        handleEngineEvents(res.events);
      }
    },
  };

  bindGameInput(canvas, state, renderer, callbacks);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Auto-pause accumulator when tab hides or window loses focus
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) lastTimestamp = 0;
  });
  window.addEventListener('blur', () => {
    paused = true;
  });
  window.addEventListener('focus', () => {
    paused = false;
    lastTimestamp = 0;
  });

  // Expose read-only inspection hook for automated testing
  window.__VELVET_CIRCUIT__ = { state, anim };

  if (shot) {
    applyScreenshotPreset(shot, state, anim, renderer.layout);
    for (let i = 0; i < 6; i += 1) {
      stepEngine(state, FIXED_DT);
      updateAnimations(anim, FIXED_DT);
    }
    renderGameFrame(ctx, canvas.width, canvas.height, state, anim, renderer, audio.isMuted());
    return;
  }

  function frame(timestamp) {
    if (!paused) {
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const rawDt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      const clampedDt = Math.max(0, Math.min(rawDt, MAX_FRAME_DT));
      accumulator += clampedDt;
      while (accumulator >= FIXED_DT) {
        stepEngine(state, FIXED_DT);
        updateAnimations(anim, FIXED_DT);
        accumulator -= FIXED_DT;
      }
    }
    renderGameFrame(ctx, canvas.width, canvas.height, state, anim, renderer, audio.isMuted());
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

bootstrap();
