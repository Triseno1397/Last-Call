import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import { CITY_DOORS } from '@/content/city';
import { INTERIORS } from '@/content/interiors';
import { STAT_IDS } from '@/content/ids';
import { STRANGERS, getStranger } from '@/content/strangers';
import { BACKDROPS } from '@/content/backdrops';
import { GESTURES, GESTURES_BY_PLACE, applyScriptedGesture, gesturesFor } from '@/engine/gestures';
import { interiorWalkable, roomPeople, roomStrangerNear, roomStrangers } from '@/engine/interior';
import { newTestGame } from '@/test/helpers';

function at(dayIndex: number, slotIndex: number, week = 1): GameState {
  const game = newTestGame();
  return { ...game, clock: { week, dayIndex, slotIndex } };
}

describe('every place on the block', () => {
  it('has a door for every room, and a room for every door that opens', () => {
    for (const door of CITY_DOORS) {
      if (door.place) expect(INTERIORS[door.place], door.label).toBeDefined();
    }
    for (const id of Object.keys(INTERIORS)) {
      expect(CITY_DOORS.some((door) => door.venue === id || door.place === id), id).toBe(true);
    }
  });

  it('has someone working in it', () => {
    for (const def of Object.values(INTERIORS)) {
      const staff = def.stations
        .map((station) => station.stranger && getStranger(station.stranger))
        .filter((person) => person && person.role === 'staff');
      expect(staff.length, `${def.venue} has nobody behind the counter`).toBeGreaterThan(0);
    }
  });

  it('only names people who exist', () => {
    for (const def of Object.values(INTERIORS)) {
      for (const station of def.stations) {
        if (station.stranger) expect(getStranger(station.stranger), station.stranger).toBeDefined();
      }
    }
  });

  it('gives every fixture action a real stat and a line', () => {
    for (const def of Object.values(INTERIORS)) {
      for (const prop of def.props) {
        if (!prop.action) continue;
        expect(prop.action.line.length).toBeGreaterThan(10);
        expect(prop.action.cost).toBeGreaterThanOrEqual(0);
        if (prop.action.statXp) expect(STAT_IDS).toContain(prop.action.statXp.stat);
      }
    }
  });

  it('has a still for every room except the one the filter refused', () => {
    const missing = Object.keys(INTERIORS).filter((id) => !(id in BACKDROPS));
    expect([...missing].sort()).toEqual(['akai', 'panels', 'slurp']);
    expect(BACKDROPS.street).toMatch(/^https:\/\//);
  });
});

describe('who is in the room', () => {
  it('always has the staff in, and the visitors some of the time', () => {
    let visitorSeen = 0;
    let visitorMissed = 0;
    for (let day = 0; day < 7; day += 1) {
      for (let slot = 0; slot < 3; slot += 1) {
        for (const def of Object.values(INTERIORS)) {
          const people = roomStrangers(at(day, slot), def.venue);
          const staffStations = def.stations.filter(
            (s) => s.stranger && getStranger(s.stranger)?.role === 'staff',
          );
          const staffIn = people.filter((p) => p.stranger.role === 'staff');
          expect(staffIn.length, `${def.venue} day ${day} slot ${slot}`).toBe(staffStations.length);
          const visitorStations = def.stations.filter(
            (s) => s.stranger && getStranger(s.stranger)?.role === 'visitor',
          ).length;
          const visitorsIn = people.filter((p) => p.stranger.role === 'visitor').length;
          visitorSeen += visitorsIn;
          visitorMissed += visitorStations - visitorsIn;
        }
      }
    }
    expect(visitorSeen).toBeGreaterThan(0);
    expect(visitorMissed).toBeGreaterThan(0);
  });

  it('is the same crowd if you walk out and back in', () => {
    const first = roomStrangers(at(2, 1), 'nightjar').map((p) => p.stranger.id);
    const second = roomStrangers(at(2, 1), 'nightjar').map((p) => p.stranger.id);
    expect(first).toEqual(second);
  });

  it('never puts a lead on a stool that belongs to the staff', () => {
    // Friday evening: Nadia and Sable are both at the bar, and so is Jonah.
    const leads = roomPeople(at(4, 2), 'neon_last_call');
    const bar = INTERIORS.neon_last_call;
    const staffSpots = bar.stations.filter((s) => s.stranger).map((s) => `${s.x},${s.y}`);
    for (const person of leads) {
      expect(staffSpots).not.toContain(`${person.x},${person.y}`);
    }
  });

  it('stands everyone on open floor', () => {
    for (const def of Object.values(INTERIORS)) {
      for (const person of roomStrangers(at(4, 2), def.venue)) {
        expect(interiorWalkable(def, person.x, person.y), `${def.venue}: ${person.stranger.id}`).toBe(true);
      }
    }
  });

  it('only reaches someone you are standing next to', () => {
    const people = roomStrangers(at(0, 0), 'fresh_market');
    const dee = people.find((p) => p.stranger.id === 'checkout')!;
    expect(roomStrangerNear(people, { x: dee.x, y: dee.y + 1 })?.stranger.id).toBe('checkout');
    expect(roomStrangerNear(people, { x: dee.x - 9, y: dee.y + 6 })).toBeNull();
  });
});

describe('the cast', () => {
  it('has unique ids, a look, and lines for scripted mode', () => {
    const ids = new Set(STRANGERS.map((s) => s.id));
    expect(ids.size).toBe(STRANGERS.length);
    for (const person of STRANGERS) {
      expect(person.opens.length).toBeGreaterThan(0);
      expect(person.replies.length).toBeGreaterThan(0);
      expect(person.exits.length).toBeGreaterThan(0);
      expect(['man', 'woman']).toContain(person.look.gender);
    }
  });

  it('is more than a handful of people', () => {
    expect(STRANGERS.length).toBeGreaterThanOrEqual(24);
    expect(STRANGERS.filter((s) => s.role === 'staff').length).toBeGreaterThanOrEqual(11);
  });
});

describe('things you can do for her', () => {
  it('offers a drink at a bar and dinner at the restaurant, and nothing on the street', () => {
    expect(gesturesFor('neon_last_call').map((g) => g.id)).toContain('buy_drink');
    expect(gesturesFor('nightjar').map((g) => g.id)).toContain('buy_cocktail');
    expect(gesturesFor('akai').map((g) => g.id)).toContain('buy_dinner');
    expect(gesturesFor('slurp').map((g) => g.id)).toContain('buy_noodles');
    expect(gesturesFor('pixel_palace').map((g) => g.id)).toContain('arcade_round');
    expect(gesturesFor(null)).toEqual([]);
  });

  it('only lists gestures that exist, in places that exist', () => {
    for (const [place, ids] of Object.entries(GESTURES_BY_PLACE)) {
      expect(INTERIORS[place as keyof typeof INTERIORS], place).toBeDefined();
      for (const id of ids ?? []) expect(GESTURES[id], id).toBeDefined();
    }
  });

  it('moves the meters and writes both sides into the conversation, in scripted mode', () => {
    const before = {
      characterId: 'sable',
      venueId: 'neon_last_call',
      mode: 'encounter' as const,
      providerId: 'scripted',
      cursor: { value: 'x', turn: 1 },
      interest: 40,
      comfort: 50,
      mood: 'okay' as const,
      moodValue: 0,
      expression: 'neutral' as const,
      line: 'Hm.',
      cue: null,
      options: [],
      beats: [{ speaker: 'her' as const, text: 'Hm.' }],
      learned: [],
      told: [],
      topics: [],
      outcome: null,
      notes: [],
      dealbroken: false,
      lastInterestDelta: 0,
      lastComfortDelta: 0,
      openingBonus: 0,
      busy: true,
    };
    const after = applyScriptedGesture(before, GESTURES.buy_drink!);
    expect(after.interest).toBe(45);
    expect(after.comfort).toBe(52);
    expect(after.busy).toBe(false);
    expect(after.beats.at(-2)?.speaker).toBe('you');
    expect(after.beats.at(-1)?.text).toBe(GESTURES.buy_drink!.reaction);
    expect(after.line).toBe(GESTURES.buy_drink!.reaction);
  });
});
