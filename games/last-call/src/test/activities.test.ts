import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import {
  checkAvailability,
  listActivities,
  performActivity,
  previewActivity,
  resolveCost,
  skipSlot,
} from '@/engine/activities';
import { getActivity } from '@/content/activities';
import { createRng } from '@/engine/rng';
import { JOBS } from '@/content/lifestyle';
import { newTestGame } from '@/test/helpers';

const rng = () => createRng(7);

function at(state: GameState, dayIndex: number, slotIndex: number): GameState {
  return { ...state, clock: { ...state.clock, dayIndex, slotIndex } };
}

describe('costs', () => {
  it('adds the job energy cost and pay to work shifts', () => {
    const game = newTestGame();
    const job = JOBS[game.player.career.jobId];
    const cost = resolveCost(game.player, getActivity('work_shift'));
    expect(cost.energy).toBeGreaterThanOrEqual(job.energyPerSlot);
    expect(cost.moneyGain).toBe(job.payPerSlot);
  });

  it('pays Hustler more for the same shift', () => {
    const hustler = newTestGame({ perks: ['hustler', 'night_owl'] }).player;
    const plain = newTestGame({ perks: ['quick_wit', 'thick_skin'] }).player;
    const shift = getActivity('work_shift');
    expect(resolveCost(hustler, shift).moneyGain).toBeGreaterThan(resolveCost(plain, shift).moneyGain);
  });

  it('discounts physical activities for Gym Rat', () => {
    const gymRat = newTestGame({ perks: ['gym_rat', 'hustler'] }).player;
    const plain = newTestGame({ perks: ['quick_wit', 'hustler'] }).player;
    const gym = getActivity('gym_session');
    expect(resolveCost(gymRat, gym).energy).toBe(resolveCost(plain, gym).energy - 6);
  });

  it('charges Lightweight extra for a night out', () => {
    const lightweight = newTestGame({ flaw: 'lightweight' }).player;
    const plain = newTestGame({ flaw: 'name_forgetter' }).player;
    const night = getActivity('go_out_neon_last_call');
    expect(resolveCost(lightweight, night).energy).toBe(resolveCost(plain, night).energy + 12);
  });
});

describe('availability', () => {
  it('locks work at the weekend with a readable reason', () => {
    const saturday = at(newTestGame(), 5, 0);
    const availability = checkAvailability(saturday, getActivity('work_shift'));
    expect(availability.ok).toBe(false);
    expect(availability.reasons.join(' ')).toContain('Monday');
  });

  it('locks a two-slot activity when only one slot is left', () => {
    const evening = at(newTestGame(), 0, 2);
    const availability = checkAvailability(evening, getActivity('overtime'));
    expect(availability.ok).toBe(false);
    expect(availability.reasons.join(' ')).toContain('2 free slots');
  });

  it('locks purchases the player cannot afford', () => {
    const broke: GameState = (() => {
      const game = newTestGame();
      return { ...game, player: { ...game.player, money: 5 } };
    })();
    const availability = checkAvailability(broke, getActivity('shop_leather_jacket'));
    expect(availability.ok).toBe(false);
    expect(availability.reasons.some((reason) => reason.startsWith('Needs $'))).toBe(true);
  });

  it('locks activities the player is too tired for', () => {
    const game = newTestGame();
    const tired: GameState = { ...game, player: { ...game.player, energy: 1 } };
    expect(checkAvailability(tired, getActivity('gym_session')).ok).toBe(false);
  });

  it('shows the bar only in the evening on the nights it opens', () => {
    const wednesdayMorning = at(newTestGame(), 2, 0);
    const wednesdayEvening = at(newTestGame(), 2, 2);
    expect(checkAvailability(wednesdayMorning, getActivity('go_out_neon_last_call')).ok).toBe(false);
    expect(checkAvailability(wednesdayEvening, getActivity('go_out_neon_last_call')).ok).toBe(true);
  });
});

describe('performing activities', () => {
  it('pays out, drains energy and advances the clock', () => {
    const game = newTestGame();
    const cost = resolveCost(game.player, getActivity('work_shift'));
    const result = performActivity(game, 'work_shift', rng());

    expect(result.ok).toBe(true);
    expect(result.state.player.money).toBe(game.player.money + cost.moneyGain);
    expect(result.state.player.energy).toBe(game.player.energy - cost.energy);
    expect(result.state.clock.slotIndex).toBe(1);
    expect(result.state.week.moneyEarned).toBe(cost.moneyGain);
    expect(result.state.week.activitiesDone).toBe(1);
  });

  it('refuses a locked activity and leaves the state alone', () => {
    const saturday = at(newTestGame(), 5, 0);
    const result = performActivity(saturday, 'work_shift', rng());
    expect(result.ok).toBe(false);
    expect(result.state).toBe(saturday);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('spends two slots on a double shift', () => {
    const result = performActivity(newTestGame(), 'overtime', rng());
    expect(result.state.clock.slotIndex).toBe(2);
    expect(result.state.player.career.shiftsThisWeek).toBe(2);
  });

  it('banks stat XP through perk multipliers', () => {
    const game = newTestGame({ perks: ['gym_rat', 'hustler'] });
    const result = performActivity(game, 'gym_session', rng());
    expect(result.state.player.stats.fitness.xp).toBeGreaterThan(game.player.stats.fitness.xp);
  });

  it('caps energy at the ceiling when resting', () => {
    const game = newTestGame();
    const tired: GameState = { ...game, player: { ...game.player, energy: game.player.energy - 5 } };
    const result = performActivity(tired, 'rest', rng());
    expect(result.state.player.energy).toBe(game.player.energy);
  });

  it('buys an item, wears it and removes the purchase from the list', () => {
    const game = newTestGame();
    const rich: GameState = { ...game, player: { ...game.player, money: 500 } };
    const result = performActivity(rich, 'shop_leather_jacket', rng());
    expect(result.state.player.wardrobe).toContain('leather_jacket');
    expect(result.state.player.outfitId).toBe('leather_jacket');
    expect(result.state.player.flags['owns_leather_jacket']).toBe(true);
    expect(listActivities(result.state).some((p) => p.activity.id === 'shop_leather_jacket')).toBe(false);
  });

  it('applies a timed grooming bonus', () => {
    const game = newTestGame();
    const result = performActivity(game, 'barber', rng());
    const effect = result.state.player.temporaryEffects[0];
    expect(effect?.label).toBe('Fresh Cut');
    expect(effect?.expiresOnAbsoluteDay).toBe(7);
  });

  it('promotes the player once career XP is banked', () => {
    const game = newTestGame();
    const job = JOBS[game.player.career.jobId];
    const nearlyThere: GameState = {
      ...game,
      player: { ...game.player, career: { ...game.player.career, xp: job.xpToPromote } },
    };
    const result = performActivity(nearlyThere, 'work_shift', rng());
    expect(result.state.player.career.jobId).toBe(job.promotesTo);
    expect(result.state.log.some((entry) => entry.text.startsWith('Promoted'))).toBe(true);
  });

  it('records venue visits and reputation', () => {
    const thursdayEvening = at(newTestGame(), 3, 2);
    const result = performActivity(thursdayEvening, 'go_out_neon_last_call', rng());
    expect(result.state.player.venueReputation.neon_last_call).toBe(1);
    expect(result.state.week.venuesVisited).toEqual(['neon_last_call']);
    expect(result.dayRolled).toBe(true);
  });

  it('rolls the day when the last slot is used', () => {
    const evening = at(newTestGame(), 0, 2);
    const result = performActivity(evening, 'read_a_book', rng());
    expect(result.dayRolled).toBe(true);
    expect(result.state.clock.dayIndex).toBe(1);
  });
});

describe('skipping a slot', () => {
  it('burns the slot and counts it', () => {
    const result = skipSlot(newTestGame(), rng());
    expect(result.state.clock.slotIndex).toBe(1);
    expect(result.state.week.slotsWasted).toBe(1);
  });
});

describe('activity listing', () => {
  it('previews every activity with costs and lock reasons', () => {
    const game = newTestGame();
    const previews = listActivities(game);
    expect(previews.length).toBeGreaterThan(10);
    for (const preview of previews) {
      expect(preview.cost.slots).toBeGreaterThan(0);
      expect(preview.availability.ok || preview.availability.reasons.length > 0).toBe(true);
    }
    expect(previewActivity(game, getActivity('rest')).availability.ok).toBe(true);
  });
});
