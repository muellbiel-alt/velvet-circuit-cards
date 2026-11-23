// Procedural WebAudio synthesizer for Velvet Circuit.
// Generates crisp card flicks, felt snaps, blade slashes, shield chimes,
// combo chords, and victory/defeat stingers with zero external audio files.

export function createAudioEngine() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (muted || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration, type = 'triangle', gainPeak = 0.14, freqEnd = freq) {
    const audio = ensureContext();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoiseBurst(duration, cutoff = 1800, gainPeak = 0.09) {
    const audio = ensureContext();
    if (!audio) return;
    const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(gainPeak, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    src.start();
  }

  function playCardFlick() {
    playNoiseBurst(0.06, 2600, 0.08);
    playTone(320, 0.06, 'sine', 0.06, 520);
  }

  function playCardPlay(suit) {
    playNoiseBurst(0.08, 1200, 0.1);
    if (suit === 'blade') {
      playTone(460, 0.14, 'sawtooth', 0.1, 130);
    } else if (suit === 'circuit') {
      playTone(520, 0.16, 'triangle', 0.11, 780);
    } else if (suit === 'overclock') {
      playTone(440, 0.12, 'square', 0.07, 880);
    } else {
      playTone(360, 0.18, 'sine', 0.11, 540);
    }
  }

  function playComboChord() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => playTone(n, 0.28, 'triangle', 0.09, n * 1.01), idx * 45);
    });
  }

  function playHit() {
    playNoiseBurst(0.11, 620, 0.12);
    playTone(145, 0.18, 'sawtooth', 0.12, 58);
  }

  function playVictory() {
    const chord = [440, 554.37, 659.25, 880, 1108.73];
    chord.forEach((n, idx) => {
      setTimeout(() => playTone(n, 0.42, 'triangle', 0.1, n), idx * 75);
    });
  }

  function playDefeat() {
    const notes = [293.66, 261.63, 220, 164.81];
    notes.forEach((n, idx) => {
      setTimeout(() => playTone(n, 0.4, 'sawtooth', 0.08, n * 0.94), idx * 120);
    });
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    playCardFlick,
    playCardPlay,
    playComboChord,
    playHit,
    playVictory,
    playDefeat,
    toggleMute,
    isMuted,
  };
}
