import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import { CITY_DOORS, CITY_HEIGHT, CITY_SPAWN, CITY_WIDTH } from '@/content/city';
import { VENUES } from '@/content/venues';
import {
  doorNear,
  doorState,
  isWalkable,
  lightLevel,
  peopleOnStreet,
  personNear,
  step,
  venueDoors,
} from '@/engine/city';
import { newTestGame } from '@/test/helpers';

function at(dayIndex: number, slotIndex: number): GameState {
  const game = newTestGame();
  return { ...game, clock: { week: 1, dayIndex, slotIndex } };
}

describe('the block', () => {
  it('lets you stand where the game starts you', () => {
    expect(isWalkable(CITY_SPAWN.x, CITY_SPAWN.y)).toBe(true);
  });

  it('keeps you out of buildings, the canal and the edge of the world', () => {
    expect(isWalkable(5, 31)).toBe(false); // inside Last Call
    expect(isWalkable(10, 45)).toBe(false); // the canal
    expect(isWalkable(47.5, 14)).toBe(false); // the fountain
    expect(isWalkable(-1, 14)).toBe(false);
    expect(isWalkable(CITY_WIDTH, 14)).toBe(false);
    expect(isWalkable(14, CITY_HEIGHT)).toBe(false);
  });

  it('puts every door somewhere you can actually stand', () => {
    for (const door of CITY_DOORS) {
      expect(isWalkable(door.x, door.y), `${door.label} is unreachable`).toBe(true);
    }
  });
});

describe('walking', () => {
  it('moves you when the way is clear', () => {
    const next = step({ x: 36, y: 24 }, 1, 0);
    expect(next.x).toBeGreaterThan(36);
  });

  it('stops at a wall instead of walking through it', () => {
    // On the pavement outside Last Call, facing its front wall.
    const against = { x: 6, y: 28.8 };
    const next = step(against, 0, 1);
    expect(next.y).toBe(against.y);
  });

  it('slides along a wall rather than sticking to it', () => {
    // Pushing diagonally into the building line still carries you sideways.
    const next = step({ x: 6, y: 28.8 }, 1, 1);
    expect(next.x).toBeGreaterThan(6);
    expect(next.y).toBe(28.8);
  });
});

describe('doors', () => {
  it('finds the one you are standing at, and nothing when you are not', () => {
    const bar = CITY_DOORS.find((door) => door.id === 'door_bar');
    if (!bar) throw new Error('missing door');
    expect(doorNear({ x: bar.x, y: bar.y })?.id).toBe('door_bar');
    expect(doorNear({ x: bar.x + 6, y: bar.y })).toBeNull();
  });

  it('opens the bar on a night it is open, in the evening', () => {
    const bar = CITY_DOORS.find((door) => door.id === 'door_bar');
    if (!bar) throw new Error('missing door');
    const thursdayEvening = doorState(at(3, 2), bar);
    expect(thursdayEvening.open).toBe(true);
    expect(thursdayEvening.inside).toContain('sable');

    const thursdayMorning = doorState(at(3, 0), bar);
    expect(thursdayMorning.open).toBe(false);
    expect(thursdayMorning.reason).toBeTruthy();
    expect(thursdayMorning.inside).toHaveLength(0);
  });

  it('refuses a door the day screen would also refuse, for the same reason', () => {
    const gym = CITY_DOORS.find((door) => door.id === 'door_gym');
    if (!gym) throw new Error('missing door');
    const broke: GameState = (() => {
      const game = at(0, 0);
      return { ...game, player: { ...game.player, energy: 0 } };
    })();
    const state = doorState(broke, gym);
    expect(state.open).toBe(false);
    expect(state.reason).toContain('Energy');
  });

  it('describes flavour doors without pretending they open', () => {
    const home = CITY_DOORS.find((door) => door.id === 'door_home');
    if (!home) throw new Error('missing door');
    const state = doorState(at(0, 1), home);
    expect(state.open).toBe(false);
    expect(state.reason).toContain('radiator');
  });

  it('has a door for every venue in the game', () => {
    const doors = venueDoors(at(0, 0)).map((state) => state.door.venue);
    for (const venue of Object.keys(VENUES)) {
      expect(doors).toContain(venue);
    }
  });
});

describe('time of day', () => {
  it('darkens the street in the evening', () => {
    expect(lightLevel(at(0, 2))).toBeLessThan(lightLevel(at(0, 1)));
  });
});

describe('people on the street', () => {
  it('puts someone outside the bar exactly when she is there', () => {
    // Sable keeps Wednesday-to-Saturday evenings at Last Call.
    const evening = peopleOnStreet(at(3, 2));
    expect(evening.map((person) => person.characterId)).toContain('sable');

    const morning = peopleOnStreet(at(3, 0));
    expect(morning.map((person) => person.characterId)).not.toContain('sable');
  });

  it('stands them where the door is, so you can walk up to them', () => {
    const bar = CITY_DOORS.find((door) => door.venue === 'neon_last_call');
    expect(bar).toBeDefined();
    const sable = peopleOnStreet(at(3, 2)).find((person) => person.characterId === 'sable');
    expect(sable).toBeDefined();
    // Beside the door, not on it: the threshold has to stay clear or the door
    // loses every proximity check to the person standing in it.
    expect(Math.abs(sable!.x - bar!.x)).toBeGreaterThan(1);
    expect(Math.abs(sable!.x - bar!.x)).toBeLessThan(4);
    expect(Math.abs(sable!.y - bar!.y)).toBeLessThan(2);
  });

  it('carries the venue she is outside, so her conversation is weighted by it', () => {
    const sable = peopleOnStreet(at(3, 2)).find((person) => person.characterId === 'sable');
    expect(sable?.venueId).toBe('neon_last_call');
  });

  it('only reaches someone you are actually standing next to', () => {
    const people = peopleOnStreet(at(3, 2));
    const sable = people.find((person) => person.characterId === 'sable');
    expect(sable).toBeDefined();

    expect(personNear(people, { x: sable!.x, y: sable!.y })?.characterId).toBe('sable');
    expect(personNear(people, { x: sable!.x + 0.8, y: sable!.y })?.characterId).toBe('sable');
    expect(personNear(people, { x: sable!.x + 9, y: sable!.y + 9 })).toBeNull();
  });

  it('finds nobody on an empty street', () => {
    expect(personNear(peopleOnStreet(at(0, 0)), CITY_SPAWN)).toBeNull();
  });
});
