import { describe, expect, it } from 'vitest';
import type { DialogueOptionDef } from '@/types/dialogue';
import { firstImpressionBonus, scoreOption } from '@/engine/dialogue/scoring';
import { SABLE } from '@/content/characters/sable';
import { VENUES } from '@/content/venues';
import { emptyMemory } from '@/engine/characters';
import { newTestGame } from '@/test/helpers';

const venue = VENUES.neon_last_call;

function option(overrides: Partial<DialogueOptionDef> = {}): DialogueOptionDef {
  return { id: 'o', type: 'joke', text: 'something', interest: 4, comfort: 2, next: 'hub', ...overrides };
}

function score(
  overrides: Partial<DialogueOptionDef> = {},
  context: { mood?: number; comfort?: number; turn?: number; interest?: number } = {},
) {
  const game = newTestGame();
  return scoreOption({
    option: option(overrides),
    character: SABLE,
    memory: emptyMemory(),
    player: game.player,
    venue,
    mood: context.mood ?? 0,
    interest: context.interest ?? 20,
    comfort: context.comfort ?? 55,
    turn: context.turn ?? 2,
    openingBonus: 0,
  });
}

describe('tags', () => {
  it('rewards a topic she likes', () => {
    expect(score({ tags: ['direct'] }).interestDelta).toBeGreaterThan(score({}).interestDelta);
  });

  it('punishes a topic she dislikes', () => {
    expect(score({ tags: ['flattery'] }).interestDelta).toBeLessThan(score({}).interestDelta);
  });

  it('flags the dealbreaker and takes a chunk out of both meters', () => {
    const result = score({ tags: ['rude_to_staff'] });
    expect(result.dealbroken).toBe(true);
    expect(result.interestDelta).toBeLessThan(-20);
    expect(result.comfortDelta).toBeLessThan(-20);
    expect(result.notes.join(' ')).toContain('barback');
  });
});

describe('her preferences', () => {
  it('values a tease over a compliment for Sable', () => {
    const tease = score({ type: 'tease' }).interestDelta;
    const compliment = score({ type: 'compliment' }).interestDelta;
    expect(tease).toBeGreaterThan(compliment);
  });
});

describe('player stats', () => {
  it('lets a funny player land a joke harder', () => {
    const game = newTestGame();
    const funny = {
      ...game.player,
      stats: { ...game.player.stats, humor: { value: 85, xp: 0 } },
    };
    const base = scoreOption({
      option: option({ type: 'joke' }),
      character: SABLE,
      memory: emptyMemory(),
      player: game.player,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 2,
      openingBonus: 0,
    });
    const strong = scoreOption({
      option: option({ type: 'joke' }),
      character: SABLE,
      memory: emptyMemory(),
      player: funny,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 2,
      openingBonus: 0,
    });
    expect(strong.interestDelta).toBeGreaterThan(base.interestDelta + 2);
  });

  it('counts the outfit only on the first line', () => {
    const game = newTestGame();
    const dressed = { ...game.player, outfitId: 'leather_jacket' as const };
    expect(firstImpressionBonus(dressed, venue)).toBeGreaterThan(firstImpressionBonus(game.player, venue));
    const laterTurn = scoreOption({
      option: option(),
      character: SABLE,
      memory: emptyMemory(),
      player: dressed,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 4,
      openingBonus: 5,
    });
    const firstTurn = scoreOption({
      option: option(),
      character: SABLE,
      memory: emptyMemory(),
      player: dressed,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 1,
      openingBonus: 5,
    });
    expect(firstTurn.interestDelta).toBeGreaterThan(laterTurn.interestDelta);
  });
});

describe('her day', () => {
  it('softens a good line on a bad night and hardens a bad one', () => {
    expect(score({}, { mood: -10 }).interestDelta).toBeLessThan(score({}, { mood: 10 }).interestDelta);
    const badNight = score({ interest: -6, comfort: -5 }, { mood: -10 });
    const goodNight = score({ interest: -6, comfort: -5 }, { mood: 10 });
    expect(badNight.interestDelta).toBeLessThan(goodNight.interestDelta);
  });
});

describe('comfort gates interest', () => {
  it('halves gains when she is not relaxed', () => {
    const uneasy = score({}, { comfort: 20 }).interestDelta;
    const relaxed = score({}, { comfort: 70 }).interestDelta;
    expect(uneasy).toBeLessThan(relaxed);
  });

  it('costs more to push someone already uncomfortable', () => {
    const uneasy = score({ comfort: -6 }, { comfort: 20 }).comfortDelta;
    const relaxed = score({ comfort: -6 }, { comfort: 70 }).comfortDelta;
    expect(uneasy).toBeLessThan(relaxed);
  });
});

describe('repetition', () => {
  it('is worth less to cover a topic she has already covered with you', () => {
    const game = newTestGame();
    const fresh = scoreOption({
      option: option({ tags: ['music'] }),
      character: SABLE,
      memory: emptyMemory(),
      player: game.player,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 2,
      openingBonus: 0,
    });
    const repeat = scoreOption({
      option: option({ tags: ['music'] }),
      character: SABLE,
      memory: { ...emptyMemory(), discussedTopics: ['music'] },
      player: game.player,
      venue,
      mood: 0,
      interest: 20,
      comfort: 55,
      turn: 2,
      openingBonus: 0,
    });
    expect(repeat.interestDelta).toBeLessThan(fresh.interestDelta);
  });
});
