import { describe, expect, it } from 'vitest';
import { ACTIVITY_LIST } from '@/content/activities';
import { HOBBIES } from '@/content/hobbies';
import { APARTMENTS, JOBS, WARDROBE } from '@/content/lifestyle';
import { FLAW_LIST, PERK_LIST } from '@/content/traits';
import { VENUE_LIST, VENUES } from '@/content/venues';
import { CHARACTER_IDS, HOBBY_IDS, STAT_IDS, VENUE_IDS } from '@/content/ids';

/**
 * Content integrity. These catch the mistakes that are easy to make when adding
 * data by hand: a typo'd id, a perk with no effects, a venue nobody visits.
 */
describe('activities', () => {
  it('reference only real stats, hobbies, venues and items', () => {
    for (const activity of ACTIVITY_LIST) {
      for (const effect of activity.effects) {
        if (effect.kind === 'statXp') expect(STAT_IDS).toContain(effect.stat);
        if (effect.kind === 'hobbyXp') expect(HOBBY_IDS).toContain(effect.hobby);
        if (effect.kind === 'visitVenue') expect(VENUE_IDS).toContain(effect.venue);
        if (effect.kind === 'unlockWardrobe') expect(WARDROBE[effect.item]).toBeDefined();
        if (effect.kind === 'temporaryStatBonus') expect(effect.days).toBeGreaterThan(0);
      }
    }
  });

  it('cost at least one slot and carry flavour text', () => {
    for (const activity of ACTIVITY_LIST) {
      expect(activity.cost.slots).toBeGreaterThanOrEqual(1);
      expect(activity.name.length).toBeGreaterThan(0);
      expect(activity.flavour.length).toBeGreaterThan(0);
    }
  });

  it('has one practice activity per hobby and one night out per venue', () => {
    for (const hobby of HOBBY_IDS) {
      expect(ACTIVITY_LIST.some((activity) => activity.id === `practice_${hobby}`)).toBe(true);
    }
    for (const venue of VENUE_IDS) {
      expect(ACTIVITY_LIST.some((activity) => activity.id === `go_out_${venue}`)).toBe(true);
    }
  });

  it('gives every purchasable wardrobe item a shop activity', () => {
    for (const item of Object.values(WARDROBE)) {
      if (item.price > 0) {
        expect(ACTIVITY_LIST.some((activity) => activity.id === `shop_${item.id}`)).toBe(true);
      }
    }
  });
});

describe('traits', () => {
  it('all do something and explain themselves', () => {
    for (const trait of [...PERK_LIST, ...FLAW_LIST]) {
      expect(trait.effects.length).toBeGreaterThan(0);
      expect(trait.blurb.length).toBeGreaterThan(10);
      expect(trait.mechanics.length).toBeGreaterThan(10);
    }
  });

  it('keeps ids and map keys in sync', () => {
    for (const trait of [...PERK_LIST, ...FLAW_LIST]) {
      expect(trait.id).toBeTruthy();
    }
  });
});

describe('venues', () => {
  it('open on at least one day and slot, and weight real stats', () => {
    for (const venue of VENUE_LIST) {
      expect(venue.openDays.length).toBeGreaterThan(0);
      expect(venue.openSlots.length).toBeGreaterThan(0);
      expect(venue.atmosphere.length).toBeGreaterThan(0);
      for (const stat of Object.keys(venue.statWeights)) {
        expect(STAT_IDS).toContain(stat);
      }
    }
  });

  it('schedules regulars only at times the venue is open', () => {
    for (const venue of VENUE_LIST) {
      for (const entry of venue.regulars) {
        expect(CHARACTER_IDS).toContain(entry.character);
        for (const day of entry.days) expect(venue.openDays).toContain(day);
        for (const slot of entry.slots) expect(venue.openSlots).toContain(slot);
      }
    }
  });

  it('gives every character at least one place to be found', () => {
    for (const character of CHARACTER_IDS) {
      const appears = VENUE_LIST.some((venue) =>
        venue.regulars.some((entry) => entry.character === character),
      );
      expect(appears).toBe(true);
    }
  });
});

describe('lifestyle ladders', () => {
  it('chains jobs upward and ends at the top', () => {
    for (const job of Object.values(JOBS)) {
      if (job.promotesTo) {
        expect(JOBS[job.promotesTo].tier).toBe(job.tier + 1);
        expect(JOBS[job.promotesTo].payPerSlot).toBeGreaterThan(job.payPerSlot);
      }
    }
  });

  it('prices apartments in line with what they give back', () => {
    const tiers = Object.values(APARTMENTS).sort((a, b) => a.tier - b.tier);
    for (let i = 1; i < tiers.length; i += 1) {
      const previous = tiers[i - 1]!;
      const current = tiers[i]!;
      expect(current.rentPerWeek).toBeGreaterThan(previous.rentPerWeek);
      expect(current.restQuality).toBeGreaterThanOrEqual(previous.restQuality);
    }
  });

  it('suits every wardrobe item to a real venue', () => {
    for (const item of Object.values(WARDROBE)) {
      for (const venue of item.suitedTo) expect(VENUES[venue]).toBeDefined();
    }
  });

  it('gives every hobby a stat affinity', () => {
    for (const hobby of Object.values(HOBBIES)) {
      expect(STAT_IDS).toContain(hobby.affinity);
    }
  });
});
