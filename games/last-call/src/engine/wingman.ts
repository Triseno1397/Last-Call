import type { CharacterId } from '@/content/ids';
import type { GameState } from '@/types/game';
import type { Rng } from '@/types/core';
import type { TextMessage } from '@/types/phone';
import { WINGMAN, WINGMAN_ASSIST, WINGMAN_GENERIC, WINGMAN_TIPS } from '@/content/wingman';
import { CHARACTER_LIST } from '@/content/characters';
import { DAY_IDS } from '@/types/core';
import { absoluteDay, currentDay } from '@/engine/calendar';
import { memoryFor } from '@/engine/characters';

export { WINGMAN };

/** One tip a day, and never the same one twice. */
export function canAskWingman(state: GameState): boolean {
  return state.phone.lastTipDay !== absoluteDay(state.clock);
}

export function tipFor(state: GameState, about: CharacterId, rng: Rng): { state: GameState; text: string } {
  const today = absoluteDay(state.clock);
  const unused = WINGMAN_TIPS.filter(
    (tip) => tip.about === about && !state.phone.tipsGiven.includes(tip.id),
  );
  const tip = unused.length > 0 ? rng.pick(unused) : null;
  const text = tip ? tip.text : rng.pick(WINGMAN_GENERIC);

  const message: TextMessage = {
    id: `dez-${today}-${rng.int(0, 999999)}`,
    from: 'wingman',
    text,
    day: today,
  };
  const thread = state.phone.threads[WINGMAN.id] ?? {
    messages: [],
    lastSentDay: null,
    lastReceivedDay: null,
    sentToday: 0,
    unread: false,
  };

  const memory = tip?.unlocksFact ? memoryFor(state.characters, about) : null;
  const characters =
    tip?.unlocksFact && memory
      ? {
          ...state.characters,
          [about]: {
            ...memory,
            knownFacts: [...new Set([...memory.knownFacts, tip.unlocksFact])],
          },
        }
      : state.characters;

  return {
    state: {
      ...state,
      characters,
      phone: {
        ...state.phone,
        lastTipDay: today,
        tipsGiven: tip ? [...state.phone.tipsGiven, tip.id] : state.phone.tipsGiven,
        threads: {
          ...state.phone.threads,
          [WINGMAN.id]: { ...thread, messages: [...thread.messages, message], lastReceivedDay: today },
        },
      },
    },
    text,
  };
}

/** Who Dez can actually say something useful about. */
export function tipTargets(state: GameState): readonly CharacterId[] {
  return CHARACTER_LIST.filter((character) => memoryFor(state.characters, character.id).met || true).map(
    (character) => character.id,
  );
}

/** He is only around on his nights, at his bar. */
export function wingmanIsAround(state: GameState, venue: string): boolean {
  const day = currentDay(state.clock);
  return (
    venue === WINGMAN.atVenue &&
    (WINGMAN.nights as readonly string[]).includes(day) &&
    DAY_IDS.includes(day)
  );
}

export function assistLine(rng: Rng): string {
  return rng.pick(WINGMAN_ASSIST);
}

/** What his introduction is worth at the start of a conversation. */
export const WINGMAN_ASSIST_BONUS = 3;
