import type { CharacterId, VenueId } from '@/content/ids';
import type { EncounterState, DialogueProvider } from '@/types/dialogue';
import type { GameState, LogEntry } from '@/types/game';
import type { Rng } from '@/types/core';
import type { ScheduledDate } from '@/types/phone';
import { DATE_IDEAS } from '@/content/dateIdeas';
import { getCharacter } from '@/content/characters';
import { BALANCE } from '@/config/gameConfig';
import { appendLog, makeLogEntry } from '@/engine/calendar';
import { memoryFor } from '@/engine/characters';
import { beginEncounter, concludeEncounter, dialogueProvider } from '@/engine/encounter';

function clockValue(week: number, dayIndex: number, slotIndex: number): number {
  return (week * BALANCE.daysPerWeek + dayIndex) * BALANCE.slotsPerDay + slotIndex;
}

function dateValue(date: ScheduledDate): number {
  return clockValue(date.week, date.dayIndex, date.slotIndex);
}

export function dateDueNow(state: GameState): ScheduledDate | null {
  const now = clockValue(state.clock.week, state.clock.dayIndex, state.clock.slotIndex);
  return state.dates.find((date) => !date.resolved && dateValue(date) === now) ?? null;
}

export function upcomingDates(state: GameState): readonly ScheduledDate[] {
  const now = clockValue(state.clock.week, state.clock.dayIndex, state.clock.slotIndex);
  return state.dates.filter((date) => !date.resolved && dateValue(date) >= now);
}

/**
 * A date the player did not turn up to. She waited, and she will say so.
 * Two of these and she is done.
 */
export function resolveMissedDates(
  state: GameState,
  rng: Rng,
): { state: GameState; entries: readonly LogEntry[] } {
  const now = clockValue(state.clock.week, state.clock.dayIndex, state.clock.slotIndex);
  const missed = state.dates.filter((date) => !date.resolved && dateValue(date) < now);
  if (missed.length === 0) return { state, entries: [] };

  let next = state;
  const entries: LogEntry[] = [];

  for (const date of missed) {
    const character = getCharacter(date.characterId);
    const memory = memoryFor(next.characters, date.characterId);
    const standUps = memory.standUps + 1;
    next = {
      ...next,
      characters: {
        ...next.characters,
        [date.characterId]: {
          ...memory,
          interest: Math.max(0, memory.interest - 28),
          standUps,
          stage: standUps >= 2 ? 'not_interested' : memory.stage,
        },
      },
    };

    const thread = next.phone.threads[date.characterId] ?? {
      messages: [],
      lastSentDay: null,
      lastReceivedDay: null,
      sentToday: 0,
      unread: false,
    };
    next = {
      ...next,
      phone: {
        ...next.phone,
        threads: {
          ...next.phone.threads,
          [date.characterId]: {
            ...thread,
            messages: [
              ...thread.messages,
              {
                id: `${date.characterId}-stood-${rng.int(0, 999999)}`,
                from: 'her' as const,
                text: rng.pick(character.texts.stoodUp),
                day: date.week * BALANCE.daysPerWeek + date.dayIndex,
              },
            ],
            unread: true,
          },
        },
      },
    };

    entries.push(
      makeLogEntry(next, `You did not turn up for ${character.name}. She waited.`, 'bad', rng),
    );
  }

  next = {
    ...next,
    dates: next.dates.map((date) => (dateValue(date) < now ? { ...date, resolved: true } : date)),
  };
  return { state: appendLog(next, entries), entries };
}

export async function beginDate(
  state: GameState,
  date: ScheduledDate,
  provider: DialogueProvider = dialogueProvider,
): Promise<EncounterState> {
  const character = getCharacter(date.characterId);
  const idea = DATE_IDEAS[date.ideaId];
  const venue: VenueId = idea.venue ?? character.homeVenue;
  const appeals = idea.appealsTo.some((hobby) => character.interests.includes(hobby));
  const bonus = appeals ? idea.matchBonus : 0;
  return beginEncounter(state, date.characterId, venue, bonus, provider, 'date');
}

/** A date costs money and energy up front, whatever happens next. */
export function payForDate(state: GameState, date: ScheduledDate): GameState {
  const idea = DATE_IDEAS[date.ideaId];
  return {
    ...state,
    player: {
      ...state.player,
      money: Math.max(0, state.player.money - idea.cost),
      energy: Math.max(0, state.player.energy - idea.energy),
    },
    week: { ...state.week, moneySpent: state.week.moneySpent + idea.cost },
  };
}

export interface DateResult {
  state: GameState;
  entries: readonly LogEntry[];
  went: 'great' | 'fine' | 'badly';
}

/** Write the date into her memory: a great one moves you both on a stage. */
export function concludeDate(
  state: GameState,
  encounter: EncounterState,
  date: ScheduledDate,
  rng: Rng,
): DateResult {
  const base = concludeEncounter(state, encounter, rng);
  const characterId = date.characterId as CharacterId;
  const character = getCharacter(characterId);
  const memory = memoryFor(base.state.characters, characterId);
  const outcome = encounter.outcome ?? 'friendly';

  const went: DateResult['went'] =
    outcome === 'date_planned' || outcome === 'number'
      ? 'great'
      : outcome === 'friendly' || outcome === 'you_left'
        ? 'fine'
        : 'badly';

  const dateOutfit = character.outfits.find(
    (outfit) => outfit.worn.length === 0 && !memory.seenOutfits.includes(outfit.id),
  );

  const entries: LogEntry[] = [...base.entries];
  let next: GameState = {
    ...base.state,
    dates: base.state.dates.map((entry) =>
      entry.characterId === date.characterId && entry.week === date.week && entry.dayIndex === date.dayIndex
        ? { ...entry, resolved: true }
        : entry,
    ),
    characters: {
      ...base.state.characters,
      [characterId]: {
        ...memory,
        dates: memory.dates + 1,
        stage: went === 'great' ? 'dating' : memory.stage,
        seenOutfits:
          went === 'great' && dateOutfit
            ? [...memory.seenOutfits, dateOutfit.id]
            : memory.seenOutfits,
        unlockedCgs:
          went === 'great' && memory.dates === 0
            ? [...memory.unlockedCgs, 'cg_first_date']
            : memory.unlockedCgs,
      },
    },
  };

  if (went === 'great') {
    entries.push(
      makeLogEntry(next, `That was a good night with ${character.name}, and you both know it.`, 'milestone', rng),
    );
    if (dateOutfit) {
      entries.push(makeLogEntry(next, `Gallery: ${dateOutfit.name} unlocked.`, 'good', rng));
    }
  }

  next = appendLog(next, entries.slice(base.entries.length));
  return { state: next, entries, went };
}
