import type { VenueId } from '@/content/ids';

/**
 * The city block, as data.
 *
 * One screen you can walk around, in tiles. Everything the map knows — where
 * the buildings are, which doors go where, what the flavour spots say — lives
 * here, so the renderer and the movement code never carry content.
 *
 * Coordinates are tiles; the renderer scales them. The block is wider than it
 * is tall so it reads as a street on a phone held upright.
 */
export const CITY_WIDTH = 44;
export const CITY_HEIGHT = 30;
export const TILE = 16;

export type SurfaceKind = 'road' | 'pavement' | 'plaza' | 'water' | 'park';

export interface CityRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CityBuilding extends CityRect {
  id: string;
  name: string;
  /** Façade colour; the renderer shades the roof and windows from it. */
  colour: string;
  /** Lit windows at night. */
  windows: boolean;
}

export interface CityDoor {
  id: string;
  /** Tile the player stands on to use it. */
  x: number;
  y: number;
  label: string;
  /** Doors that open a venue; the rest are flavour. */
  venue?: VenueId;
  /** Shown when the door leads nowhere. */
  line?: string;
}

export interface CitySpot extends CityRect {
  id: string;
  kind: SurfaceKind;
}

/** Everything the player can walk on. Anything not covered is a wall. */
export const CITY_SURFACES: readonly CitySpot[] = [
  { id: 'main_street', kind: 'road', x: 0, y: 13, w: 44, h: 5 },
  { id: 'north_walk', kind: 'pavement', x: 0, y: 11, w: 44, h: 2 },
  { id: 'south_walk', kind: 'pavement', x: 0, y: 18, w: 44, h: 2 },
  { id: 'west_alley', kind: 'pavement', x: 7, y: 4, w: 2, h: 7 },
  { id: 'east_alley', kind: 'pavement', x: 33, y: 20, w: 2, h: 7 },
  { id: 'north_plaza', kind: 'plaza', x: 9, y: 6, w: 9, h: 5 },
  { id: 'park', kind: 'park', x: 24, y: 4, w: 11, h: 7 },
  { id: 'park_path', kind: 'pavement', x: 27, y: 11, w: 3, h: 2 },
  { id: 'south_plaza', kind: 'plaza', x: 12, y: 20, w: 8, h: 5 },
  { id: 'canal_walk', kind: 'pavement', x: 0, y: 25, w: 44, h: 2 },
  { id: 'canal', kind: 'water', x: 0, y: 27, w: 44, h: 3 },
];

export const CITY_BUILDINGS: readonly CityBuilding[] = [
  {
    id: 'last_call',
    name: 'Last Call',
    x: 4,
    y: 20,
    w: 8,
    h: 5,
    colour: '#3a1b2e',
    windows: true,
  },
  {
    id: 'margin_notes',
    name: 'Margin Notes',
    x: 9,
    y: 2,
    w: 9,
    h: 4,
    colour: '#2b2a3f',
    windows: true,
  },
  {
    id: 'ironhaus',
    name: 'Ironhaus',
    x: 20,
    y: 20,
    w: 9,
    h: 5,
    colour: '#1e2a3a',
    windows: false,
  },
  {
    id: 'home',
    name: 'Your building',
    x: 36,
    y: 6,
    w: 7,
    h: 5,
    colour: '#241f36',
    windows: true,
  },
  { id: 'block_a', name: 'Offices', x: 19, y: 2, w: 4, h: 9, colour: '#1b1a2e', windows: true },
  { id: 'block_b', name: 'Laundrette', x: 0, y: 4, w: 7, h: 7, colour: '#221e3f', windows: true },
  { id: 'block_c', name: 'Corner shop', x: 30, y: 20, w: 3, h: 5, colour: '#2a2338', windows: true },
  { id: 'block_d', name: 'Carpark', x: 35, y: 20, w: 9, h: 5, colour: '#191728', windows: false },
];

export const CITY_DOORS: readonly CityDoor[] = [
  { id: 'door_bar', x: 8, y: 19, label: 'Last Call', venue: 'neon_last_call' },
  { id: 'door_books', x: 13, y: 6, label: 'Margin Notes', venue: 'margin_notes' },
  { id: 'door_gym', x: 24, y: 19, label: 'Ironhaus', venue: 'ironhaus' },
  {
    id: 'door_home',
    x: 39,
    y: 11,
    label: 'Home',
    line: 'Your flat. The radiator is making the noise again.',
  },
  {
    id: 'bench',
    x: 29,
    y: 8,
    label: 'The bench',
    line: 'A good bench. You have watched the light go orange from here before.',
  },
  {
    id: 'bridge',
    x: 21,
    y: 25,
    label: 'The canal bridge',
    line: 'Cold iron rail, black water, a shopping trolley making a statement.',
  },
  {
    id: 'shop',
    x: 31,
    y: 19,
    label: 'Corner shop',
    line: 'Open at all the hours that matter. The man behind the counter has opinions on the darts.',
  },
];

/** Where the player appears when the map opens. */
export const CITY_SPAWN = { x: 22, y: 16 };

/** Ambient wanderers, so the street is never empty. */
export interface CityWalker {
  id: string;
  /** Tiles the walker paces between. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  colour: string;
  speed: number;
}

export const CITY_WALKERS: readonly CityWalker[] = [
  { id: 'w1', from: { x: 2, y: 12 }, to: { x: 40, y: 12 }, colour: '#6f6a92', speed: 1.5 },
  { id: 'w2', from: { x: 41, y: 19 }, to: { x: 6, y: 19 }, colour: '#8a6f92', speed: 1.1 },
  { id: 'w3', from: { x: 13, y: 24 }, to: { x: 13, y: 21 }, colour: '#5f7a92', speed: 0.8 },
  { id: 'w4', from: { x: 28, y: 10 }, to: { x: 33, y: 5 }, colour: '#7a8a6f', speed: 0.9 },
  { id: 'w5', from: { x: 3, y: 26 }, to: { x: 38, y: 26 }, colour: '#92806f', speed: 1.3 },
];
