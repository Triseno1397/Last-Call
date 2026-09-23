import type { VenueId } from '@/content/ids';

/**
 * The city, as data.
 *
 * Everything the map knows — surfaces, buildings, doors, street furniture,
 * the routes people pace — lives here, so the renderer and the movement code
 * never carry content. Coordinates are tiles; the renderer scales them.
 *
 * The block is two streets crossing: a main street east to west, an avenue
 * north to south, a square where they meet the park, and a canal along the
 * bottom with the avenue bridging it. Three venues, eight places you can walk
 * into — a café, a record shop, a cocktail bar, a trattoria, an arcade, a
 * comic shop, a gallery and a supermarket — and a lot of doors, benches and
 * corners that just have something to say, because a street with nothing to
 * look at is a corridor.
 */
export const CITY_WIDTH = 72;
export const CITY_HEIGHT = 48;
export const TILE = 16;

export type SurfaceKind = 'road' | 'pavement' | 'plaza' | 'water' | 'park' | 'crossing';

export interface CityRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type BuildingStyle = 'shop' | 'block' | 'house' | 'industrial' | 'civic';

export interface CityBuilding extends CityRect {
  id: string;
  name: string;
  /** Façade colour; the renderer shades roof, trim and windows from it. */
  colour: string;
  /** Lit windows at night. */
  windows: boolean;
  /** How the façade is drawn: a shopfront with a sign, a tall block, a house. */
  style: BuildingStyle;
  /** Painted above the door on shops. Defaults to the name. */
  sign?: string;
  /** Awning colour on a shopfront; none for other styles. */
  awning?: string;
  /** Storeys, for window rows. */
  floors?: number;
  /** Stacked neon sign boxes up the façade, the way a night street is signed. */
  signs?: readonly { text: string; colour: string }[];
  /** An LED strip traced along the roofline and the front edge. */
  led?: string;
  /** A holographic advertising panel on a tall block. */
  billboard?: string;
}

/** Interiors you can walk into that are not venues: no slot cost, no crowd. */
export type PlaceId =
  | 'copper_kettle'
  | 'static_records'
  | 'nightjar'
  | 'akai'
  | 'slurp'
  | 'pixel_palace'
  | 'panels'
  | 'meridian_gallery'
  | 'fresh_market';
export type InteriorId = VenueId | PlaceId;

export interface CityDoor {
  id: string;
  /** Tile the player stands on to use it. */
  x: number;
  y: number;
  label: string;
  /** Doors that open a venue. */
  venue?: VenueId;
  /** Doors that open a place you can wander round for free. */
  place?: PlaceId;
  /** Shown when the door leads nowhere. */
  line?: string;
}

export interface CitySpot extends CityRect {
  id: string;
  kind: SurfaceKind;
}

export type PropKind =
  | 'lamp'
  | 'bench'
  | 'bin'
  | 'tree'
  | 'fountain'
  | 'busstop'
  | 'phonebox'
  | 'vending'
  | 'bikerack'
  | 'mural'
  | 'kiosk'
  | 'statue'
  | 'planter'
  | 'hydrant'
  | 'sign'
  | 'bollard'
  | 'manhole'
  | 'ringbar'
  | 'holo'
  | 'puddle';

/**
 * Street furniture. Drawn into the static layer, solid where it makes sense,
 * and anything with a `line` can be looked at.
 */
export interface CityProp {
  id: string;
  kind: PropKind;
  x: number;
  y: number;
  label?: string;
  line?: string;
  /** Props you can walk straight through: manholes, murals on walls. */
  passable?: boolean;
}

/** Everything the player can walk on. Anything not covered is a wall. */
export const CITY_SURFACES: readonly CitySpot[] = [
  // The park, north-west, with a pond and paths through it.
  { id: 'park', kind: 'park', x: 2, y: 2, w: 26, h: 13 },
  { id: 'pond', kind: 'water', x: 8, y: 6, w: 8, h: 4 },
  { id: 'park_path_ew', kind: 'pavement', x: 2, y: 11, w: 26, h: 2 },
  { id: 'park_path_ns', kind: 'pavement', x: 20, y: 2, w: 2, h: 13 },
  { id: 'park_gate', kind: 'pavement', x: 27, y: 2, w: 1, h: 18 },

  // Main street, east to west, with pavements either side and a crossing.
  { id: 'north_walk', kind: 'pavement', x: 0, y: 20, w: 72, h: 2 },
  { id: 'main_street', kind: 'road', x: 0, y: 22, w: 72, h: 5 },
  { id: 'main_crossing', kind: 'crossing', x: 30, y: 22, w: 2, h: 5 },
  { id: 'south_walk', kind: 'pavement', x: 0, y: 27, w: 72, h: 2 },

  // The avenue, north to south, bridging the canal at the bottom.
  { id: 'avenue_west_walk', kind: 'pavement', x: 32, y: 0, w: 2, h: 48 },
  { id: 'avenue', kind: 'road', x: 34, y: 0, w: 5, h: 48 },
  { id: 'avenue_crossing', kind: 'crossing', x: 34, y: 18, w: 5, h: 2 },
  { id: 'avenue_east_walk', kind: 'pavement', x: 39, y: 0, w: 2, h: 48 },

  // The square, east of the avenue, north of the main street.
  { id: 'square', kind: 'plaza', x: 41, y: 9, w: 14, h: 11 },
  { id: 'square_lane', kind: 'pavement', x: 55, y: 9, w: 1, h: 11 },
  { id: 'terrace_walk', kind: 'pavement', x: 56, y: 10, w: 14, h: 2 },

  // Side alleys, so the block loops rather than dead-ends.
  { id: 'west_alley', kind: 'pavement', x: 0, y: 0, w: 2, h: 44 },
  { id: 'east_alley', kind: 'pavement', x: 70, y: 0, w: 2, h: 44 },
  { id: 'back_lane', kind: 'pavement', x: 0, y: 35, w: 72, h: 1 },

  // The canal along the bottom, and the walk beside it.
  { id: 'canal_walk', kind: 'pavement', x: 0, y: 42, w: 72, h: 2 },
  { id: 'canal_west', kind: 'water', x: 0, y: 44, w: 32, h: 4 },
  { id: 'canal_east', kind: 'water', x: 41, y: 44, w: 31, h: 4 },
];

export const CITY_BUILDINGS: readonly CityBuilding[] = [
  // North row, along the top pavement of the main street.
  { id: 'laundrette', name: 'Spin City', x: 2, y: 15, w: 7, h: 5, colour: '#233a4a', windows: true, style: 'shop', awning: '#4fd6ff', floors: 2, signs: [{ text: '24H', colour: '#4fd6ff' }, { text: 'WASH', colour: '#ffce6b' }], led: '#4fd6ff' },
  { id: 'margin_notes', name: 'Margin Notes', x: 10, y: 15, w: 9, h: 5, colour: '#14232b', windows: true, style: 'shop', awning: '#3ee6d6', sign: 'MARGIN NOTES', floors: 2, signs: [{ text: 'BOOKS', colour: '#3ee6d6' }, { text: 'COFFEE', colour: '#ffce6b' }, { text: 'LATE', colour: '#ff5fa8' }], led: '#3ee6d6' },
  { id: 'copper_kettle', name: 'Copper Kettle', x: 22, y: 15, w: 5, h: 5, colour: '#2a2033', windows: true, style: 'shop', awning: '#ffd36b', floors: 2, signs: [{ text: 'TEA', colour: '#ffd36b' }, { text: 'OPEN', colour: '#3fbf85' }], led: '#ffd36b' },
  { id: 'offices', name: 'Meridian House', x: 28, y: 2, w: 4, h: 18, colour: '#1b1a2e', windows: true, style: 'block', floors: 6, billboard: 'MERIDIAN', led: '#4fd6ff' },

  // Around the square.
  { id: 'home', name: 'Your building', x: 43, y: 2, w: 10, h: 6, colour: '#2a2440', windows: true, style: 'house', floors: 3, led: '#9a6bff' },
  { id: 'static', name: 'Static', x: 57, y: 12, w: 6, h: 8, colour: '#1f1f2e', windows: true, style: 'shop', awning: '#9a6bff', sign: 'STATIC — records', floors: 2, signs: [{ text: 'VINYL', colour: '#9a6bff' }, { text: 'STATIC', colour: '#ff5fa8' }, { text: 'BUY SELL', colour: '#4fd6ff' }], led: '#9a6bff' },
  { id: 'panels', name: 'Panels', x: 64, y: 14, w: 6, h: 6, colour: '#1e2a3a', windows: true, style: 'shop', awning: '#ffce6b', sign: 'PANELS comics', floors: 2, signs: [{ text: 'COMICS', colour: '#ffce6b' }, { text: 'MANGA', colour: '#ff5fa8' }], led: '#ffce6b' },
  { id: 'meridian_gallery', name: 'Meridian Gallery', x: 57, y: 2, w: 13, h: 8, colour: '#d8d4e6', windows: true, style: 'civic', sign: 'MERIDIAN GALLERY', floors: 2, led: '#e4d9ff' },

  // South row, along the bottom pavement of the main street.
  { id: 'last_call', name: 'Last Call', x: 3, y: 29, w: 10, h: 6, colour: '#2a1436', windows: true, style: 'shop', awning: '#ff5fa8', sign: 'LAST CALL', floors: 2, signs: [{ text: 'BAR', colour: '#ff5fa8' }, { text: 'KARAOKE', colour: '#9a6bff' }, { text: 'LATE', colour: '#4fd6ff' }], led: '#ff5fa8' },
  { id: 'noodles', name: 'Slurp', x: 14, y: 29, w: 7, h: 6, colour: '#1c2a24', windows: true, style: 'shop', awning: '#ffd36b', sign: 'SLURP', floors: 2, signs: [{ text: 'NOODLES', colour: '#ffd36b' }, { text: '24H', colour: '#e0362e' }, { text: 'DINER', colour: '#3fbf85' }], led: '#ffd36b' },
  { id: 'ironhaus', name: 'Ironhaus', x: 22, y: 29, w: 10, h: 6, colour: '#1e2a3a', windows: false, style: 'industrial', sign: 'IRONHAUS', floors: 1, led: '#4fd6ff' },
  { id: 'fresh_market', name: 'Fresh Market', x: 41, y: 29, w: 5, h: 6, colour: '#1a1030', windows: true, style: 'shop', awning: '#ff7ad9', sign: 'FRESH MARKET', floors: 2, signs: [{ text: 'GROWN HERE', colour: '#ff7ad9' }, { text: 'FRESH', colour: '#3fbf85' }], led: '#ff7ad9' },
  { id: 'cinema', name: 'The Regal', x: 47, y: 29, w: 12, h: 6, colour: '#3a1f3a', windows: false, style: 'civic', sign: 'THE REGAL', floors: 2, led: '#ffce6b' },
  { id: 'carpark', name: 'Carpark', x: 60, y: 29, w: 10, h: 6, colour: '#191728', windows: false, style: 'industrial', floors: 3, billboard: 'DRIVE', led: '#9a6bff' },

  // Along the canal.
  { id: 'nightjar', name: 'Nightjar', x: 4, y: 36, w: 10, h: 6, colour: '#0f1633', windows: true, style: 'shop', awning: '#4fd6ff', sign: 'NIGHTJAR', floors: 2, signs: [{ text: 'COCKTAILS', colour: '#4fd6ff' }, { text: 'NIGHTJAR', colour: '#ff5fa8' }, { text: 'TILL 4', colour: '#9a6bff' }], led: '#4fd6ff' },
  { id: 'warehouse', name: 'The old warehouse', x: 16, y: 36, w: 8, h: 6, colour: '#2c2430', windows: false, style: 'industrial', floors: 2 },
  { id: 'pixel_palace', name: 'Pixel Palace', x: 25, y: 36, w: 7, h: 6, colour: '#2a1a3a', windows: true, style: 'shop', awning: '#ff5fa8', sign: 'PIXEL PALACE', floors: 2, signs: [{ text: 'ARCADE', colour: '#ff5fa8' }, { text: 'PLAY', colour: '#4fd6ff' }, { text: 'WIN', colour: '#ffce6b' }], led: '#ff5fa8' },
  { id: 'tattoo', name: 'Needle & Thread', x: 43, y: 36, w: 8, h: 6, colour: '#2f1a2a', windows: true, style: 'shop', awning: '#f5348c', sign: 'NEEDLE & THREAD', floors: 2, signs: [{ text: 'TATTOO', colour: '#f5348c' }, { text: 'WALK IN', colour: '#4fd6ff' }], led: '#f5348c' },
  { id: 'akai', name: 'Akai', x: 52, y: 36, w: 7, h: 6, colour: '#2a0d10', windows: true, style: 'shop', awning: '#ff3b4a', sign: 'AKAI', floors: 2, signs: [{ text: 'AKAI', colour: '#ff3b4a' }, { text: 'OMAKASE', colour: '#ffce6b' }, { text: 'SAKE', colour: '#ff9ac2' }], led: '#ff3b4a' },
  { id: 'depot', name: 'Bus depot', x: 60, y: 36, w: 9, h: 6, colour: '#1b2128', windows: false, style: 'industrial', floors: 1 },
];

export const CITY_DOORS: readonly CityDoor[] = [
  // Venues.
  { id: 'door_bar', x: 8, y: 28, label: 'Last Call', venue: 'neon_last_call' },
  { id: 'door_books', x: 14, y: 21, label: 'Margin Notes', venue: 'margin_notes' },
  { id: 'door_gym', x: 27, y: 28, label: 'Ironhaus', venue: 'ironhaus' },

  // Places you can wander into.
  { id: 'door_cafe', x: 24, y: 21, label: 'Copper Kettle', place: 'copper_kettle' },
  { id: 'door_records', x: 60, y: 21, label: 'Static', place: 'static_records' },
  { id: 'door_panels', x: 67, y: 21, label: 'Panels', place: 'panels' },
  { id: 'door_gallery', x: 63, y: 10, label: 'Meridian Gallery', place: 'meridian_gallery' },
  { id: 'door_market', x: 43, y: 28, label: 'Fresh Market', place: 'fresh_market' },
  { id: 'door_nightjar', x: 9, y: 42, label: 'Nightjar', place: 'nightjar' },
  { id: 'door_arcade', x: 28, y: 42, label: 'Pixel Palace', place: 'pixel_palace' },
  { id: 'door_akai', x: 55, y: 42, label: 'Akai', place: 'akai' },
  { id: 'door_noodles', x: 17, y: 28, label: 'Slurp', place: 'slurp' },

  // Doors with something to say.
  { id: 'door_home', x: 48, y: 9, label: 'Home', line: 'Your flat. The radiator is making the noise again.' },
  { id: 'door_laundrette', x: 5, y: 21, label: 'Spin City', line: 'Open till late. Someone has left a single sock on top of every machine, like a warning.' },
  { id: 'door_cinema', x: 52, y: 28, label: 'The Regal', line: 'Two screens, one of them showing something from 1974. The seats are better than they have any right to be.' },
  { id: 'door_warehouse', x: 20, y: 42, label: 'The old warehouse', line: 'Chained shut. Every few months a party happens in there and nobody knows who threw it.' },
  { id: 'door_depot', x: 64, y: 42, label: 'Bus depot', line: 'The 43 lives here, apparently. You have never seen it go in or come out.' },
  { id: 'door_tattoo', x: 47, y: 42, label: 'Needle & Thread', line: "The artist's own arms are the portfolio. Sable's line-work came from here." },
];

export const CITY_PROPS: readonly CityProp[] = [
  // Lampposts down both sides of the main street.
  ...[4, 12, 20, 28, 44, 52, 60, 68].map((x, i) => ({ id: `lamp_n${i}`, kind: 'lamp' as const, x, y: 20.5 })),
  ...[8, 16, 24, 48, 56, 64].map((x, i) => ({ id: `lamp_s${i}`, kind: 'lamp' as const, x, y: 28.5 })),
  // And up the avenue.
  ...[4, 12, 32, 40].map((y, i) => ({ id: `lamp_av${i}`, kind: 'lamp' as const, x: 33.5, y })),
  ...[8, 16, 36].map((y, i) => ({ id: `lamp_ae${i}`, kind: 'lamp' as const, x: 39.5, y })),

  // The square.
  { id: 'fountain', kind: 'fountain', x: 47.5, y: 14, label: 'The fountain', line: 'Coins on the bottom, a pigeon on the top, and the water has been the same green since March.' },
  { id: 'kiosk', kind: 'kiosk', x: 43, y: 11, label: 'Coffee kiosk', line: 'Cash only, no oat milk, a queue anyway. That tells you everything about the coffee.' },
  { id: 'statue', kind: 'statue', x: 52, y: 12, label: 'The statue', line: 'A man nobody can name, pointing at a building that is no longer there.' },
  { id: 'sq_bench_1', kind: 'bench', x: 44, y: 17, label: 'A bench', line: 'Faces the fountain. Good for pretending to read.' },
  { id: 'sq_bench_2', kind: 'bench', x: 51, y: 17, label: 'A bench', line: 'Someone has carved initials and a date. The date is wrong.' },
  { id: 'ringbar_1', kind: 'ringbar', x: 43.5, y: 14.2, label: 'The ring bar', line: 'A bar built in a circle round a tree, lit from underneath. Nobody knows who serves; drinks appear.' },
  { id: 'ringbar_2', kind: 'ringbar', x: 52, y: 15.4, label: 'The other ring bar', line: 'Same idea, other tree. This one has the better stools and the worse music.' },
  { id: 'holo_sq', kind: 'holo', x: 41.6, y: 10.4, passable: true, label: 'A hologram', line: 'An advert for a phone, flickering. It has been the same phone for three years and it still looks like the future.' },

  // The park.
  ...[4, 7, 11, 17, 24].map((x, i) => ({ id: `tree_n${i}`, kind: 'tree' as const, x, y: 3.5 + (i % 2) })),
  ...[3, 6, 18, 23, 26].map((x, i) => ({ id: `tree_s${i}`, kind: 'tree' as const, x, y: 13.5 })),
  { id: 'park_bench_1', kind: 'bench', x: 17, y: 10, label: 'The bench', line: 'A good bench. You have watched the light go orange from here before.' },
  { id: 'park_bench_2', kind: 'bench', x: 5, y: 10, label: 'A bench', line: 'Faces the pond. The ducks have a hierarchy and you are not in it.' },
  { id: 'pond_sign', kind: 'sign', x: 8, y: 5, label: 'The pond', line: 'DO NOT FEED THE DUCKS. Below it, in marker: they are fine.' },
  { id: 'bandstand', kind: 'statue', x: 24, y: 8, label: 'The bandstand', line: 'Nobody has played it in years. Teenagers sit on the steps and are the band now.' },

  // Main street furniture.
  { id: 'busstop', kind: 'busstop', x: 14, y: 27.5, label: 'Bus stop', line: 'The 43 is due in two minutes. It has been due in two minutes since you moved here.' },
  { id: 'phonebox', kind: 'phonebox', x: 38, y: 20.5, label: 'Phone box', line: 'It works. Nobody has tested that theory this decade.' },
  { id: 'vending', kind: 'vending', x: 30, y: 27.5, label: 'Vending machine', line: 'Everything is a pound. The energy drinks glow slightly.' },
  { id: 'bikes', kind: 'bikerack', x: 10, y: 20.5, label: 'Bike rack', line: 'Six bikes, four locks, two optimists.' },
  { id: 'hydrant_1', kind: 'hydrant', x: 26, y: 20.5 },
  { id: 'hydrant_2', kind: 'hydrant', x: 58, y: 28.5 },
  ...[2, 22, 42, 62].map((x, i) => ({ id: `bin_n${i}`, kind: 'bin' as const, x, y: 21 })),
  ...[12, 36, 56].map((x, i) => ({ id: `bin_s${i}`, kind: 'bin' as const, x, y: 28 })),
  // Bollards mark the crossing from the road edge, not the pavement: on the
  // pavement they sat exactly where people walk.
  ...[29.5, 32.5, 29.5, 32.5].map((x, i) => ({ id: `bollard_${i}`, kind: 'bollard' as const, x, y: i < 2 ? 22.3 : 26.7 })),
  { id: 'holo_office', kind: 'holo', x: 32.6, y: 7, passable: true },
  { id: 'holo_office_2', kind: 'holo', x: 32.6, y: 13.5, passable: true },
  { id: 'holo_carpark', kind: 'holo', x: 65, y: 28.2, passable: true },
  ...[[10, 23.4], [26, 25.6], [45, 23.2], [58, 25.8], [36.5, 8], [36.5, 38], [20, 43.2], [64, 43.2], [47, 12.6]].map(([x, y], i) => ({ id: `puddle_${i}`, kind: 'puddle' as const, x: x!, y: y!, passable: true })),
  { id: 'manhole_1', kind: 'manhole', x: 18, y: 24, passable: true },
  { id: 'manhole_2', kind: 'manhole', x: 50, y: 25, passable: true },
  { id: 'manhole_3', kind: 'manhole', x: 36, y: 12, passable: true },

  // The canal.
  { id: 'mural', kind: 'mural', x: 23, y: 41.5, label: 'The mural', line: 'A whale the size of a bus, painted in one night by someone who has never been caught.', passable: true },
  { id: 'canal_bench_1', kind: 'bench', x: 34, y: 43, label: 'The bridge', line: 'Cold iron rail, black water, a shopping trolley making a statement.' },
  { id: 'canal_bench_2', kind: 'bench', x: 60, y: 43, label: 'A bench', line: 'The canal at night is the best free thing in the city and nobody comes.' },
  ...[6, 40, 66].map((x, i) => ({ id: `lamp_c${i}`, kind: 'lamp' as const, x, y: 42.5 })),
  { id: 'trolley', kind: 'sign', x: 28, y: 43, label: 'Shopping trolley', line: 'Half in the water. It has been there so long it has a name.' },
];

/** Where the player appears when the map opens: the crossing, mid-block. */
export const CITY_SPAWN = { x: 36, y: 27.5 };

export interface CityWalker {
  id: string;
  /** Tiles the walker paces between. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  colour: string;
  speed: number;
}

export const CITY_WALKERS: readonly CityWalker[] = [
  { id: 'w1', from: { x: 2, y: 20.8 }, to: { x: 68, y: 20.8 }, colour: '#6f6a92', speed: 1.5 },
  { id: 'w2', from: { x: 69, y: 27.8 }, to: { x: 4, y: 27.8 }, colour: '#8a6f92', speed: 1.1 },
  { id: 'w3', from: { x: 33, y: 2 }, to: { x: 33, y: 42 }, colour: '#5f7a92', speed: 0.8 },
  { id: 'w4', from: { x: 40, y: 44 }, to: { x: 40, y: 4 }, colour: '#7a8a6f', speed: 0.9 },
  { id: 'w5', from: { x: 3, y: 42.8 }, to: { x: 70, y: 42.8 }, colour: '#92806f', speed: 1.3 },
  { id: 'w6', from: { x: 42, y: 18 }, to: { x: 54, y: 10 }, colour: '#8f7a5a', speed: 0.7 },
  { id: 'w7', from: { x: 3, y: 11.8 }, to: { x: 26, y: 11.8 }, colour: '#6a8a7a', speed: 1.0 },
  { id: 'w8', from: { x: 21, y: 3 }, to: { x: 21, y: 14 }, colour: '#9a7a8a', speed: 0.6 },
  { id: 'w9', from: { x: 2, y: 35.5 }, to: { x: 69, y: 35.5 }, colour: '#7a7a9a', speed: 1.2 },
];
