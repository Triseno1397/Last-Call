import { describe, expect, it } from 'vitest';
import { createNewGame, createPlayer, validateCreation } from '@/engine/newGame';
import { maxEnergy } from '@/engine/traits';
import { BALANCE } from '@/config/gameConfig';
import { STARTING_JOB } from '@/content/lifestyle';
import { choices } from '@/test/helpers';

describe('validation', () => {
  it('accepts a complete character', () => {
    expect(validateCreation(choices())).toEqual([]);
  });

  it('rejects an empty name', () => {
    expect(validateCreation(choices({ name: '   ' }))).toContain('Your character needs a name.');
  });

  it('rejects the same perk twice', () => {
    const problems = validateCreation(choices({ perks: ['quick_wit', 'quick_wit'] }));
    expect(problems).toContain('Pick two different perks.');
  });

  it('rejects the wrong number of perks', () => {
    expect(validateCreation(choices({ perks: ['quick_wit'] })).length).toBeGreaterThan(0);
  });

  it('rejects an unknown appearance option', () => {
    const bad = choices();
    const problems = validateCreation({
      ...bad,
      appearance: { ...bad.appearance, hairColor: 'chartreuse' },
    });
    expect(problems).toContain('Unknown hair colour.');
  });
});

describe('the new character', () => {
  it('starts with baseline stats plus perk bonuses', () => {
    const player = createPlayer(choices({ perks: ['quick_wit', 'gym_rat'] }));
    expect(player.stats.humor.value).toBe(BALANCE.stats.startingValue + 5);
    expect(player.stats.fitness.value).toBe(BALANCE.stats.startingValue + 5);
    expect(player.stats.culture.value).toBe(BALANCE.stats.startingValue);
  });

  it('applies trait money and energy effects', () => {
    const hustler = createPlayer(choices({ perks: ['hustler', 'night_owl'], flaw: 'lightweight' }));
    expect(hustler.money).toBe(BALANCE.money.startingMoney + 80);
    expect(hustler.energy).toBe(maxEnergy(hustler));
    expect(maxEnergy(hustler)).toBe(BALANCE.energy.base + 8);

    const broke = createPlayer(choices({ flaw: 'chronically_broke' }));
    expect(broke.money).toBe(Math.max(0, BALANCE.money.startingMoney - 110));

    const overthinker = createPlayer(choices({ flaw: 'overthinker' }));
    expect(maxEnergy(overthinker)).toBe(BALANCE.energy.base - 12);
  });

  it('starts the chosen hobby at level one and the rest at zero', () => {
    const player = createPlayer(choices({ startingHobby: 'cooking' }));
    expect(player.hobbies.cooking.level).toBe(1);
    expect(player.hobbies.guitar.level).toBe(0);
  });

  it('starts in the entry-level job with starter clothes on', () => {
    const player = createPlayer(choices());
    expect(player.career.jobId).toBe(STARTING_JOB);
    expect(player.wardrobe.length).toBeGreaterThan(0);
    expect(player.outfitId).toBe('black_jeans');
  });

  it('opens on Monday morning of week one with an intro line', () => {
    const game = createNewGame(choices({ name: 'Dex' }), 42);
    expect(game.clock).toEqual({ week: 1, dayIndex: 0, slotIndex: 0 });
    expect(game.log[0]?.text).toContain('Dex');
    expect(game.rngSeed).toBe(42);
  });
});
