import type { Rng } from '@/types/core';

/**
 * Small deterministic PRNG (mulberry32). The cursor is part of the save file, so
 * loading a game keeps rolling exactly the dice the player would have rolled.
 */
export function createRng(seed: number, startCursor = 0): Rng {
  let cursor = startCursor;

  const draw = (): number => {
    cursor += 1;
    let t = (seed + cursor * 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next: draw,
    int(min: number, max: number): number {
      if (max < min) throw new Error(`rng.int called with max (${max}) below min (${min})`);
      return min + Math.floor(draw() * (max - min + 1));
    },
    chance(probability: number): boolean {
      return draw() < probability;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('rng.pick called with an empty list');
      const item = items[Math.floor(draw() * items.length)];
      // Index is always in range, but the compiler cannot see that.
      return item as T;
    },
    get cursor(): number {
      return cursor;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
