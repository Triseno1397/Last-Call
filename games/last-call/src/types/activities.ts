import type {
  ActivityId,
  ApartmentId,
  HobbyId,
  JobId,
  StatId,
  VenueId,
  WardrobeItemId,
} from '@/content/ids';
import type { DayId, SlotId } from '@/types/core';

export type ActivityTag =
  | 'work'
  | 'physical'
  | 'social'
  | 'solo'
  | 'creative'
  | 'study'
  | 'grooming'
  | 'spending'
  | 'restful'
  | 'nightlife';

export type ActivityCategory = 'career' | 'self' | 'lifestyle' | 'social' | 'rest';

/** Gate on an activity or (later) a dialogue option. */
export type Requirement =
  | { kind: 'stat'; stat: StatId; min: number }
  | { kind: 'money'; min: number }
  | { kind: 'energy'; min: number }
  | { kind: 'hobby'; hobby: HobbyId; minLevel: number }
  | { kind: 'jobTier'; min: number }
  | { kind: 'apartment'; apartment: ApartmentId }
  | { kind: 'day'; days: readonly DayId[] }
  | { kind: 'slot'; slots: readonly SlotId[] }
  | { kind: 'flag'; flag: string; value: boolean };

export type ActivityEffect =
  | { kind: 'statXp'; stat: StatId; amount: number }
  | { kind: 'hobbyXp'; hobby: HobbyId; amount: number }
  | { kind: 'awarenessXp'; amount: number }
  | { kind: 'money'; amount: number }
  | { kind: 'energy'; amount: number }
  | { kind: 'careerXp'; amount: number }
  | { kind: 'temporaryStatBonus'; stat: StatId; amount: number; days: number; label: string }
  | { kind: 'unlockWardrobe'; item: WardrobeItemId }
  | { kind: 'setFlag'; flag: string; value: boolean }
  | { kind: 'visitVenue'; venue: VenueId };

export interface ActivityCost {
  /** Time slots consumed. Most activities take 1; overtime takes 2. */
  slots: number;
  energy: number;
  money: number;
}

export interface ActivityDef {
  id: ActivityId;
  name: string;
  /** Flavour line shown on the card. */
  blurb: string;
  category: ActivityCategory;
  tags: readonly ActivityTag[];
  cost: ActivityCost;
  requirements: readonly Requirement[];
  effects: readonly ActivityEffect[];
  /** Randomised one-liners appended to the day log. */
  flavour: readonly string[];
  /** Set when the activity is "go to a venue"; Phase 2 hands off to encounters. */
  venue?: VenueId;
  /** Set when the activity is a shift at the player's current job. */
  usesJobPay?: boolean;
}

export interface JobDef {
  id: JobId;
  title: string;
  tier: number;
  /** Money earned per work slot before trait multipliers. */
  payPerSlot: number;
  energyPerSlot: number;
  /** Career XP needed to be promoted out of this job. */
  xpToPromote: number;
  promotesTo: JobId | null;
  blurb: string;
}

export interface ApartmentDef {
  id: ApartmentId;
  name: string;
  tier: number;
  rentPerWeek: number;
  maxEnergyBonus: number;
  /** Multiplier applied to overnight energy recovery. */
  restQuality: number;
  /** Phase 4: whether at-home dates are a good idea. */
  dateAppeal: number;
  blurb: string;
}

export interface WardrobeItemDef {
  id: WardrobeItemId;
  name: string;
  price: number;
  styleBonus: number;
  /** Venues where this fit reads as the right call. */
  suitedTo: readonly VenueId[];
  blurb: string;
}

export interface HobbyDef {
  id: HobbyId;
  name: string;
  blurb: string;
  /** Stat that improves alongside the hobby. */
  affinity: StatId;
  /** Shown in the phone/contacts once shared interests are discovered. */
  sharedInterestLine: string;
}
