import type {
  ApartmentId,
  FlawId,
  Gender,
  HobbyId,
  JobId,
  PerkId,
  StatId,
  VenueId,
  WardrobeItemId,
} from '@/content/ids';
import type { AwarenessProgress, HobbyProgress, StatBlock } from '@/types/core';

export interface AppearanceChoice {
  id: string;
  name: string;
  /** Hex colour for the placeholder portrait; real art replaces this. */
  swatch?: string;
}

export interface Appearance {
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  build: string;
  vibe: string;
}

export interface TemporaryEffect {
  id: string;
  label: string;
  stat: StatId;
  amount: number;
  /** Absolute day number (week * 7 + dayIndex) after which it lapses. */
  expiresOnAbsoluteDay: number;
}

export interface CareerState {
  jobId: JobId;
  xp: number;
  shiftsThisWeek: number;
}

/**
 * Confidence is dynamic: successes raise it, surviving a rejection raises it a
 * little, and a streak of failures dips it. The streak counters live here so
 * the conversation engine (Phase 2) can feed the same rules.
 */
export interface ConfidenceStreak {
  successes: number;
  failures: number;
}

export interface PlayerState {
  name: string;
  /** The game has two genders: man and woman. */
  gender: Gender;
  appearance: Appearance;
  perks: readonly PerkId[];
  flaw: FlawId;
  stats: StatBlock;
  hobbies: Record<HobbyId, HobbyProgress>;
  awareness: AwarenessProgress;
  money: number;
  energy: number;
  career: CareerState;
  apartmentId: ApartmentId;
  wardrobe: readonly WardrobeItemId[];
  outfitId: WardrobeItemId | null;
  confidence: ConfidenceStreak;
  temporaryEffects: readonly TemporaryEffect[];
  /** Per-venue reputation, -100..100. Phase 3 puts it to work. */
  venueReputation: Partial<Record<VenueId, number>>;
  flags: Record<string, boolean>;
}
