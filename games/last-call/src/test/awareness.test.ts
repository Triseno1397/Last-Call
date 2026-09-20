import { describe, expect, it } from 'vitest';
import type { PlayerState } from '@/types/player';
import { effectiveAwareness, meterVisibility, readComfort, readInterest, showsReasons } from '@/engine/awareness';
import { newTestGame } from '@/test/helpers';

function withAwareness(level: number, overrides: Partial<PlayerState> = {}): PlayerState {
  const game = newTestGame({ perks: ['hustler', 'night_owl'], flaw: 'lightweight' });
  return { ...game.player, awareness: { level, xp: 0 }, ...overrides };
}

describe('what the player can see', () => {
  it('shows nothing at all to start with', () => {
    const visibility = meterVisibility(withAwareness(0), false);
    expect(visibility).toBe('hidden');
    const readout = readInterest(70, 5, visibility);
    expect(readout.label).toBeNull();
    expect(readout.segments).toBeNull();
    expect(readout.value).toBeNull();
  });

  it('gives words before it gives bars', () => {
    const readout = readInterest(70, 5, meterVisibility(withAwareness(1), false));
    expect(readout.label).toBe('She is enjoying this');
    expect(readout.segments).toBeNull();
    expect(readout.value).toBeNull();
  });

  it('gives bars and a direction before it gives numbers', () => {
    const readout = readComfort(48, -3, meterVisibility(withAwareness(2), false));
    expect(readout.segments).toBeGreaterThan(0);
    expect(readout.value).toBeNull();
    expect(readout.delta).toBe('down');
  });

  it('gives numbers at level three', () => {
    const readout = readInterest(48, 3, meterVisibility(withAwareness(3), false));
    expect(readout.value).toBe(48);
    expect(readout.delta).toBe('+3');
  });

  it('explains itself only at the top', () => {
    expect(showsReasons(meterVisibility(withAwareness(3), false))).toBe(false);
    expect(showsReasons(meterVisibility(withAwareness(4), false))).toBe(true);
  });

  it('can be forced on from settings for players who want the numbers', () => {
    expect(meterVisibility(withAwareness(0), true)).toBe('precise');
  });
});

describe('perks and flaws change how legible she is', () => {
  it('lets a Good Listener read her a level early', () => {
    const listener = newTestGame({ perks: ['good_listener', 'hustler'] }).player;
    const plain = newTestGame({ perks: ['hustler', 'night_owl'] }).player;
    expect(effectiveAwareness(listener)).toBe(effectiveAwareness(plain) + 1);
  });

  it('costs a Name Forgetter a level of clarity', () => {
    const forgetful = { ...newTestGame({ flaw: 'name_forgetter' }).player, awareness: { level: 2, xp: 0 } };
    const plain = { ...newTestGame({ flaw: 'lightweight' }).player, awareness: { level: 2, xp: 0 } };
    expect(effectiveAwareness(forgetful)).toBe(effectiveAwareness(plain) - 1);
  });

  it('never drops below zero or past the cap', () => {
    const forgetful = { ...newTestGame({ flaw: 'name_forgetter' }).player, awareness: { level: 0, xp: 0 } };
    expect(effectiveAwareness(forgetful)).toBe(0);
    const listener = { ...newTestGame({ perks: ['good_listener', 'hustler'] }).player, awareness: { level: 4, xp: 0 } };
    expect(effectiveAwareness(listener)).toBe(4);
  });
});
