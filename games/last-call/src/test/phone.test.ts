import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import type { Rng } from '@/types/core';
import {
  askOut,
  cadenceModifier,
  composeOptions,
  contacts,
  dateIdeasFor,
  emptyThread,
  maybeIncomingTexts,
  nextDateSlot,
  sendText,
  threadFor,
} from '@/engine/phone';
import { NADIA } from '@/content/characters/nadia';
import { emptyMemory } from '@/engine/characters';
import { createRng } from '@/engine/rng';
import { BALANCE } from '@/config/gameConfig';
import { newTestGame } from '@/test/helpers';

const rng = () => createRng(11);

/** An RNG that always rolls low, so "does she text?" is a gate test, not a dice test. */
function eagerRng(): Rng {
  let cursor = 0;
  return {
    next: () => {
      cursor += 1;
      return 0;
    },
    int: (min) => min,
    chance: () => true,
    pick: <T,>(items: readonly T[]) => items[0] as T,
    get cursor() {
      return cursor;
    },
  };
}

/** A game where Nadia's number is already in the phone. */
function withContact(interest = 50, overrides: Partial<GameState> = {}): GameState {
  const game = newTestGame({ perks: ['hustler', 'night_owl'], flaw: 'lightweight' });
  return {
    ...game,
    characters: {
      nadia: { ...emptyMemory(), met: true, hasNumber: true, interest, stage: 'interested', encounters: 2 },
    },
    ...overrides,
  };
}

describe('contacts', () => {
  it('only lists people whose number you have', () => {
    expect(contacts(newTestGame())).toEqual([]);
    expect(contacts(withContact())).toEqual(['nadia']);
  });
});

describe('cadence', () => {
  it('is neutral on a first text', () => {
    expect(cadenceModifier(emptyThread(), 3).interest).toBe(0);
  });

  it('penalises double texting and punishes a third', () => {
    const once = { ...emptyThread(), lastSentDay: 3, sentToday: 1 };
    expect(cadenceModifier(once, 3).interest).toBeLessThan(0);
    const twice = { ...emptyThread(), lastSentDay: 3, sentToday: 2 };
    expect(cadenceModifier(twice, 3).interest).toBeLessThan(cadenceModifier(once, 3).interest);
  });

  it('rewards a day or three, and penalises going quiet for a week', () => {
    const recent = { ...emptyThread(), lastSentDay: 2, lastReceivedDay: 2, sentToday: 1 };
    expect(cadenceModifier(recent, 4).interest).toBeGreaterThan(0);
    const stale = { ...emptyThread(), lastSentDay: 1, lastReceivedDay: 1, sentToday: 1 };
    expect(cadenceModifier(stale, 12).interest).toBeLessThan(0);
  });
});

describe('sending a text', () => {
  it('moves her interest and writes both messages into the thread', () => {
    const game = withContact(50);
    const result = sendText(game, 'nadia', 'direct', 'Straight version.', rng());
    const thread = threadFor(result.state, 'nadia');
    expect(thread.messages).toHaveLength(2);
    expect(thread.messages[0]?.from).toBe('you');
    expect(thread.messages[1]?.from).toBe('her');
    expect(result.state.characters.nadia?.interest).not.toBe(50);
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it('scores tone against her preferences', () => {
    const game = withContact(50);
    const direct = sendText(game, 'nadia', 'direct', 'x', rng()).delta;
    const warm = sendText(game, 'nadia', 'warm', 'x', rng()).delta;
    expect(direct).toBeGreaterThan(warm);
  });

  it('costs an Awkward Texter every time', () => {
    const plain = withContact(50);
    const awkward: GameState = {
      ...plain,
      player: newTestGame({ flaw: 'awkward_texter' }).player,
    };
    const plainDelta = sendText(plain, 'nadia', 'playful', 'x', rng()).delta;
    const awkwardDelta = sendText(awkward, 'nadia', 'playful', 'x', rng()).delta;
    expect(awkwardDelta).toBeLessThan(plainDelta);
  });

  it('keeps the second text of the day cheaper than the first', () => {
    const game = withContact(50);
    const first = sendText(game, 'nadia', 'playful', 'x', rng());
    const second = sendText(first.state, 'nadia', 'playful', 'x', rng());
    expect(second.delta).toBeLessThan(first.delta);
    expect(second.notes.join(' ')).toContain('already texted');
  });
});

describe('composing', () => {
  it('locks the callback until the player has learned something about her', () => {
    const game = withContact();
    const locked = composeOptions(game, 'nadia', rng()).find((option) => option.tone === 'callback');
    expect(locked?.available).toBe(false);

    const knowing: GameState = {
      ...game,
      characters: {
        nadia: { ...(game.characters.nadia ?? emptyMemory()), knownFacts: ['nadia_physio'] },
      },
    };
    const unlocked = composeOptions(knowing, 'nadia', rng()).find((option) => option.tone === 'callback');
    expect(unlocked?.available).toBe(true);
    // It brings the fact up the way a person would, not by quoting the notebook.
    expect(unlocked?.text).toContain('knee theory');
  });
});

describe('she texts first', () => {
  it('only when she is interested and you have gone quiet', () => {
    const quiet = withContact(70);
    const withGap: GameState = {
      ...quiet,
      clock: { week: 1, dayIndex: 4, slotIndex: 0 },
      characters: {
        nadia: { ...(quiet.characters.nadia ?? emptyMemory()), lastContactAbsoluteDay: 0 },
      },
    };
    const result = maybeIncomingTexts(withGap, eagerRng());
    const thread = threadFor(result.state, 'nadia');
    expect(thread.messages.length).toBeGreaterThan(0);
    expect(thread.unread).toBe(true);
  });

  it('stays quiet when she is not interested', () => {
    const cold = withContact(20);
    const result = maybeIncomingTexts({ ...cold, clock: { week: 1, dayIndex: 5, slotIndex: 0 } }, eagerRng());
    expect(threadFor(result.state, 'nadia').messages).toHaveLength(0);
  });
});

describe('asking her out', () => {
  it('offers ideas the player can actually pull off, and flags the ones she would like', () => {
    const game = withContact();
    const ideas = dateIdeasFor(game, NADIA);
    const cooking = ideas.find((idea) => idea.id === 'cook_at_yours');
    expect(cooking?.available).toBe(false);
    expect(cooking?.lockReason).toContain('cooking');
    expect(ideas.find((idea) => idea.id === 'climbing_session')?.appeals).toBe(true);
    expect(ideas.find((idea) => idea.id === 'gallery_night')?.appeals).toBe(false);
  });

  it('says no when she is not there yet, and it costs a little', () => {
    const game = withContact(20);
    const result = askOut(game, 'nadia', 'late_dinner', rng());
    expect(result.accepted).toBe(false);
    expect(result.date).toBeNull();
    expect(result.state.characters.nadia?.interest).toBeLessThan(20);
  });

  it('says yes when she is, and puts it in the diary two days out', () => {
    const game = withContact(62);
    const result = askOut(game, 'nadia', 'climbing_session', rng());
    expect(result.accepted).toBe(true);
    expect(result.date).not.toBeNull();
    expect(result.state.dates).toHaveLength(1);
    expect(result.date?.slotIndex).toBe(BALANCE.slotsPerDay - 1);
    expect(result.date?.dayIndex).toBe(nextDateSlot(game).dayIndex);
  });

  it('holds a grudge about being stood up', () => {
    const game = withContact(62);
    const stoodUp: GameState = {
      ...game,
      characters: {
        nadia: { ...(game.characters.nadia ?? emptyMemory()), standUps: 1 },
      },
    };
    expect(askOut(stoodUp, 'nadia', 'late_dinner', rng()).accepted).toBe(false);
  });
});
