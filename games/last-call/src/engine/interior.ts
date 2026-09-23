/**
 * Being inside a building.
 *
 * The same rules the street uses, applied to a room: what you can walk on,
 * who is in here and where they are standing, and where the way out is. Pure
 * functions over `InteriorDef`, so a room can be walked end to end in a test
 * without a canvas.
 */
import type { CharacterId, VenueId } from '@/content/ids';
import type { GameState } from '@/types/game';
import type { InteriorId } from '@/content/city';
import type { InteriorDef, InteriorProp } from '@/content/interiors';
import type { Position } from '@/engine/city';
import type { Facing } from '@/ui/art/sprite';
import { INTERIORS } from '@/content/interiors';
import { VENUE_IDS } from '@/content/ids';
import { VENUES } from '@/content/venues';
import { crowdAt } from '@/engine/characters';

export function interiorFor(id: InteriorId): InteriorDef {
  return INTERIORS[id];
}

/** Venues have regulars and cost a slot; places are free to wander round. */
export function isVenue(id: InteriorId): id is VenueId {
  return (VENUE_IDS as readonly string[]).includes(id);
}

function within(rect: { x: number; y: number; w: number; h: number }, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

/** Props you bump into. Rugs, neon and windows are scenery, not obstacles. */
export function solidProps(def: InteriorDef): readonly InteriorProp[] {
  return def.props.filter((prop) => !prop.passable);
}

/** Floor you can stand on, minus the furniture standing on it. */
export function interiorWalkable(def: InteriorDef, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= def.width || y >= def.height) return false;
  if (!def.floors.some((floor) => within(floor, x, y))) return false;
  return !solidProps(def).some((prop) => within(prop, x, y));
}

/** Move as far as the room allows, sliding along furniture rather than sticking. */
export function interiorStep(def: InteriorDef, from: Position, dx: number, dy: number): Position {
  let { x, y } = from;
  if (interiorWalkable(def, x + dx, y)) x += dx;
  if (interiorWalkable(def, x, y + dy)) y += dy;
  return { x, y };
}

export interface RoomPerson {
  characterId: CharacterId;
  x: number;
  y: number;
  facing: Facing;
  venueId: VenueId;
}

/**
 * Who is in the room, standing where they belong.
 *
 * A character takes the station reserved for her if there is one, otherwise the
 * first unreserved spot, so two people never end up on the same stool and the
 * bartender is always behind the bar.
 */
export function roomPeople(state: GameState, id: InteriorId): readonly RoomPerson[] {
  // A café or a record shop has no regulars in the story's sense — the leads
  // keep their schedules at the venues — so it is scenery, not a crowd.
  if (!isVenue(id)) return [];
  const venueId = id;
  const def = interiorFor(venueId);
  const present = crowdAt(VENUES[venueId], state.clock, state.characters).map(
    (member) => member.character.id,
  );

  const taken = new Set<number>();
  const placed: RoomPerson[] = [];

  for (const characterId of present) {
    let index = def.stations.findIndex(
      (station, at) => station.character === characterId && !taken.has(at),
    );
    if (index < 0) {
      index = def.stations.findIndex((station, at) => !station.character && !taken.has(at));
    }
    if (index < 0) continue;
    taken.add(index);
    const station = def.stations[index]!;
    placed.push({ characterId, x: station.x, y: station.y, facing: station.facing, venueId });
  }

  return placed;
}

/** True when the player is standing on the way out. */
export function atExit(def: InteriorDef, position: Position, range = 1.2): boolean {
  return Math.hypot(def.exit.x - position.x, def.exit.y - position.y) <= range;
}

/** The nearest person in the room you could speak to. */
export function roomPersonNear(
  people: readonly RoomPerson[],
  position: Position,
  range = 2.4,
): RoomPerson | null {
  let best: RoomPerson | null = null;
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

/** A named fixture you are standing at — the dartboard, the good armchair. */
export function propNear(
  def: InteriorDef,
  position: Position,
  range = 1.6,
): InteriorProp | null {
  let best: InteriorProp | null = null;
  let bestDistance = range;
  for (const prop of def.props) {
    if (!prop.label) continue;
    const cx = prop.x + prop.w / 2;
    const cy = prop.y + prop.h / 2;
    const distance = Math.hypot(cx - position.x, cy - position.y);
    if (distance <= bestDistance) {
      best = prop;
      bestDistance = distance;
    }
  }
  return best;
}
