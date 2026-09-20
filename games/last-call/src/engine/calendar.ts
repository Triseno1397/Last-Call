import type { DayId, GameClock, Rng, SlotId } from '@/types/core';
import type { GameState, LogEntry, LogTone, WeekSummary } from '@/types/game';
import type { PlayerState } from '@/types/player';
import { DAY_IDS, SLOT_IDS } from '@/types/core';
import { BALANCE } from '@/config/gameConfig';
import { APARTMENTS } from '@/content/lifestyle';
import { maxEnergy, restRecoveryMultiplier } from '@/engine/traits';

export const MAX_LOG_ENTRIES = 80;

export const DAY_LABELS: Readonly<Record<DayId, string>> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const SLOT_LABELS: Readonly<Record<SlotId, string>> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function currentDay(clock: GameClock): DayId {
  return DAY_IDS[clock.dayIndex % DAY_IDS.length] as DayId;
}

export function currentSlot(clock: GameClock): SlotId {
  return SLOT_IDS[clock.slotIndex % SLOT_IDS.length] as SlotId;
}

/** Day number since the start of the game, used for timed effects. */
export function absoluteDay(clock: GameClock): number {
  return (clock.week - 1) * BALANCE.daysPerWeek + clock.dayIndex;
}

export function slotsRemainingToday(clock: GameClock): number {
  return BALANCE.slotsPerDay - clock.slotIndex;
}

export function makeLogEntry(
  state: GameState,
  text: string,
  tone: LogTone,
  rng: Rng,
): LogEntry {
  return {
    id: `${state.clock.week}-${state.clock.dayIndex}-${state.clock.slotIndex}-${rng.int(0, 1_000_000)}`,
    week: state.clock.week,
    dayIndex: state.clock.dayIndex,
    slotIndex: state.clock.slotIndex,
    text,
    tone,
  };
}

export function appendLog(state: GameState, entries: readonly LogEntry[]): GameState {
  if (entries.length === 0) return state;
  return { ...state, log: [...state.log, ...entries].slice(-MAX_LOG_ENTRIES) };
}

export function emptyWeekSummary(week: number): WeekSummary {
  return {
    week,
    moneyEarned: 0,
    moneySpent: 0,
    statGains: {},
    hobbyLevelUps: [],
    venuesVisited: [],
    activitiesDone: 0,
    slotsWasted: 0,
    highlights: [],
  };
}

/** Overnight recovery, apartment quality and traits included. */
export function overnightEnergy(player: PlayerState): number {
  const apartment = APARTMENTS[player.apartmentId];
  const recovered = Math.round(
    BALANCE.energy.overnightRecovery * apartment.restQuality * restRecoveryMultiplier(player),
  );
  return Math.min(maxEnergy(player), player.energy + recovered);
}

function expireTemporaryEffects(
  player: PlayerState,
  absDay: number,
): { player: PlayerState; expired: readonly string[] } {
  const kept = player.temporaryEffects.filter((effect) => effect.expiresOnAbsoluteDay >= absDay);
  const expired = player.temporaryEffects
    .filter((effect) => effect.expiresOnAbsoluteDay < absDay)
    .map((effect) => effect.label);
  if (expired.length === 0) return { player, expired };
  return { player: { ...player, temporaryEffects: kept }, expired };
}

export interface AdvanceResult {
  state: GameState;
  entries: readonly LogEntry[];
  dayRolled: boolean;
  weekRolled: boolean;
}

function startNewWeek(state: GameState, rng: Rng): { state: GameState; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  const week = state.clock.week + 1;
  const apartment = APARTMENTS[state.player.apartmentId];
  let player: PlayerState = {
    ...state.player,
    career: { ...state.player.career, shiftsThisWeek: 0 },
  };

  let next: GameState = {
    ...state,
    clock: { week, dayIndex: 0, slotIndex: 0 },
    lastWeek: state.week,
    week: emptyWeekSummary(week),
  };

  let rentPaid = 0;
  if (BALANCE.money.chargeRentOnWeekStart) {
    const rent = apartment.rentPerWeek;
    if (player.money >= rent) {
      rentPaid = rent;
      player = { ...player, money: player.money - rent };
      entries.push(
        makeLogEntry(next, `Rent went out: -$${rent} for ${apartment.name}.`, 'neutral', rng),
      );
    } else {
      rentPaid = player.money;
      player = { ...player, money: 0, flags: { ...player.flags, behind_on_rent: true } };
      entries.push(
        makeLogEntry(
          next,
          `You could not cover rent. Your landlord has started using your full name.`,
          'bad',
          rng,
        ),
      );
    }
  }

  next = { ...next, player, week: { ...next.week, moneySpent: rentPaid } };
  entries.push(makeLogEntry(next, `Week ${week}. The city resets and so do you.`, 'milestone', rng));
  return { state: next, entries };
}

/** Roll the clock into the next day, restoring energy and expiring effects. */
export function startNewDay(state: GameState, rng: Rng): { state: GameState; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  const nextDayIndex = state.clock.dayIndex + 1;

  let next: GameState =
    nextDayIndex >= BALANCE.daysPerWeek
      ? (() => {
          const rolled = startNewWeek(state, rng);
          entries.push(...rolled.entries);
          return rolled.state;
        })()
      : { ...state, clock: { ...state.clock, dayIndex: nextDayIndex, slotIndex: 0 } };

  const absDay = absoluteDay(next.clock);
  const { player: afterExpiry, expired } = expireTemporaryEffects(next.player, absDay);
  const player: PlayerState = { ...afterExpiry, energy: overnightEnergy(afterExpiry) };
  next = { ...next, player };

  for (const label of expired) {
    entries.push(makeLogEntry(next, `${label} has worn off.`, 'neutral', rng));
  }
  if (player.energy < BALANCE.energy.tiredThreshold) {
    entries.push(
      makeLogEntry(next, 'You woke up tired. The day starts at a deficit.', 'bad', rng),
    );
  }

  return { state: next, entries };
}

/** Move the clock forward, rolling into new days and weeks as needed. */
export function advanceSlots(state: GameState, slots: number, rng: Rng): AdvanceResult {
  let next: GameState = { ...state, clock: { ...state.clock, slotIndex: state.clock.slotIndex + slots } };
  const entries: LogEntry[] = [];
  let dayRolled = false;
  let weekRolled = false;

  while (next.clock.slotIndex >= BALANCE.slotsPerDay) {
    const overflow = next.clock.slotIndex - BALANCE.slotsPerDay;
    const weekBefore = next.clock.week;
    const rolled = startNewDay({ ...next, clock: { ...next.clock, slotIndex: 0 } }, rng);
    next = { ...rolled.state, clock: { ...rolled.state.clock, slotIndex: overflow } };
    entries.push(...rolled.entries);
    dayRolled = true;
    if (next.clock.week !== weekBefore) weekRolled = true;
  }

  return { state: next, entries, dayRolled, weekRolled };
}
