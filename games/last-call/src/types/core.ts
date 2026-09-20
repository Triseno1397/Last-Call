import type { StatId } from '@/content/ids';

export const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayId = (typeof DAY_IDS)[number];

export const SLOT_IDS = ['morning', 'afternoon', 'evening'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export const WEEKDAYS: readonly DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
export const WEEKEND: readonly DayId[] = ['sat', 'sun'];

/** Where we are in the week. `slot` indexes SLOT_IDS. */
export interface GameClock {
  week: number;
  dayIndex: number;
  slotIndex: number;
}

/** A stat is a 0-100 value plus XP banked toward the next point. */
export interface StatValue {
  value: number;
  xp: number;
}

export type StatBlock = Record<StatId, StatValue>;

/** Skill level 0-5 plus XP toward the next level. */
export interface HobbyProgress {
  level: number;
  xp: number;
}

/** Social awareness drives how much of the conversation UI is legible (Phase 2). */
export interface AwarenessProgress {
  level: number;
  xp: number;
}

export type ContentRating = 'tame' | 'suggestive' | 'explicit';

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with the given probability. */
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** How many numbers have been drawn — persisted so saves stay deterministic. */
  readonly cursor: number;
}
