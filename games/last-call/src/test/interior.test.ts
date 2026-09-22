import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import { INTERIORS } from '@/content/interiors';
import {
  atExit,
  interiorFor,
  interiorStep,
  interiorWalkable,
  roomPeople,
  roomPersonNear,
} from '@/engine/interior';
import { newTestGame } from '@/test/helpers';

function at(dayIndex: number, slotIndex: number): GameState {
  const game = newTestGame();
  return { ...game, clock: { week: 1, dayIndex, slotIndex } };
}

describe('every room', () => {
  for (const def of Object.values(INTERIORS)) {
    describe(def.venue, () => {
      it('spawns the player somewhere they can stand', () => {
        expect(interiorWalkable(def, def.spawn.x, def.spawn.y)).toBe(true);
      });

      it('keeps the way out reachable', () => {
        expect(interiorWalkable(def, def.exit.x, def.exit.y)).toBe(true);
        expect(atExit(def, def.exit)).toBe(true);
      });

      it('puts every station on open floor, not inside the furniture', () => {
        for (const station of def.stations) {
          expect(
            interiorWalkable(def, station.x, station.y),
            `${def.venue} station at ${station.x},${station.y}`,
          ).toBe(true);
        }
      });

      it('has walls: you cannot walk out through the edges', () => {
        expect(interiorWalkable(def, -0.5, def.spawn.y)).toBe(false);
        expect(interiorWalkable(def, def.width + 1, def.spawn.y)).toBe(false);
        expect(interiorWalkable(def, def.spawn.x, -0.5)).toBe(false);
        expect(interiorWalkable(def, def.spawn.x, def.height + 1)).toBe(false);
      });
    });
  }
});

describe('moving around a room', () => {
  const gym = interiorFor('ironhaus');

  it('slides along furniture instead of sticking to it', () => {
    // A bench blocks the way down but not the way across, so a diagonal push
    // into it should still carry the player sideways.
    const bench = gym.props.find((prop) => prop.kind === 'bench')!;
    // Close enough that the downward part of the step would land inside it.
    const above = { x: bench.x + bench.w / 2, y: bench.y - 0.1 };
    const moved = interiorStep(gym, above, 0.3, 0.3);
    expect(moved.x).toBeGreaterThan(above.x);
    expect(moved.y).toBeCloseTo(above.y, 5);
  });

  it('refuses to walk through a wall', () => {
    const atEdge = { x: 1.05, y: gym.spawn.y };
    expect(interiorStep(gym, atEdge, -1, 0)).toEqual(atEdge);
  });
});

describe('who is in the room', () => {
  it('puts a regular at her own station', () => {
    // Nadia keeps Monday mornings at Ironhaus.
    const people = roomPeople(at(0, 0), 'ironhaus');
    const nadia = people.find((person) => person.characterId === 'nadia');
    expect(nadia).toBeDefined();

    const hers = interiorFor('ironhaus').stations.find((s) => s.character === 'nadia')!;
    expect(nadia!.x).toBe(hers.x);
    expect(nadia!.y).toBe(hers.y);
  });

  it('never stands two people on the same spot', () => {
    for (let day = 0; day < 7; day += 1) {
      for (let slot = 0; slot < 3; slot += 1) {
        for (const venue of ['neon_last_call', 'margin_notes', 'ironhaus'] as const) {
          const people = roomPeople(at(day, slot), venue);
          const spots = people.map((person) => `${person.x},${person.y}`);
          expect(new Set(spots).size, `${venue} day ${day} slot ${slot}`).toBe(spots.length);
        }
      }
    }
  });

  it('only reaches someone you are standing next to', () => {
    const people = roomPeople(at(0, 0), 'ironhaus');
    const nadia = people.find((person) => person.characterId === 'nadia')!;
    expect(roomPersonNear(people, { x: nadia.x, y: nadia.y + 1 })?.characterId).toBe('nadia');
    expect(roomPersonNear(people, { x: nadia.x + 8, y: nadia.y + 8 })).toBeNull();
  });

  it('leaves the room empty when nobody keeps that slot', () => {
    // The bar is shut on a Monday morning, so nobody is behind the counter.
    expect(roomPeople(at(0, 0), 'neon_last_call')).toHaveLength(0);
  });
});
