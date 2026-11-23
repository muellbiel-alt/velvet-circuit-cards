// Deterministic seeded PRNG (Mulberry32) for reproducible deck shuffles,
// opponent intents, particle layouts, and screenshot runs.

export function createRng(seed = 42) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min, maxExclusive) {
    if (maxExclusive <= min) return min;
    return min + Math.floor(next() * (maxExclusive - min));
  }

  function getState() {
    return state;
  }

  return { next, nextInt, getState };
}

export function shuffleDeterministic(items, rng) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(0, i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function pickDeterministic(items, count, rng) {
  return shuffleDeterministic(items, rng).slice(0, Math.min(count, items.length));
}
