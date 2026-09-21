import { describe, expect, it } from 'vitest';
import { randomCreation } from '@/engine/quickStart';
import { createNewGame, validateCreation, PERKS_TO_PICK } from '@/engine/newGame';

/**
 * The Play button has no validation screen behind it, so a roll that produces
 * an invalid character would drop the player into a broken game. These sweep
 * the generator rather than trusting one lucky call.
 */

/**
 * A deterministic stand-in for Math.random, so a failure is reproducible.
 * Warmed up before first use: a linear congruential generator's first output
 * from consecutive seeds is strongly correlated, which would make the very
 * first draw — the name — look far less varied than it is.
 */
function seeded(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = 0; i < 8; i += 1) next();
  return next;
}

describe('randomCreation', () => {
  it('produces a valid character for every seed it is given', () => {
    for (let seed = 0; seed < 400; seed += 1) {
      const choices = randomCreation(seeded(seed));
      expect(validateCreation(choices), `seed ${seed}`).toEqual([]);
    }
  });

  it('picks two different perks', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const { perks } = randomCreation(seeded(seed));
      expect(perks).toHaveLength(PERKS_TO_PICK);
      expect(new Set(perks).size).toBe(PERKS_TO_PICK);
    }
  });

  it('builds a playable game without going through creation', () => {
    const game = createNewGame(randomCreation(seeded(7)), 99);
    expect(game.player.name.length).toBeGreaterThan(0);
    expect(game.clock.week).toBe(1);
    expect(game.player.energy).toBeGreaterThan(0);
  });

  it('varies, rather than handing everyone the same character', () => {
    const names = new Set<string>();
    const looks = new Set<string>();
    for (let seed = 0; seed < 60; seed += 1) {
      const choices = randomCreation(seeded(seed));
      names.add(choices.name);
      looks.add(JSON.stringify(choices.appearance));
    }
    expect(names.size).toBeGreaterThan(3);
    expect(looks.size).toBeGreaterThan(20);
  });
});
