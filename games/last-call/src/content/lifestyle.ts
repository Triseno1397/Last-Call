import type { ApartmentId, JobId, WardrobeItemId } from '@/content/ids';
import type { ApartmentDef, JobDef, WardrobeItemDef } from '@/types/activities';

export const JOBS: Readonly<Record<JobId, JobDef>> = {
  night_shift_barback: {
    id: 'night_shift_barback',
    title: 'Night-Shift Barback',
    tier: 1,
    payPerSlot: 55,
    energyPerSlot: 28,
    xpToPromote: 220,
    promotesTo: 'support_rep',
    blurb: 'Ice, kegs, and a mop with your name on it. You hear every bad line in the city.',
  },
  support_rep: {
    id: 'support_rep',
    title: 'Support Rep',
    tier: 2,
    payPerSlot: 78,
    energyPerSlot: 24,
    xpToPromote: 520,
    promotesTo: 'junior_designer',
    blurb: 'You are professionally calm at people who are not. Somehow this is a transferable skill.',
  },
  junior_designer: {
    id: 'junior_designer',
    title: 'Junior Designer',
    tier: 3,
    payPerSlot: 108,
    energyPerSlot: 22,
    xpToPromote: 980,
    promotesTo: 'studio_lead',
    blurb: 'Nudging a logo four pixels left while a man named Grant says "make it pop".',
  },
  studio_lead: {
    id: 'studio_lead',
    title: 'Studio Lead',
    tier: 4,
    payPerSlot: 150,
    energyPerSlot: 26,
    xpToPromote: Number.POSITIVE_INFINITY,
    promotesTo: null,
    blurb: 'You are Grant now. Be better than Grant.',
  },
};

export const STARTING_JOB: JobId = 'night_shift_barback';

export const APARTMENTS: Readonly<Record<ApartmentId, ApartmentDef>> = {
  shoebox: {
    id: 'shoebox',
    name: 'The Shoebox',
    tier: 1,
    rentPerWeek: 120,
    maxEnergyBonus: 0,
    restQuality: 1,
    dateAppeal: 1,
    blurb: 'One room, one window, one radiator that sounds like a haunted trumpet.',
  },
  walkup: {
    id: 'walkup',
    name: 'Third-Floor Walk-Up',
    tier: 2,
    rentPerWeek: 265,
    maxEnergyBonus: 10,
    restQuality: 1.12,
    dateAppeal: 2,
    blurb: 'Actual kitchen. Actual couch. The stairs keep you humble.',
  },
  loft: {
    id: 'loft',
    name: 'Corner Loft',
    tier: 3,
    rentPerWeek: 520,
    maxEnergyBonus: 20,
    restQuality: 1.25,
    dateAppeal: 4,
    blurb: 'Big windows, good record player, a couch people do not want to leave.',
  },
};

export const STARTING_APARTMENT: ApartmentId = 'shoebox';

export const WARDROBE: Readonly<Record<WardrobeItemId, WardrobeItemDef>> = {
  thrifted_tee: {
    id: 'thrifted_tee',
    name: 'Thrifted Band Tee',
    price: 0,
    styleBonus: 1,
    suitedTo: ['neon_last_call'],
    blurb: 'A band you have never listened to. Do not get asked about it.',
  },
  black_jeans: {
    id: 'black_jeans',
    name: 'Black Jeans That Fit',
    price: 0,
    styleBonus: 2,
    suitedTo: ['neon_last_call', 'margin_notes'],
    blurb: 'The single most load-bearing item you own.',
  },
  training_fit: {
    id: 'training_fit',
    name: 'Training Fit',
    price: 70,
    styleBonus: 5,
    suitedTo: ['ironhaus'],
    blurb: 'Looks like you know what a deload week is.',
  },
  linen_shirt: {
    id: 'linen_shirt',
    name: 'Linen Shirt',
    price: 95,
    styleBonus: 6,
    suitedTo: ['margin_notes'],
    blurb: 'Reads as "I have read a book on purpose" without saying it out loud.',
  },
  leather_jacket: {
    id: 'leather_jacket',
    name: 'Leather Jacket',
    price: 145,
    styleBonus: 8,
    suitedTo: ['neon_last_call'],
    blurb: 'Second-hand, slightly too big, absolutely works after 10pm.',
  },
  tailored_coat: {
    id: 'tailored_coat',
    name: 'Tailored Coat',
    price: 330,
    styleBonus: 12,
    suitedTo: ['neon_last_call', 'margin_notes', 'ironhaus'],
    blurb: 'The coat that makes strangers assume you have a dinner reservation.',
  },
};

export const STARTING_WARDROBE: readonly WardrobeItemId[] = ['thrifted_tee', 'black_jeans'];

export const WARDROBE_LIST: readonly WardrobeItemDef[] = Object.values(WARDROBE);
export const JOB_LIST: readonly JobDef[] = Object.values(JOBS);
export const APARTMENT_LIST: readonly ApartmentDef[] = Object.values(APARTMENTS);
