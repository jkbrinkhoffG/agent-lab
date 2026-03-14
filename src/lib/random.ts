export interface RandomSource {
  seed: number;
  next: () => number;
  int: (max: number) => number;
  range: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  clone: () => RandomSource;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: number): RandomSource {
  const generator = mulberry32(seed);

  return {
    seed,
    next: generator,
    int: (max) => Math.floor(generator() * max),
    range: (min, max) => min + generator() * (max - min),
    pick: (items) => items[Math.floor(generator() * items.length)]!,
    clone: () => createSeededRandom(seed),
  };
}

export function hashSeed(seed: number, salt: number) {
  return (seed * 1664525 + salt * 1013904223) >>> 0;
}
