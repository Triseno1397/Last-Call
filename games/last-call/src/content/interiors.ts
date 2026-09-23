/**
 * The inside of every building, as data.
 *
 * Walking through a door puts you in a room you can walk around, not on a menu
 * screen: the bar has a counter you stand at and a dartboard in the corner, the
 * bookshop has shelves and one good armchair, the gym has racks. Everything the
 * renderer and the collision code need is here, in the same tile coordinates
 * the street uses, so one world renderer draws both.
 *
 * `stations` are where people stand. A lead is placed at the station matching
 * her id, or the first free one; a station with a `stranger` belongs to the
 * member of staff or the visitor named, so every shop has someone behind the
 * counter and, some of the time, someone browsing.
 *
 * A prop with an `action` is something you can do rather than just look at:
 * order a drink, buy a comic, do a set. It costs money or energy and can teach
 * you something, which is what a place is for.
 */
import type { CharacterId, StatId } from '@/content/ids';
import type { CityRect, InteriorId } from '@/content/city';

export type FloorKind = 'wood' | 'tile' | 'rubber' | 'rug' | 'stage' | 'checker' | 'marble';

export type PropKind =
  | 'espresso'
  | 'pastry_case'
  | 'crate'
  | 'listening_post'
  | 'poster'
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
  | 'mirror'
  | 'cabinet'
  | 'painting'
  | 'plinth'
  | 'fridge'
  | 'produce'
  | 'booth'
  | 'bottles'
  | 'oven'
  | 'led_strip'
  | 'lantern'
  | 'blossom'
  | 'cocoon'
  | 'grow_rack'
  | 'ring'
  | 'shoji'
  | 'cityview';

export interface InteriorFloor extends CityRect {
  kind: FloorKind;
}

/** Something you can do at a fixture, beyond reading its line. */
export interface PropAction {
  id: string;
  /** Button label: "Order a pint". */
  label: string;
  cost: number;
  /** Energy change. Eating restores it; a set at the rack spends it. */
  energy?: number;
  statXp?: { stat: StatId; amount: number };
  /** What happened, shown once it is done. */
  line: string;
}

export interface InteriorProp extends CityRect {
  kind: PropKind;
  /** Props you can walk through — rugs, neon on a wall, a window. */
  passable?: boolean;
  /** Tint override; otherwise the prop uses the room's palette. */
  colour?: string;
  label?: string;
  /** What you get when you look at it. */
  line?: string;
  /** What you can do here. */
  action?: PropAction;
}

export interface InteriorStation {
  /** The regular who stands here, when she is in. */
  character?: CharacterId;
  /** The member of staff or visitor who stands here (see content/strangers). */
  stranger?: string;
  x: number;
  y: number;
  /** Which way they face while they wait. */
  facing: 'down' | 'up' | 'left' | 'right';
}

export interface InteriorDef {
  venue: InteriorId;
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
  /** A mirrored ceiling doubles the room's lights along the back wall. */
  ceiling?: 'mirror';
}

const BAR: InteriorDef = {
  venue: 'neon_last_call',
  width: 22,
  height: 15,
  spawn: { x: 11, y: 12.4 },
  exit: { x: 11, y: 13.4 },
  palette: { wall: '#1a0f2e', trim: '#33205a', glow: '#ff5fa8' },
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 20, h: 12 },
    { kind: 'stage', x: 15, y: 2, w: 6, h: 4 },
  ],
  props: [
    { kind: 'led_strip', x: 1, y: 1.6, w: 20, h: 0.3, passable: true, colour: '#ff5fa8' },
    { kind: 'led_strip', x: 1, y: 0.6, w: 20, h: 0.3, passable: true, colour: '#4fd6ff' },
    { kind: 'booth', x: 17.4, y: 11.2, w: 3.4, h: 1.5, colour: '#3a2030', label: 'the leather sofa', line: 'Cracked leather, a coffee table with a ring for every night of its life, and the best view of the neon mammoth on the wall.' },
    { kind: 'neon', x: 17.6, y: 0.8, w: 3, h: 1, passable: true, colour: '#9a6bff', label: 'KARAOKE' },
    {
      kind: 'counter', x: 2, y: 4, w: 9, h: 2, label: 'the bar',
      action: { id: 'bar_pint', label: 'Order a pint', cost: 6, energy: 3, statXp: { stat: 'confidence', amount: 3 }, line: 'A pint, a nod from the barback, and the first cold mouthful. The room gets a little easier to stand in.' },
    },
    { kind: 'bottles', x: 2, y: 2.3, w: 9, h: 1, passable: true },
    { kind: 'stool', x: 2, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 4, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 6, y: 6.6, w: 1, h: 1 },
    { kind: 'stool', x: 8, y: 6.6, w: 1, h: 1 },
    { kind: 'neon', x: 13, y: 2.3, w: 4, h: 1, passable: true, label: 'LAST CALL' },
    { kind: 'dartboard', x: 19.5, y: 7, w: 1.4, h: 1.4, passable: true, label: 'darts' },
    { kind: 'table', x: 4, y: 10, w: 2, h: 2 },
    { kind: 'table', x: 8, y: 10, w: 2, h: 2 },
    { kind: 'table', x: 15, y: 10, w: 2, h: 2 },
    { kind: 'lamp', x: 13, y: 7, w: 1, h: 1, passable: true },
    { kind: 'plant', x: 14, y: 12.6, w: 1, h: 1 },
  ],
  stations: [
    { character: 'sable', x: 6.5, y: 3.2, facing: 'down' },
    { character: 'nadia', x: 16.5, y: 8.4, facing: 'left' },
    { stranger: 'barback', x: 9.4, y: 3.2, facing: 'down' },
    { stranger: 'darts_regular', x: 18.6, y: 9.6, facing: 'right' },
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
  palette: { wall: '#0d1a20', trim: '#233a44', glow: '#3ee6d6' },
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'rug', x: 12, y: 7, w: 5, h: 4 },
  ],
  props: [
    { kind: 'neon', x: 7, y: 0.9, w: 6, h: 1, passable: true, label: 'MARGIN NOTES' },
    { kind: 'led_strip', x: 1, y: 1.7, w: 18, h: 0.3, passable: true, colour: '#3ee6d6' },
    { kind: 'shelf', x: 1, y: 6, w: 1, h: 5, colour: '#3a2a1e' },
    { kind: 'shelf', x: 18, y: 6, w: 1, h: 5, colour: '#3a2a1e' },
    { kind: 'crate', x: 9, y: 9.4, w: 2.4, h: 1.4, colour: '#3a2a1e', label: 'the stacks', line: 'Books in towers on the floor, because the shelves gave up in 2019. The towers have a system. Mr Adeyemi is the system.' },
    {
      kind: 'shelf', x: 2, y: 2.4, w: 3, h: 1.4, label: 'poetry, shelved wrong',
      action: { id: 'books_buy', label: 'Buy a book', cost: 8, statXp: { stat: 'culture', amount: 10 }, line: 'A slim thing with a cracked spine and somebody else’s pencil in the margins. Theirs are better than the poems.' },
    },
    { kind: 'shelf', x: 6, y: 2.4, w: 3, h: 1.4 },
    { kind: 'shelf', x: 10, y: 2.4, w: 3, h: 1.4 },
    { kind: 'shelf', x: 2, y: 6, w: 1.4, h: 4 },
    { kind: 'shelf', x: 6, y: 6, w: 1.4, h: 4 },
    {
      kind: 'counter', x: 14, y: 2.4, w: 4, h: 1.6, label: 'the coffee counter',
      action: { id: 'books_coffee', label: 'Get a coffee', cost: 3, energy: 8, line: 'Filter coffee in a mug that says WORLD’S OKAYEST BOOKSELLER. It is, somehow, excellent.' },
    },
    { kind: 'armchair', x: 13.5, y: 8.4, w: 1.6, h: 1.6, label: 'the good armchair' },
    { kind: 'armchair', x: 15.6, y: 8.4, w: 1.6, h: 1.6 },
    { kind: 'table', x: 14.4, y: 6.4, w: 1.6, h: 1.4 },
    { kind: 'window', x: 1, y: 11.4, w: 4, h: 1, passable: true },
    { kind: 'plant', x: 17.6, y: 11, w: 1, h: 1 },
    { kind: 'lamp', x: 11, y: 5, w: 1, h: 1, passable: true },
  ],
  stations: [
    { character: 'wren', x: 13.4, y: 6.6, facing: 'down' },
    { stranger: 'owner_books', x: 15.2, y: 4.6, facing: 'down' },
    { stranger: 'reader', x: 4.6, y: 8.4, facing: 'left' },
    { x: 9, y: 8, facing: 'down' },
    { x: 4, y: 5, facing: 'up' },
  ],
};

const GYM: InteriorDef = {
  venue: 'ironhaus',
  width: 20,
  height: 14,
  spawn: { x: 10, y: 11.4 },
  exit: { x: 10, y: 12.4 },
  palette: { wall: '#101a24', trim: '#22323f', glow: '#4fd6ff' },
  floors: [
    { kind: 'rubber', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'stage', x: 2, y: 3, w: 5, h: 4 },
  ],
  props: [
    { kind: 'led_strip', x: 1, y: 1.7, w: 18, h: 0.3, passable: true, colour: '#4fd6ff' },
    { kind: 'led_strip', x: 1, y: 12.7, w: 18, h: 0.3, passable: true, colour: '#4fd6ff' },
    {
      kind: 'rack', x: 2.4, y: 2.4, w: 2, h: 1.4, label: 'the squat rack',
      action: { id: 'gym_set', label: 'Do a set', cost: 0, energy: -12, statXp: { stat: 'fitness', amount: 12 }, line: 'Five reps, then three more you had no business doing. Your legs file a complaint you will read tomorrow.' },
    },
    { kind: 'rack', x: 5.4, y: 2.4, w: 2, h: 1.4 },
    { kind: 'rack', x: 8.4, y: 2.4, w: 2, h: 1.4 },
    { kind: 'bench', x: 3, y: 8, w: 2.4, h: 1.2 },
    { kind: 'bench', x: 7, y: 8, w: 2.4, h: 1.2 },
    { kind: 'bench', x: 11, y: 8, w: 2.4, h: 1.2 },
    { kind: 'mirror', x: 14, y: 2.4, w: 5, h: 1, passable: true },
    { kind: 'counter', x: 14.4, y: 4, w: 4, h: 1.4, label: 'the front desk', line: 'A sign-in sheet, a bowl of protein bars, and a laminated list of things Rae has seen people do to the cable machine.' },
    { kind: 'rack', x: 15.4, y: 6.6, w: 1.6, h: 3 },
    { kind: 'neon', x: 8, y: 2.2, w: 4, h: 0.8, passable: true, label: 'IRONHAUS' },
    { kind: 'plant', x: 17.8, y: 11, w: 1, h: 1 },
  ],
  stations: [
    { character: 'nadia', x: 9.4, y: 6.4, facing: 'down' },
    { character: 'wren', x: 5, y: 10, facing: 'up' },
    { stranger: 'gym_desk', x: 16.4, y: 5.8, facing: 'down' },
    { stranger: 'lifter', x: 12.2, y: 10, facing: 'up' },
    { x: 13, y: 4.4, facing: 'down' },
  ],
};

const CAFE: InteriorDef = {
  venue: 'copper_kettle',
  width: 16,
  height: 12,
  spawn: { x: 8, y: 9.4 },
  exit: { x: 8, y: 10.4 },
  palette: { wall: '#1a1622', trim: '#3a2c4a', glow: '#ffd36b' },
  ceiling: 'mirror',
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 14, h: 9 },
    { kind: 'rug', x: 9, y: 6, w: 5, h: 3 },
  ],
  props: [
    { kind: 'led_strip', x: 1, y: 1.7, w: 14, h: 0.3, passable: true, colour: '#ffd36b' },
    {
      kind: 'counter', x: 2, y: 2.4, w: 7, h: 1.8, label: 'the counter',
      action: { id: 'cafe_flat_white', label: 'Order a flat white', cost: 4, energy: 10, line: 'Milo draws a fern in the foam without looking. You drink it too fast, as everyone does.' },
    },
    { kind: 'espresso', x: 3, y: 2.2, w: 1.6, h: 1, passable: true, label: 'the espresso machine' },
    { kind: 'pastry_case', x: 6, y: 2.2, w: 2.4, h: 1, passable: true, label: 'the pastry case' },
    { kind: 'table', x: 2.4, y: 6, w: 1.6, h: 1.4 },
    { kind: 'table', x: 5.4, y: 6, w: 1.6, h: 1.4 },
    { kind: 'table', x: 2.4, y: 8.6, w: 1.6, h: 1.4 },
    { kind: 'cocoon', x: 9.8, y: 5.8, w: 1.6, h: 2, label: 'the cocoon chair', line: 'A wicker shell you climb into. Once you are in it, the room goes quiet and you stop wanting to leave.' },
    { kind: 'cocoon', x: 12.4, y: 5.8, w: 1.6, h: 2 },
    { kind: 'table', x: 11, y: 8.4, w: 1.6, h: 1.2, colour: '#d8b06a' },
    { kind: 'window', x: 10, y: 10.4, w: 5, h: 1, passable: true },
    { kind: 'plant', x: 14, y: 2.6, w: 1, h: 1 },
    { kind: 'lamp', x: 8, y: 5, w: 1, h: 1, passable: true },
    { kind: 'poster', x: 12, y: 2.3, w: 1.4, h: 1, passable: true, label: 'the noticeboard', line: 'Lost cat, found cat, a band that needs a drummer, and a flat that is definitely a cupboard.' },
  ],
  stations: [
    { stranger: 'barista', x: 7.6, y: 4.8, facing: 'down' },
    { stranger: 'laptop', x: 13.6, y: 9.6, facing: 'left' },
    { x: 4.6, y: 4.8, facing: 'down' },
    { x: 12.4, y: 5.4, facing: 'down' },
  ],
};

const RECORDS: InteriorDef = {
  venue: 'static_records',
  width: 18,
  height: 13,
  spawn: { x: 9, y: 10.4 },
  exit: { x: 9, y: 11.4 },
  palette: { wall: '#150f26', trim: '#2c2840', glow: '#9a6bff' },
  floors: [
    { kind: 'tile', x: 1, y: 2, w: 16, h: 10 },
    { kind: 'rug', x: 12, y: 8, w: 4, h: 3 },
  ],
  props: [
    { kind: 'led_strip', x: 1, y: 1.7, w: 16, h: 0.3, passable: true, colour: '#ff5fa8' },
    { kind: 'led_strip', x: 1, y: 0.7, w: 16, h: 0.3, passable: true, colour: '#4fd6ff' },
    { kind: 'counter', x: 11, y: 2.4, w: 5, h: 1.6, label: 'the counter' },
    {
      kind: 'crate', x: 2, y: 3, w: 3, h: 1.6, label: 'NEW IN',
      action: { id: 'records_buy', label: 'Buy a record', cost: 12, statXp: { stat: 'culture', amount: 8 }, line: 'Something on a label you have never heard of, chosen by the sleeve. Bea nods once, which is the review.' },
    },
    { kind: 'crate', x: 6, y: 3, w: 3, h: 1.6, label: 'SOUL / FUNK' },
    { kind: 'crate', x: 2, y: 6, w: 3, h: 1.6, label: 'JAZZ' },
    { kind: 'crate', x: 6, y: 6, w: 3, h: 1.6, label: 'ELECTRONIC' },
    { kind: 'crate', x: 2, y: 9, w: 3, h: 1.6, label: 'BARGAIN', line: 'Everything two pounds. Some of it is worth more; some of it is why.' },
    { kind: 'crate', x: 6, y: 9, w: 3, h: 1.6, label: 'LOCAL' },
    { kind: 'shelf', x: 10, y: 5.4, w: 1.4, h: 5 },
    {
      kind: 'listening_post', x: 13, y: 5.4, w: 1.4, h: 1.4, label: 'the listening post',
      line: 'One pair of headphones, held together with tape. Whatever is on it is always better than what you came in for.',
      action: { id: 'records_listen', label: 'Put the headphones on', cost: 0, energy: 4, statXp: { stat: 'culture', amount: 3 }, line: 'Four minutes of something with a bassline that makes the shop go quiet. You will hum it for a week.' },
    },
    { kind: 'poster', x: 15, y: 2.2, w: 1.4, h: 1, passable: true, label: 'gig posters', line: 'Three layers deep. The band from the middle layer is playing the bar on Friday.' },
    { kind: 'neon', x: 5, y: 2.2, w: 4, h: 0.9, passable: true, label: 'STATIC' },
    { kind: 'plant', x: 16, y: 10.6, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'record_clerk', x: 13.4, y: 4.4, facing: 'down' },
    { stranger: 'digger', x: 4, y: 8, facing: 'up' },
    { x: 8, y: 10.8, facing: 'up' },
    { x: 11.8, y: 10.8, facing: 'up' },
  ],
};

const NIGHTJAR: InteriorDef = {
  venue: 'nightjar',
  width: 20,
  height: 14,
  spawn: { x: 10, y: 11.4 },
  exit: { x: 10, y: 12.4 },
  palette: { wall: '#0b1330', trim: '#1a2a5a', glow: '#4fd6ff' },
  ceiling: 'mirror',
  floors: [
    { kind: 'tile', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'rug', x: 12, y: 7, w: 5, h: 4 },
  ],
  props: [
    { kind: 'cityview', x: 11, y: 0.4, w: 8, h: 1.7, passable: true, label: 'the window', line: 'Floor to ceiling, the whole city doing its thing in pink and blue. From here it looks like it is on your side.' },
    { kind: 'led_strip', x: 1, y: 1.8, w: 10, h: 0.3, passable: true, colour: '#4fd6ff' },
    { kind: 'led_strip', x: 1, y: 12.7, w: 18, h: 0.3, passable: true, colour: '#ff5fa8' },
    {
      kind: 'counter', x: 2, y: 4, w: 8, h: 1.8, label: 'the bar',
      action: { id: 'nightjar_cocktail', label: 'Order a cocktail', cost: 12, energy: 4, statXp: { stat: 'style', amount: 6 }, line: 'Lucian builds something smoky with a twist of orange peel and does not tell you what it is. It is very good, and you sit up straighter.' },
    },
    { kind: 'bottles', x: 2, y: 2.3, w: 8, h: 1, passable: true, label: 'the back bar', line: 'Two hundred bottles lit from below. Lucian knows what is in every one and will tell you about exactly three.' },
    { kind: 'stool', x: 2, y: 6.4, w: 1, h: 1 },
    { kind: 'stool', x: 4, y: 6.4, w: 1, h: 1 },
    { kind: 'stool', x: 6, y: 6.4, w: 1, h: 1 },
    { kind: 'stool', x: 8, y: 6.4, w: 1, h: 1 },
    { kind: 'neon', x: 5, y: 0.9, w: 5, h: 1, passable: true, label: 'NIGHTJAR' },
    { kind: 'booth', x: 13, y: 4.6, w: 4, h: 1.6, colour: '#1c2b5a', label: 'the corner booth', line: 'Blue velvet, low light, and a candle that has been the same height for a year. Where the good conversations happen.' },
    { kind: 'table', x: 14, y: 7.2, w: 2, h: 1.4, colour: '#2a3a6a' },
    { kind: 'booth', x: 13, y: 9.2, w: 4, h: 1.6, colour: '#1c2b5a' },
    { kind: 'lamp', x: 11, y: 6, w: 1, h: 1, passable: true },
    { kind: 'table', x: 4, y: 9.4, w: 2, h: 1.6 },
    { kind: 'table', x: 8, y: 9.4, w: 2, h: 1.6 },
    { kind: 'plant', x: 17.6, y: 11, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'mixologist', x: 5, y: 3.2, facing: 'down' },
    { stranger: 'birthday', x: 3.2, y: 7.8, facing: 'up' },
    { x: 7.4, y: 8.2, facing: 'up' },
    { x: 16.4, y: 8.8, facing: 'left' },
  ],
};

const AKAI: InteriorDef = {
  venue: 'akai',
  width: 20,
  height: 14,
  spawn: { x: 10, y: 11.4 },
  exit: { x: 10, y: 12.4 },
  palette: { wall: '#240a0e', trim: '#4a1418', glow: '#ff3b4a' },
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 18, h: 11 },
    { kind: 'rug', x: 5, y: 5.6, w: 10, h: 4.8 },
  ],
  props: [
    { kind: 'shoji', x: 1, y: 0.5, w: 4, h: 1.5, passable: true },
    { kind: 'shoji', x: 15, y: 0.5, w: 4, h: 1.5, passable: true },
    { kind: 'blossom', x: 2, y: 0.2, w: 5, h: 2, passable: true },
    { kind: 'blossom', x: 8, y: 0, w: 4, h: 1.8, passable: true },
    { kind: 'blossom', x: 13.5, y: 0.2, w: 5.5, h: 2, passable: true },
    { kind: 'lantern', x: 6.6, y: 2.4, w: 0.8, h: 1.2, passable: true, label: 'the lantern', line: 'Paper, red, one character painted on it: 赤. Akai. Red. The whole place is a pun and it works.' },
    { kind: 'lantern', x: 12.6, y: 2.4, w: 0.8, h: 1.2, passable: true },
    {
      kind: 'counter', x: 8, y: 2.6, w: 4, h: 1.4, label: 'the counter',
      action: { id: 'akai_omakase', label: 'Order the omakase', cost: 18, energy: 25, line: 'Sora chooses for you, seven small plates, each one better than the last. You will think about the fourth one tomorrow.' },
    },
    { kind: 'table', x: 6, y: 7, w: 8, h: 1.6, colour: '#1a0a0c', label: 'the long table', line: 'One black slab under a ceiling of blossom, set for twelve. Light from somewhere paints patterns across it that keep moving.' },
    { kind: 'armchair', x: 6, y: 5.4, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'armchair', x: 9.3, y: 5.4, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'armchair', x: 12.6, y: 5.4, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'armchair', x: 6, y: 8.8, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'armchair', x: 9.3, y: 8.8, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'armchair', x: 12.6, y: 8.8, w: 1.4, h: 1.4, colour: '#e0362e' },
    { kind: 'booth', x: 1.4, y: 4.4, w: 1.6, h: 6, colour: '#c9313f', label: 'the banquette', line: 'Tufted red velvet along the wall, the seat everyone wants and nobody books.' },
    { kind: 'booth', x: 17, y: 4.4, w: 1.6, h: 6, colour: '#c9313f' },
    { kind: 'table', x: 3.4, y: 5.2, w: 1.4, h: 1.4, colour: '#1a0a0c', label: 'the table for two', line: 'Set for two, a candle, a chair pulled out and left that way.' },
    { kind: 'table', x: 3.4, y: 8.6, w: 1.4, h: 1.4, colour: '#1a0a0c' },
    { kind: 'table', x: 15.2, y: 5.2, w: 1.4, h: 1.4, colour: '#1a0a0c' },
    { kind: 'table', x: 15.2, y: 8.6, w: 1.4, h: 1.4, colour: '#1a0a0c' },
    { kind: 'led_strip', x: 1, y: 12.7, w: 18, h: 0.3, passable: true, colour: '#ff3b4a' },
    { kind: 'plant', x: 1.2, y: 11.4, w: 1, h: 1 },
    { kind: 'plant', x: 18, y: 11.4, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'waiter', x: 10, y: 4.6, facing: 'down' },
    { stranger: 'date_night', x: 3.8, y: 7, facing: 'up' },
    { x: 15.8, y: 7, facing: 'up' },
    { x: 10, y: 11, facing: 'up' },
  ],
};

const SLURP: InteriorDef = {
  venue: 'slurp',
  width: 18,
  height: 12,
  spawn: { x: 9, y: 9.4 },
  exit: { x: 9, y: 10.4 },
  palette: { wall: '#14261f', trim: '#2b4a3a', glow: '#ffd36b' },
  floors: [{ kind: 'checker', x: 1, y: 2, w: 16, h: 9 }],
  props: [
    { kind: 'led_strip', x: 1, y: 1.6, w: 16, h: 0.4, passable: true, colour: '#ffd36b' },
    { kind: 'neon', x: 12.5, y: 0.9, w: 3.5, h: 1, passable: true, label: 'SLURP' },
    { kind: 'poster', x: 3, y: 0.7, w: 1.4, h: 1, passable: true, label: 'the menu', line: 'Seven bowls, hand-painted, prices crossed out and rewritten four times. The egg is not optional.' },
    {
      kind: 'counter', x: 2, y: 3.4, w: 12, h: 1.6, label: 'the counter',
      action: { id: 'slurp_bowl', label: 'Order a bowl', cost: 8, energy: 20, line: 'Tam slides it over without a word: broth, noodles, the egg. You do not talk for six minutes. Nobody does.' },
    },
    { kind: 'stool', x: 2.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'stool', x: 4.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'stool', x: 6.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'stool', x: 8.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'stool', x: 10.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'stool', x: 12.5, y: 5.4, w: 1, h: 1, colour: '#e0362e' },
    { kind: 'fridge', x: 14.6, y: 2.4, w: 2.4, h: 1.4, label: 'the drinks fridge', line: 'Glass door, blue light, every soft drink in the world and one beer that is always sold out.' },
    { kind: 'booth', x: 2, y: 8.4, w: 3, h: 1.4, colour: '#c9313f' },
    { kind: 'table', x: 5.4, y: 8.4, w: 2, h: 1.4, colour: '#e8e2f2' },
    { kind: 'booth', x: 11.5, y: 8.4, w: 3, h: 1.4, colour: '#c9313f', label: 'the corner booth', line: 'Red vinyl, a rip mended with tape, and the best view of the street through the steamed-up glass.' },
    { kind: 'window', x: 12, y: 10.4, w: 4, h: 1, passable: true },
    { kind: 'plant', x: 16, y: 9.4, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'cook', x: 7, y: 2.8, facing: 'down' },
    { stranger: 'night_owl', x: 12.9, y: 6.7, facing: 'up' },
    { x: 4.9, y: 6.7, facing: 'up' },
    { x: 8.6, y: 10.2, facing: 'up' },
  ],
};

const ARCADE: InteriorDef = {
  venue: 'pixel_palace',
  width: 20,
  height: 13,
  spawn: { x: 10, y: 10.4 },
  exit: { x: 10, y: 11.4 },
  palette: { wall: '#12081f', trim: '#2e1d48', glow: '#ff5fa8' },
  floors: [{ kind: 'tile', x: 1, y: 2, w: 18, h: 10 }],
  props: [
    { kind: 'led_strip', x: 1, y: 1.7, w: 18, h: 0.3, passable: true, colour: '#ff5fa8' },
    { kind: 'led_strip', x: 1, y: 0.7, w: 18, h: 0.3, passable: true, colour: '#4fd6ff' },
    { kind: 'led_strip', x: 1, y: 11.7, w: 18, h: 0.3, passable: true, colour: '#9a6bff' },
    {
      kind: 'cabinet', x: 2, y: 2.4, w: 1.8, h: 1.6, label: 'STREET BRAWLER II', colour: '#c9313f',
      action: { id: 'arcade_brawler', label: 'Play a round', cost: 1, energy: -3, statXp: { stat: 'confidence', amount: 4 }, line: 'You pick the big slow one, lose the first round, and win the second on a move you did not know you knew.' },
    },
    {
      kind: 'cabinet', x: 4.2, y: 2.4, w: 1.8, h: 1.6, label: 'GALAXY RAID', colour: '#4fd6ff',
      action: { id: 'arcade_raid', label: 'Play a round', cost: 1, energy: -3, statXp: { stat: 'confidence', amount: 4 }, line: 'Three lives, a boss with too many eyes, and initials on the high-score table that are almost yours.' },
    },
    {
      kind: 'cabinet', x: 6.4, y: 2.4, w: 1.8, h: 1.6, label: 'PUCK RUNNER', colour: '#ffce6b',
      action: { id: 'arcade_puck', label: 'Play a round', cost: 1, energy: -3, statXp: { stat: 'humor', amount: 4 }, line: 'A maze, a ghost, a noise you will hear in your sleep. You laugh out loud when it gets you, which is the point.' },
    },
    {
      kind: 'cabinet', x: 8.6, y: 2.4, w: 1.8, h: 1.6, label: 'BEAT DROP', colour: '#9a6bff',
      action: { id: 'arcade_dance', label: 'Play a round', cost: 1, energy: -6, statXp: { stat: 'fitness', amount: 5 }, line: 'The arrows come faster than your feet. By the last chorus half the arcade is watching and you have stopped caring.' },
    },
    { kind: 'neon', x: 11, y: 2.3, w: 3, h: 0.9, passable: true, label: 'PIXEL' },
    { kind: 'counter', x: 14, y: 2.6, w: 4.4, h: 1.5, label: 'the prize counter', line: 'Four thousand tickets for a keyring. Nobody has ever had four thousand tickets. The keyring is dusty.' },
    {
      kind: 'cabinet', x: 2, y: 7, w: 1.8, h: 1.6, label: 'AIR HOCKEY', colour: '#3fbf85',
      action: { id: 'arcade_hockey', label: 'Play a round', cost: 1, energy: -4, statXp: { stat: 'confidence', amount: 3 }, line: 'The puck leaves the table twice. You win seven to five against nobody, which still counts.' },
    },
    {
      kind: 'cabinet', x: 5, y: 7, w: 1.8, h: 1.6, label: 'THE CLAW', colour: '#ff9ac2',
      action: { id: 'arcade_claw', label: 'Have a go', cost: 2, energy: -1, statXp: { stat: 'charm', amount: 2 }, line: 'The claw closes on a plush octopus, lifts it an inch, and lets go. It always lets go. You are, briefly, philosophical about this.' },
    },
    { kind: 'bench', x: 8.5, y: 7.2, w: 2.4, h: 1.2 },
    {
      kind: 'cabinet', x: 13, y: 7, w: 1.8, h: 1.6, label: 'PINBALL', colour: '#e2a03f',
      action: { id: 'arcade_pinball', label: 'Play a round', cost: 1, energy: -2, statXp: { stat: 'style', amount: 3 }, line: 'Multiball. Lights. A tilt warning you deserved. The machine says GOOD SHOT in a voice from 1991.' },
    },
    {
      kind: 'cabinet', x: 16, y: 7, w: 1.8, h: 1.6, label: 'RHYTHM STAR', colour: '#4fd6ff',
      action: { id: 'arcade_rhythm', label: 'Play a round', cost: 1, energy: -3, statXp: { stat: 'humor', amount: 3 }, line: 'Two plastic drums and a song about a fox. You hit every note in the chorus and none in the verse.' },
    },
    { kind: 'plant', x: 18, y: 9.6, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'arcade_attendant', x: 16, y: 4.8, facing: 'down' },
    { stranger: 'gamer', x: 3, y: 9.4, facing: 'up' },
    { x: 14, y: 9.4, facing: 'up' },
    { x: 7.4, y: 5, facing: 'down' },
  ],
};

const COMICS: InteriorDef = {
  venue: 'panels',
  width: 18,
  height: 13,
  spawn: { x: 9, y: 10.4 },
  exit: { x: 9, y: 11.4 },
  palette: { wall: '#101a2a', trim: '#2a3a55', glow: '#ffce6b' },
  floors: [
    { kind: 'wood', x: 1, y: 2, w: 16, h: 10 },
    { kind: 'rug', x: 11, y: 7, w: 4, h: 3 },
  ],
  props: [
    { kind: 'neon', x: 5, y: 0.9, w: 4, h: 1, passable: true, label: 'PANELS' },
    { kind: 'led_strip', x: 1, y: 1.7, w: 16, h: 0.3, passable: true, colour: '#ffce6b' },
    {
      kind: 'shelf', x: 2, y: 2.4, w: 4, h: 1.4, label: 'new releases',
      action: { id: 'panels_comic', label: 'Buy a comic', cost: 5, statXp: { stat: 'culture', amount: 5 }, line: 'Issue one of something with a cover that looks like a poster. You read it standing up before you reach the door.' },
    },
    { kind: 'shelf', x: 7, y: 2.4, w: 4, h: 1.4, label: 'the manga wall', line: 'Forty volumes of one story, spines in order, one gap where volume nineteen should be. Everyone is looking for nineteen.' },
    { kind: 'counter', x: 12, y: 2.6, w: 4.4, h: 1.5, label: 'the counter' },
    {
      kind: 'crate', x: 2, y: 6, w: 3, h: 1.6, label: 'BACK ISSUES £1', colour: '#f0e6d8',
      action: { id: 'panels_dig', label: 'Dig through the longboxes', cost: 0, energy: -3, statXp: { stat: 'culture', amount: 3 }, line: 'An hour disappears. You come up with a water-damaged issue of something cancelled in 1994 and a strong opinion about it.' },
    },
    { kind: 'crate', x: 2, y: 9, w: 3, h: 1.6, label: 'INDIE', colour: '#f0e6d8' },
    { kind: 'shelf', x: 6.5, y: 6, w: 1.4, h: 4, label: 'the spinner rack' },
    { kind: 'poster', x: 15, y: 2.2, w: 1.4, h: 1, passable: true, label: 'the wall of covers', line: 'Signed, framed, and one of them is upside down on purpose. Ask Halle why. Then ask him to stop.' },
    { kind: 'armchair', x: 12, y: 8, w: 1.6, h: 1.6, label: 'the reading chair', line: 'One chair, one rule: buy something eventually.' },
    { kind: 'plant', x: 16, y: 10, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'comics_clerk', x: 14, y: 4.8, facing: 'down' },
    { stranger: 'collector', x: 4, y: 8.2, facing: 'up' },
    { x: 9.2, y: 5, facing: 'left' },
  ],
};

const GALLERY: InteriorDef = {
  venue: 'meridian_gallery',
  width: 22,
  height: 14,
  spawn: { x: 11, y: 11.4 },
  exit: { x: 11, y: 12.4 },
  palette: { wall: '#cfcbe0', trim: '#f3f0fb', glow: '#b48cff' },
  ceiling: 'mirror',
  floors: [{ kind: 'marble', x: 1, y: 2, w: 20, h: 11 }],
  props: [
    { kind: 'ring', x: 3, y: 0.2, w: 4, h: 1.5, passable: true },
    { kind: 'ring', x: 9, y: 0.1, w: 4, h: 1.6, passable: true },
    { kind: 'ring', x: 15, y: 0.2, w: 4, h: 1.5, passable: true },
    { kind: 'booth', x: 8.5, y: 5.2, w: 5, h: 1.4, colour: '#f3f0fb', label: 'the white sofa', line: 'A curved white sofa nobody dares sit on. Anselm sits on it. That is the whole point of Anselm.' },
    {
      kind: 'painting', x: 2, y: 2.3, w: 2.4, h: 1.2, label: 'Harbour, After', colour: '#2b5f7a',
      action: { id: 'gallery_harbour', label: 'Take it in', cost: 0, energy: -2, statXp: { stat: 'culture', amount: 4 }, line: 'Grey water, one orange buoy, and the feeling of a place after everyone has gone home. You stand there longer than you meant to.' },
    },
    {
      kind: 'painting', x: 5.5, y: 2.3, w: 2.4, h: 1.2, label: 'Study in Cadmium', colour: '#c9313f',
      action: { id: 'gallery_cadmium', label: 'Take it in', cost: 0, energy: -2, statXp: { stat: 'culture', amount: 4 }, line: 'Red on red on red. Up close it is a hundred colours. From the bench it is one shout.' },
    },
    {
      kind: 'painting', x: 9, y: 2.3, w: 2.4, h: 1.2, label: 'Untitled (Bus Stop)', colour: '#8fa3bd',
      action: { id: 'gallery_busstop', label: 'Take it in', cost: 0, energy: -2, statXp: { stat: 'culture', amount: 4 }, line: 'It is the bus stop on the main street. It is exactly the bus stop. You will never wait there the same way again.' },
    },
    {
      kind: 'painting', x: 12.5, y: 2.3, w: 2.4, h: 1.2, label: 'Meridian, 3 a.m.', colour: '#3a2a5a',
      action: { id: 'gallery_meridian', label: 'Take it in', cost: 0, energy: -2, statXp: { stat: 'culture', amount: 4 }, line: 'The square at night, the fountain lit, one figure on the bench. You check, and it is not you. Probably.' },
    },
    {
      kind: 'painting', x: 16, y: 2.3, w: 2.4, h: 1.2, label: 'Self-Portrait as a Weather System', colour: '#e2a03f',
      action: { id: 'gallery_weather', label: 'Take it in', cost: 0, energy: -2, statXp: { stat: 'culture', amount: 4 }, line: 'A face made of fronts and isobars. Anselm says it is the best thing in the building and she is right.' },
    },
    { kind: 'plinth', x: 5, y: 7, w: 1.4, h: 1.4, label: 'the sculpture', line: 'Bronze, small, a hand holding a smaller hand. The label says DO NOT TOUCH and the bronze is polished where everyone has.' },
    { kind: 'plinth', x: 15.6, y: 7, w: 1.4, h: 1.4, label: 'the other sculpture', line: 'A shopping trolley, cast in plaster, half sunk into the plinth. You have met this trolley.' },
    { kind: 'bench', x: 9.4, y: 8.6, w: 3.2, h: 1.2, colour: '#f3f0fb', label: 'the bench', line: 'White leather, no back, placed at exactly the distance the paintings want you to sit.' },
    {
      kind: 'counter', x: 18.5, y: 3, w: 2.6, h: 1.4, colour: '#f3f0fb', label: 'the desk',
      action: { id: 'gallery_postcard', label: 'Buy a postcard', cost: 3, statXp: { stat: 'culture', amount: 2 }, line: 'Harbour, After, in postcard form. You will not send it. It goes on the fridge and stays there for years.' },
    },
    { kind: 'lamp', x: 4, y: 5.6, w: 1, h: 1, passable: true },
    { kind: 'lamp', x: 17, y: 5.6, w: 1, h: 1, passable: true },
    { kind: 'plant', x: 1.2, y: 11, w: 1, h: 1 },
    { kind: 'plant', x: 20, y: 11, w: 1, h: 1 },
  ],
  stations: [
    { stranger: 'gallery_guide', x: 19.6, y: 5.2, facing: 'down' },
    { stranger: 'critic', x: 10.2, y: 4.6, facing: 'up' },
    { x: 3.2, y: 5, facing: 'up' },
    { x: 15, y: 9.8, facing: 'left' },
  ],
};

const MARKET: InteriorDef = {
  venue: 'fresh_market',
  width: 18,
  height: 13,
  spawn: { x: 9, y: 10.4 },
  exit: { x: 9, y: 11.4 },
  palette: { wall: '#160c26', trim: '#2e1a4d', glow: '#ff7ad9' },
  floors: [{ kind: 'tile', x: 1, y: 2, w: 16, h: 10 }],
  props: [
    { kind: 'led_strip', x: 1, y: 1.7, w: 16, h: 0.3, passable: true, colour: '#ff7ad9' },
    { kind: 'grow_rack', x: 1, y: 5.6, w: 1.2, h: 6, label: 'the grow wall', line: 'Six shelves of lettuce under purple light, roots in water, a label on every tray in handwriting. It hums.' },
    { kind: 'grow_rack', x: 15.8, y: 5.6, w: 1.2, h: 6 },
    {
      kind: 'fridge', x: 2, y: 2.4, w: 5, h: 1.4, label: 'the meal deals',
      action: { id: 'market_meal', label: 'Grab a meal deal', cost: 5, energy: 12, line: 'Sandwich, crisps, a drink that is mostly sugar. Eaten on the wall outside. Not a good meal; a great one.' },
    },
    { kind: 'fridge', x: 8, y: 2.4, w: 4, h: 1.4, label: 'the drinks fridge', line: 'Hums like it has something to say. Every energy drink in the world and one lonely oat milk.' },
    { kind: 'counter', x: 13, y: 2.6, w: 3.6, h: 1.5, label: 'the checkout', line: 'Unexpected item in bagging area. There is never an unexpected item. It just likes saying it.' },
    {
      kind: 'grow_rack', x: 3, y: 6, w: 3, h: 1.6, label: 'the grow racks',
      action: { id: 'market_groceries', label: 'Buy greens', cost: 9, energy: 6, statXp: { stat: 'fitness', amount: 3 }, line: 'Greens cut from the rack while you wait, still wet. A whole plan for the week. You feel like an adult for the length of the walk home.' },
    },
    { kind: 'produce', x: 5.8, y: 6, w: 2.8, h: 1.6, label: 'the good bread', colour: '#d8b06a', line: 'Baked round the corner, gone by ten. If there is one left, it is a sign.' },
    { kind: 'shelf', x: 10.5, y: 6, w: 1.4, h: 4, colour: '#3b4a5a', label: 'the tinned aisle', line: 'Beans, more beans, and one tin of something with a fish on it that has been here since you moved in.' },
    { kind: 'shelf', x: 13.5, y: 6, w: 1.4, h: 4, colour: '#3b4a5a' },
    {
      kind: 'produce', x: 2.6, y: 9, w: 2.8, h: 1.6, label: 'the flowers', colour: '#ff9ac2',
      action: { id: 'market_flowers', label: 'Buy flowers', cost: 7, statXp: { stat: 'charm', amount: 4 }, line: 'Something yellow, wrapped in paper. You carry them down the street and three strangers smile at you for no reason.' },
    },
    { kind: 'crate', x: 5.8, y: 9, w: 2.8, h: 1.6, label: 'REDUCED', colour: '#e2a03f', line: 'Yellow stickers. A pineapple for eleven pence. A whole cake, slightly wrong.' },
    { kind: 'poster', x: 16, y: 2.2, w: 1.4, h: 1, passable: true, label: 'the noticeboard', line: 'Guitar lessons, a lost tortoise, and a card that just says CALL ME with a number and no name.' },
  ],
  stations: [
    { stranger: 'checkout', x: 14.6, y: 4.8, facing: 'down' },
    { stranger: 'shopper', x: 5.5, y: 8.2, facing: 'up' },
    { x: 12.4, y: 8, facing: 'left' },
  ],
};

export const INTERIORS: Readonly<Record<InteriorId, InteriorDef>> = {
  neon_last_call: BAR,
  margin_notes: BOOKSHOP,
  ironhaus: GYM,
  copper_kettle: CAFE,
  static_records: RECORDS,
  nightjar: NIGHTJAR,
  akai: AKAI,
  slurp: SLURP,
  pixel_palace: ARCADE,
  panels: COMICS,
  meridian_gallery: GALLERY,
  fresh_market: MARKET,
};
