/**
 * Central id registry.
 *
 * Every cross-referencable piece of content declares its id here so the rest of
 * the codebase gets compile-time checking on references (an activity that grants
 * XP to a hobby that does not exist will not typecheck).
 *
 * This file must never import anything: it sits below the type layer.
 */

export const STAT_IDS = ['charm', 'humor', 'confidence', 'fitness', 'style', 'culture'] as const;
export type StatId = (typeof STAT_IDS)[number];

export const HOBBY_IDS = ['guitar', 'cooking', 'salsa', 'climbing', 'photography'] as const;
export type HobbyId = (typeof HOBBY_IDS)[number];

export const PERK_IDS = [
  'quick_wit',
  'good_listener',
  'gym_rat',
  'well_read',
  'night_owl',
  'dress_sense',
  'thick_skin',
  'hustler',
] as const;
export type PerkId = (typeof PERK_IDS)[number];

export const FLAW_IDS = [
  'awkward_texter',
  'overthinker',
  'lightweight',
  'workaholic',
  'chronically_broke',
  'name_forgetter',
] as const;
export type FlawId = (typeof FLAW_IDS)[number];

export type TraitId = PerkId | FlawId;

export const VENUE_IDS = ['neon_last_call', 'margin_notes', 'ironhaus'] as const;
export type VenueId = (typeof VENUE_IDS)[number];

export const JOB_IDS = [
  'night_shift_barback',
  'support_rep',
  'junior_designer',
  'studio_lead',
] as const;
export type JobId = (typeof JOB_IDS)[number];

export const APARTMENT_IDS = ['shoebox', 'walkup', 'loft'] as const;
export type ApartmentId = (typeof APARTMENT_IDS)[number];

export const WARDROBE_IDS = [
  'thrifted_tee',
  'black_jeans',
  'leather_jacket',
  'linen_shirt',
  'tailored_coat',
  'training_fit',
] as const;
export type WardrobeItemId = (typeof WARDROBE_IDS)[number];

export const BASE_ACTIVITY_IDS = [
  'work_shift',
  'overtime',
  'gym_session',
  'improv_class',
  'read_a_book',
  'barber',
  'rest',
  'wander_the_city',
] as const;
export type BaseActivityId = (typeof BASE_ACTIVITY_IDS)[number];

/**
 * Practice, shopping and night-out activities are generated from hobby, wardrobe
 * and venue data, so adding one of those never means adding an activity by hand.
 */
export type PracticeActivityId = `practice_${HobbyId}`;
export type ShopActivityId = `shop_${WardrobeItemId}`;
export type VenueActivityId = `go_out_${VenueId}`;

export type ActivityId = BaseActivityId | PracticeActivityId | ShopActivityId | VenueActivityId;

/**
 * Characters are declared here too, so venue schedules and dialogue trees can
 * reference them safely. Data for them lands in Phase 2/3.
 */
export const CHARACTER_IDS = ['sable', 'wren', 'nadia'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
