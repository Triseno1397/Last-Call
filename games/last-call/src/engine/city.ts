import type { CityDoor } from '@/content/city';
import type { CharacterId, VenueId } from '@/content/ids';
import type { GameState } from '@/types/game';
import {
  CITY_DOORS,
  CITY_HEIGHT,
  CITY_SURFACES,
  CITY_WIDTH,
} from '@/content/city';
import { VENUES } from '@/content/venues';
import { getActivity } from '@/content/activities';
import { checkAvailability } from '@/engine/activities';
import { crowdAt } from '@/engine/characters';
import { currentSlot } from '@/engine/calendar';

/**
 * Walking around the block. Pure geometry and rules: the renderer draws what
 * these functions say, and the tests can walk the player into a wall without a
 * browser.
 */

/** A tile is walkable when a surface covers it and no water is in the way. */
export function isWalkable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= CITY_WIDTH || y >= CITY_HEIGHT) return false;
  let walkable = false;
  for (const surface of CITY_SURFACES) {
    const inside =
      x >= surface.x && x < surface.x + surface.w && y >= surface.y && y < surface.y + surface.h;
    if (!inside) continue;
    if (surface.kind === 'water') return false;
    walkable = true;
  }
  return walkable;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Move, sliding along walls rather than stopping dead on them: a diagonal into
 * a corner still travels the axis that is clear, which is what makes a thumb
 * stick feel right.
 */
export function step(from: Position, dx: number, dy: number): Position {
  let { x, y } = from;
  if (dx !== 0 && isWalkable(Math.round(x + dx), Math.round(y))) x += dx;
  if (dy !== 0 && isWalkable(Math.round(x), Math.round(y + dy))) y += dy;
  return { x, y };
}

export const INTERACT_RANGE = 1.9;

/** The door the player is standing close enough to use, if any. */
export function doorNear(position: Position, range = INTERACT_RANGE): CityDoor | null {
  let best: CityDoor | null = null;
  let bestDistance = range;
  for (const door of CITY_DOORS) {
    const distance = Math.hypot(door.x - position.x, door.y - position.y);
    if (distance <= bestDistance) {
      best = door;
      bestDistance = distance;
    }
  }
  return best;
}

export interface DoorState {
  door: CityDoor;
  /** Can the player go in right now? */
  open: boolean;
  /** Why not, when they cannot. */
  reason: string | null;
  /** Who is inside, for the sign outside. */
  inside: readonly CharacterId[];
}

/**
 * What a door says when you walk up to it. A venue door answers with the same
 * rules the day screen uses, so the map can never let a player in somewhere the
 * game would refuse.
 */
export function doorState(state: GameState, door: CityDoor): DoorState {
  if (!door.venue) {
    return { door, open: false, reason: door.line ?? null, inside: [] };
  }

  const venue = VENUES[door.venue];
  const availability = checkAvailability(state, getActivity(`go_out_${door.venue}` as never));
  const open =
    venue.openDays.includes(
      (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const)[state.clock.dayIndex % 7] ?? 'mon',
    ) && venue.openSlots.includes(currentSlot(state.clock));

  const inside = open ? crowdAt(venue, state.clock, state.characters).map((member) => member.character.id) : [];

  return {
    door,
    open: availability.ok,
    reason: availability.ok ? null : (availability.reasons[0] ?? 'Closed'),
    inside,
  };
}

/** Every venue door with its current state, for the map legend. */
export function venueDoors(state: GameState): readonly DoorState[] {
  return CITY_DOORS.filter((door) => door.venue !== undefined).map((door) => doorState(state, door));
}

export function venueOfDoor(door: CityDoor): VenueId | null {
  return door.venue ?? null;
}

/** Daylight, as a 0-1 mix for the renderer's night tint. */
export function lightLevel(state: GameState): number {
  switch (currentSlot(state.clock)) {
    case 'morning':
      return 0.85;
    case 'afternoon':
      return 1;
    default:
      return 0.32;
  }
}

/**
 * Someone standing out on the pavement you can walk up to and talk to.
 *
 * Where they stand is a rule, not a drawing detail: the renderer and the
 * "who am I next to" check both read it from here, so the person you can see
 * and the person you can talk to are never in different places.
 */
export interface StreetPerson {
  characterId: CharacterId;
  /** The venue she is outside. Her conversation uses its stat weights. */
  venueId: VenueId;
  x: number;
  y: number;
}

/** Everyone out on the block right now, in the order they are drawn. */
export function peopleOnStreet(state: GameState): readonly StreetPerson[] {
  const people: StreetPerson[] = [];
  for (const door of CITY_DOORS) {
    if (!door.venue) continue;
    const here = doorState(state, door);
    here.inside.forEach((characterId, index) => {
      people.push({
        characterId,
        venueId: door.venue as VenueId,
        x: door.x + (index - (here.inside.length - 1) / 2) * 1.2,
        y: door.y - 1.1,
      });
    });
  }
  return people;
}

/** The nearest person within arm's reach of `position`, if any. */
export function personNear(
  people: readonly StreetPerson[],
  position: Position,
  range = INTERACT_RANGE + 0.6,
): StreetPerson | null {
  let best: StreetPerson | null = null;
  let bestDistance = range;
  for (const person of people) {
    const distance = Math.hypot(person.x - position.x, person.y - position.y);
    if (distance <= bestDistance) {
      best = person;
      bestDistance = distance;
    }
  }
  return best;
}
