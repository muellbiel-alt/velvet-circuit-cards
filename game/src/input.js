// Unified mouse and keyboard controller for Velvet Circuit.

import { clientToVirtual, hitTestInteractive } from './tableRenderer.js';

export function bindGameInput(canvas, state, renderer, callbacks) {
  function onPointerMove(ev) {
    const { x, y } = clientToVirtual(canvas, ev.clientX, ev.clientY);
    const hit = hitTestInteractive(x, y, state, renderer);
    if (hit && (hit.type === 'hand_card' || hit.type === 'draft_card')) {
      if (state.hoveredHandIndex !== hit.index) {
        state.hoveredHandIndex = hit.index;
        callbacks.onHoverChange();
      }
      canvas.style.cursor = 'pointer';
    } else {
      state.hoveredHandIndex = -1;
      canvas.style.cursor = hit ? 'pointer' : 'default';
    }
  }

  function onPointerDown(ev) {
    if (ev.button !== 0) return;
    const { x, y } = clientToVirtual(canvas, ev.clientX, ev.clientY);
    const hit = hitTestInteractive(x, y, state, renderer);
    if (!hit) return;

    if (hit.type === 'mute') {
      callbacks.onToggleMute();
    } else if (hit.type === 'restart') {
      callbacks.onRestart();
    } else if (hit.type === 'start_game') {
      callbacks.onStartGame();
    } else if (hit.type === 'end_turn') {
      callbacks.onEndTurn();
    } else if (hit.type === 'hand_card') {
      callbacks.onPlayCard(hit.index);
    } else if (hit.type === 'draft_card') {
      callbacks.onDraftCard(hit.index);
    }
  }

  function onKeyDown(ev) {
    const key = ev.key;
    if (key === 'm' || key === 'M') {
      callbacks.onToggleMute();
      return;
    }
    if (key === 'r' || key === 'R') {
      callbacks.onRestart();
      return;
    }

    if (state.phase === 'title') {
      if (key === 'Enter' || key === ' ') {
        ev.preventDefault();
        callbacks.onStartGame();
      }
      return;
    }

    if (state.phase === 'draft') {
      if (key === '1' || key === '2' || key === '3') {
        callbacks.onDraftCard(Number(key) - 1);
      }
      return;
    }

    if (state.phase === 'victory' || state.phase === 'defeat') {
      if (key === 'Enter' || key === ' ') {
        ev.preventDefault();
        callbacks.onRestart();
      }
      return;
    }

    // Playing phase shortcuts
    if (key >= '1' && key <= '7') {
      const idx = Number(key) - 1;
      if (idx < state.hand.length) {
        callbacks.onPlayCard(idx);
      }
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (state.hand.length > 0) {
        state.selectedHandIndex = (state.selectedHandIndex + 1) % state.hand.length;
        state.hoveredHandIndex = -1;
        callbacks.onHoverChange();
      }
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (state.hand.length > 0) {
        state.selectedHandIndex =
          state.selectedHandIndex <= 0 ? state.hand.length - 1 : state.selectedHandIndex - 1;
        state.hoveredHandIndex = -1;
        callbacks.onHoverChange();
      }
    } else if (key === 'Enter') {
      const idx = state.selectedHandIndex >= 0 ? state.selectedHandIndex : state.hoveredHandIndex;
      if (idx >= 0) {
        callbacks.onPlayCard(idx);
      }
    } else if (key === ' ' || key === 'e' || key === 'E') {
      ev.preventDefault();
      callbacks.onEndTurn();
    }
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);

  return () => {
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', onKeyDown);
  };
}
