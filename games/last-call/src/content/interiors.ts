/**
 * The inside of every venue, as data.
 *
 * Walking through a door puts you in a room you can walk around, not on a menu
 * screen: the bar has a counter you stand at and a dartboard in the corner, the
 * bookshop has shelves and one good armchair, the gym has racks. Everything the
 * renderer and the collision code need is here, in the same tile coordinates
 * the street uses, so one world renderer draws both.
 *
 * `stations` are where the regulars stand. A character is placed at the station
 * matching her id, or the first free one, so a room never has two people
 * occupying the same stool.
 */
import type { CharacterId, VenueId } from '@/content/ids';
import type { CityRect } from '@/content/city';

export type FloorKind = 'wood' | 'tile' | 'rubber' | 'rug' | 'stage';

export type PropKind =
  | 'counter'
  | 'stool'
  | 'table'
  | 'shelf'
  | 'armchair'
  | 'rack'
  | 'bench'
  | 'plant'
  | 'dartboard'
  | 'neon'
  | 'lamp'
  | 'window'
  | 'mirror';

export interface InteriorFloor extends CityRect {
  kind: FloorKind;
}

export interface InteriorProp extends CityRect {
  kind: PropKind;
  /** Props you can walk through — rugs, neon on a wall, a window. */
  passable?: boolean;
  /** Tint override; otherwise the prop uses the room's palette. */
  colour?: string;
  label?: string;
}

export interface InteriorStation {
  /** The regular who stands here, when she is in. */
  character?: CharacterId;
  x: number;
  y: number;
  /** Which way she faces while she waits. */
  facing: 'down' | 'up' | 'left' | 'right';
}

export interface InteriorDef {
  venue: VenueId;
  width: number;
  height: number;
  /** Where you appear when you walk in, just inside the door. */
  spawn: { x: number; y: number };
  /** The tile that takes you back out to the street. */
  exit: { x: number; y: number };
  floors: readonly InteriorFloor[];
  props: readonly InteriorProp[];
  stations: readonly InteriorStation[];
  /** Wall and accent colours; the renderer shades everything from these. */
  palette: { wall: string; trim: string; glow: string };
}

const BAR: InteriorDef = {
  venue: 'neon_last_call',
  width: 22,
  height: 15,
  spawn: { x: 11, y: 12.4 },
  exit: { x: 11, y: 13.4 },
  palette: { wall: '#241826', trim: '#3d2434', glow: '#ff5fa8' },
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 20, h: 12 },
    { kind: 'stage', x: 15, y: 2, w: 6, h: 4 },
  ],
  props: [
    { kind: 'counter', x: 2, y: 4, w: 9, h: 2, label: 'the bar' },
    { kind: 'stool', x: 2, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 4, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 6, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 8, y: 6.6, w: 1, h: 1 },
    { kind: 'mirror', x: 2, y: 2.4, w: 9, h: 1, passable: true },
    { kind: 'neon', x: 13, y: 2.3, w: 4, h: 1, passable: true, label: 'LAST CALL' },
    { kind: 'dartboard', x: 19.5, y: 7, w: 1.4, h: 1.4, passable: true, label: 'darts' },
    { kind: 'table', x: 4, y: 10, w: 2, h: 2 },
    { kind: 'table', x: 8, y: 10, w: 2, h: 2 },
    { kind: 'table', x: 15, y: 10, w: 2, h: 2 },
    { kind: 'lamp', x: 13, y: 7, w: 1, h: 1, passable: true },
    { kind: 'plant', x: 19, y: 11.5, w: 1, h: 1 },
  ],
  stations: [
    { character: 'sable', x: 6.5, y: 3.2, facing: 'down' },
    { character: 'nadia', x: 16.5, y: 8.4, facing: 'left' },
    { x: 3.2, y: 7.8, facing: 'up' },
    { x: 17.5, y: 4.4, facing: 'down' },
  ],
};

const BOOKSHOP: InteriorDef = {
  venue: 'margin_notes',
  width: 20,
  height: 14,
  spawn: { x: 10, y: 11.4 },
  exit: { x: 10, y: 12.4 },
  palette: { wall: '#1d2233', trim: '#2f3a52', glow: '#ffce6b' },
  floors: [
    { kind: 'tile', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'rug', x: 12, y: 7, w: 5, h: 4 },
  ],
  props: [
    { kind: 'shelf', x: 2, y: 2.4, w: 3, h: 1.4, label: 'poetry, shelved wrong' },
    { kind: 'shelf', x: 6, y: 2.4, w: 3, h: 1.4 },
    { kind: 'shelf', x: 10, y: 2.4, w: 3, h: 1.4 },
    { kind: 'shelf', x: 2, y: 6, w: 1.4, h: 4 },
    { kind: 'shelf', x: 6, y: 6, w: 1.4, h: 4 },
    { kind: 'counter', x: 14, y: 2.4, w: 4, h: 1.6, label: 'the coffee counter' },
    { kind: 'armchair', x: 13.5, y: 8.4, w: 1.6, h: 1.6, label: 'the good armchair' },
    { kind: 'armchair', x: 15.6, y: 8.4, w: 1.6, h: 1.6 },
    { kind: 'table', x: 14.4, y: 6.4, w: 1.6, h: 1.4 },
    { kind: 'window', x: 1, y: 11.4, w: 4, h: 1, passable: true },
    { kind: 'plant', x: 17.6, y: 11, w: 1, h: 1 },
    { kind: 'lamp', x: 11, y: 5, w: 1, h: 1, passable: true },
  ],
  stations: [
    { character: 'wren', x: 13.4, y: 6.6, facing: 'down' },
    { x: 16, y: 4.6, facing: 'down' },
    { x: 4, y: 5, facing: 'up' },
  ],
};

const GYM: InteriorDef = {
  venue: 'ironhaus',
  width: 20,
  height: 14,
  spawn: { x: 10, y: 11.4 },
  exit: { x: 10, y: 12.4 },
  palette: { wall: '#16202a', trim: '#22323f', glow: '#4fd6ff' },
  floors: [
    { kind: 'rubber', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'stage', x: 2, y: 3, w: 5, h: 4 },
  ],
  props: [
    { kind: 'rack', x: 2.4, y: 2.4, w: 2, h: 1.4, label: 'the squat rack' },
    { kind: 'rack', x: 5.4, y: 2.4, w: 2, h: 1.4 },
    { kind: 'rack', x: 8.4, y: 2.4, w: 2, h: 1.4 },
    { kind: 'bench', x: 3, y: 8, w: 2.4, h: 1.2 },
    { kind: 'bench', x: 7, y: 8, w: 2.4, h: 1.2 },
    { kind: 'bench', x: 11, y: 8, w: 2.4, h: 1.2 },
    { kind: 'mirror', x: 14, y: 2.4, w: 5, h: 1, passable: true },
    { kind: 'rack', x: 15.4, y: 6, w: 1.6, h: 3 },
    { kind: 'neon', x: 8, y: 2.2, w: 4, h: 0.8, passable: true, label: 'IRONHAUS' },
    { kind: 'plant', x: 17.8, y: 11, w: 1, h: 1 },
  ],
  stations: [
    { character: 'nadia', x: 9.4, y: 6.4, facing: 'down' },
    { character: 'wren', x: 5, y: 10, facing: 'up' },
    { x: 13, y: 4.4, facing: 'down' },
  ],
};

export const INTERIORS: Readonly<Record<VenueId, InteriorDef>> = {
  neon_last_call: BAR,
  margin_notes: BOOKSHOP,
  ironhaus: GYM,
};
