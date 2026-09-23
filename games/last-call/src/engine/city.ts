import type { CityDoor } from '@/content/city';
import type { CharacterId, VenueId } from '@/content/ids';
import type { GameState } from '@/types/game';
import type { CityProp } from '@/content/city';
import {
  CITY_DOORS,
  CITY_HEIGHT,
  CITY_PROPS,
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

/** How much room each kind of street furniture takes up, in tiles. */
const PROP_FOOTPRINT: Readonly<Record<string, { w: number; h: number }>> = {
  lamp: { w: 0.5, h: 0.5 },
  bench: { w: 2, h: 0.8 },
  bin: { w: 0.7, h: 0.7 },
  tree: { w: 1.2, h: 1.2 },
  fountain: { w: 3, h: 3 },
  busstop: { w: 2.4, h: 0.8 },
  phonebox: { w: 1, h: 1 },
  vending: { w: 1.2, h: 0.9 },
  bikerack: { w: 2.4, h: 0.8 },
  kiosk: { w: 2.4, h: 2 },
  statue: { w: 1.6, h: 1.6 },
  planter: { w: 1.4, h: 1 },
  hydrant: { w: 0.5, h: 0.5 },
  sign: { w: 0.6, h: 0.6 },
  bollard: { w: 0.4, h: 0.4 },
};

/** The rectangle a prop occupies, centred on its position. */
export function propRect(prop: CityProp): { x: number; y: number; w: number; h: number } {
  const size = PROP_FOOTPRINT[prop.kind] ?? { w: 1, h: 1 };
  return { x: prop.x - size.w / 2, y: prop.y - size.h / 2, w: size.w, h: size.h };
}

const SOLID_PROPS: readonly CityProp[] = CITY_PROPS.filter((prop) => !prop.passable);

/**
 * A tile is walkable when a surface covers it, no water is in the way, and no
 * street furniture is standing on it.
 */
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
  if (!walkable) return false;
  for (const prop of SOLID_PROPS) {
    const rect = propRect(prop);
    if (x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h) return false;
  }
  return true;
}

/** The nearest piece of street furniture with something to say. */
export function streetPropNear(position: Position, range = INTERACT_RANGE): CityProp | null {
  let best: CityProp | null = null;
  let bestDistance = range;
  for (const prop of CITY_PROPS) {
    if (!prop.line) continue;
    const distance = Math.hypot(prop.x - position.x, prop.y - position.y);
    if (distance <= bestDistance) {
      best = prop;
      bestDistance = distance;
    }
  }
  return best;
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
  // Checked at the actual position, not rounded to a tile centre: rounding
  // pushed anyone standing on the far half of a pavement's last row into the
  // wall beyond it, and they could not move sideways until they stepped back.
  let { x, y } = from;
  if (dx !== 0 && isWalkable(x + dx, y)) x += dx;
  if (dy !== 0 && isWalkable(x, y + dy)) y += dy;
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
      // Beside the door rather than on it. Standing on the threshold meant the
      // person always won the proximity check and the door became unusable.
      people.push({
        characterId,
        venueId: door.venue as VenueId,
        x: door.x + 2.1 + index * 1.3,
        y: door.y - 0.7,
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
