import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import {
  absoluteDay,
  advanceSlots,
  currentDay,
  currentSlot,
  overnightEnergy,
  slotsRemainingToday,
  startNewDay,
} from '@/engine/calendar';
import { createRng } from '@/engine/rng';
import { BALANCE } from '@/config/gameConfig';
import { APARTMENTS } from '@/content/lifestyle';
import { maxEnergy } from '@/engine/traits';
import { newTestGame } from '@/test/helpers';

const rng = () => createRng(99);

function drain(state: GameState, energy: number): GameState {
  return { ...state, player: { ...state.player, energy } };
}

describe('clock', () => {
  it('reads the day and slot from the clock', () => {
    const game = newTestGame();
    expect(currentDay(game.clock)).toBe('mon');
    expect(currentSlot(game.clock)).toBe('morning');
    expect(slotsRemainingToday(game.clock)).toBe(BALANCE.slotsPerDay);
  });

  it('counts absolute days across weeks', () => {
    expect(absoluteDay({ week: 1, dayIndex: 0, slotIndex: 0 })).toBe(0);
    expect(absoluteDay({ week: 2, dayIndex: 3, slotIndex: 1 })).toBe(10);
  });
});

describe('advancing slots', () => {
  it('moves within a day without rolling over', () => {
    const result = advanceSlots(newTestGame(), 1, rng());
    expect(result.dayRolled).toBe(false);
    expect(currentSlot(result.state.clock)).toBe('afternoon');
  });

  it('rolls into the next day when the slots run out', () => {
    const result = advanceSlots(newTestGame(), BALANCE.slotsPerDay, rng());
    expect(result.dayRolled).toBe(true);
    expect(result.state.clock.dayIndex).toBe(1);
    expect(currentDay(result.state.clock)).toBe('tue');
    expect(currentSlot(result.state.clock)).toBe('morning');
  });

  it('rolls into the next week after seven days', () => {
    let state = newTestGame();
    for (let i = 0; i < BALANCE.daysPerWeek * BALANCE.slotsPerDay; i += 1) {
      state = advanceSlots(state, 1, rng()).state;
    }
    expect(state.clock.week).toBe(2);
    expect(state.clock.dayIndex).toBe(0);
    expect(currentDay(state.clock)).toBe('mon');
  });
});

describe('overnight', () => {
  it('restores energy up to the ceiling', () => {
    const game = drain(newTestGame(), 10);
    const recovered = overnightEnergy(game.player);
    expect(recovered).toBeGreaterThan(10);
    expect(recovered).toBeLessThanOrEqual(maxEnergy(game.player));
  });

  it('never exceeds the ceiling', () => {
    const game = newTestGame();
    expect(overnightEnergy(game.player)).toBe(maxEnergy(game.player));
  });

  it('expires temporary effects that have run out', () => {
    const game = newTestGame();
    const withEffects: GameState = {
      ...game,
      player: {
        ...game.player,
        temporaryEffects: [
          { id: 'a', label: 'Fresh Cut', stat: 'style', amount: 6, expiresOnAbsoluteDay: 0 },
          { id: 'b', label: 'New Boots', stat: 'style', amount: 3, expiresOnAbsoluteDay: 5 },
        ],
      },
    };
    const { state } = startNewDay(withEffects, rng());
    expect(state.player.temporaryEffects.map((effect) => effect.label)).toEqual(['New Boots']);
  });
});

describe('week rollover', () => {
  it('charges rent and starts a fresh summary', () => {
    let state = newTestGame();
    state = { ...state, week: { ...state.week, activitiesDone: 9 } };
    const moneyBefore = state.player.money;

    for (let i = 0; i < BALANCE.daysPerWeek * BALANCE.slotsPerDay; i += 1) {
      state = advanceSlots(state, 1, rng()).state;
    }

    const rent = APARTMENTS[state.player.apartmentId].rentPerWeek;
    expect(state.player.money).toBe(moneyBefore - rent);
    expect(state.week.week).toBe(2);
    expect(state.week.activitiesDone).toBe(0);
    expect(state.lastWeek?.activitiesDone).toBe(9);
  });

  it('flags the player when rent cannot be paid', () => {
    let state = newTestGame();
    state = { ...state, player: { ...state.player, money: 0 } };
    for (let i = 0; i < BALANCE.daysPerWeek * BALANCE.slotsPerDay; i += 1) {
      state = advanceSlots(state, 1, rng()).state;
    }
    expect(state.player.money).toBe(0);
    expect(state.player.flags['behind_on_rent']).toBe(true);
    // Only what could actually be paid is booked against the new week.
    expect(state.week.moneySpent).toBe(0);
  });
});
