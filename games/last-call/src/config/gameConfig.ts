import type { ContentRating } from '@/types/core';

/**
 * CONTENT_RATING gates how far romance scenes go.
 *
 *  - 'tame'       : flirting and hand-holding, nothing more.
 *  - 'suggestive' : innuendo is fine, scenes fade to black at the door. (default)
 *  - 'explicit'   : reserved; no content is authored for this tier.
 *
 * Every character in the game is an adult (21+) and content is authored against
 * the 'suggestive' tier. Raising the tier does not unlock content that has not
 * been written for it.
 */
export const CONTENT_RATING: ContentRating = 'suggestive';

const RATING_ORDER: Record<ContentRating, number> = { tame: 0, suggestive: 1, explicit: 2 };

/** True when content authored for `required` may be shown at the current rating. */
export function allowsContent(required: ContentRating): boolean {
  return RATING_ORDER[CONTENT_RATING] >= RATING_ORDER[required];
}

/** Minimum age for any character in the game. Enforced by a content test. */
export const MINIMUM_CHARACTER_AGE = 21;

export const BALANCE = {
  /** Time slots per day. */
  slotsPerDay: 3,
  daysPerWeek: 7,

  energy: {
    base: 100,
    /** Energy restored overnight, before apartment quality and traits. */
    overnightRecovery: 70,
    /** Extra recovery for each rest activity taken during the day. */
    restActivityRecovery: 25,
    /** You can always act, but below this the day log gets grumpy. */
    tiredThreshold: 25,
  },

  stats: {
    min: 0,
    max: 100,
    /** XP needed for the next point = base + value * slope (diminishing returns). */
    xpBase: 40,
    xpSlope: 2.2,
    startingValue: 25,
    /** Character creation adds this to stats favoured by chosen perks. */
    creationBonus: 5,
  },

  hobbies: {
    maxLevel: 5,
    /** XP for the next level = base * (level + 1) ^ curve. */
    xpBase: 60,
    xpCurve: 1.35,
  },

  awareness: {
    maxLevel: 4,
    xpBase: 80,
    xpCurve: 1.5,
  },

  confidence: {
    /** Direct confidence value change on a social success. */
    successGain: 3,
    /** Surviving a rejection still teaches you something. */
    rejectionGain: 1,
    /** Applied once a failure streak reaches the threshold. */
    failureStreakThreshold: 3,
    failureStreakLoss: 4,
    /** XP granted by a rejection, so failure is still progress. */
    rejectionXp: 30,
  },

  money: {
    startingMoney: 180,
    /** Rent is charged at the start of each new week. */
    chargeRentOnWeekStart: true,
  },
} as const;

export type Balance = typeof BALANCE;
