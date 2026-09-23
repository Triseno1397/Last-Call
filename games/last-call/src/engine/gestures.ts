/**
 * Things you can do for her, beyond saying something.
 *
 * Buying a drink, ordering dinner, putting a coin in the machine and handing
 * her the other controller: the small acts a place makes possible. Each one
 * costs money and is handed to the conversation as something he *did*, so
 * the same engine that scores what he says scores what he does — with a
 * model it reacts in her voice; without one, she has an authored reaction and
 * a fixed nudge to interest and comfort.
 *
 * Gestures are keyed by the interior you are standing in, so the bar offers a
 * drink and the restaurant offers dinner, and the street offers nothing.
 */
import type { InteriorId } from '@/content/city';
import type { EncounterState } from '@/types/dialogue';

export interface GestureDef {
  id: string;
  /** Button label. */
  label: string;
  cost: number;
  /** What the model is told he did, in third person, as a stage direction. */
  did: string;
  /** Her scripted reaction, when no model is running. */
  reaction: string;
  /** The fixed nudge in scripted mode. Comfort can go down: it is presumptuous. */
  interestDelta: number;
  comfortDelta: number;
}

export const GESTURES: Readonly<Record<string, GestureDef>> = {
  buy_drink: {
    id: 'buy_drink',
    label: 'Buy her a drink',
    cost: 9,
    did: '*buys her a drink — whatever she was drinking — and slides it over without making a thing of it*',
    reaction: 'She looks at the glass, then at you, and lets you have the half-smile. "Presumptuous. Correct, but presumptuous."',
    interestDelta: 5,
    comfortDelta: 2,
  },
  buy_cocktail: {
    id: 'buy_cocktail',
    label: 'Order her a cocktail',
    cost: 14,
    did: '*asks the bartender to make her whatever he thinks she would like, and lets her watch him do it*',
    reaction: 'She watches Lucian work, then watches you watching. "You let him choose. That is either confidence or cowardice and I have decided it is confidence."',
    interestDelta: 6,
    comfortDelta: 1,
  },
  buy_dinner: {
    id: 'buy_dinner',
    label: "Get dinner — she's not paying",
    cost: 40,
    did: '*tells Sofia the two of them are eating, and that the bill is his, before she can object*',
    reaction: 'She raises an eyebrow that could mean anything and orders the special. "I will let you, this once. I am keeping count."',
    interestDelta: 7,
    comfortDelta: 3,
  },
  buy_coffee: {
    id: 'buy_coffee',
    label: 'Get her a coffee',
    cost: 4,
    did: '*comes back from the counter with two coffees and puts one down in front of her, no questions asked*',
    reaction: 'She wraps both hands round the cup. "You guessed right. Do not let it go to your head."',
    interestDelta: 3,
    comfortDelta: 3,
  },
  arcade_round: {
    id: 'arcade_round',
    label: 'Challenge her to a round',
    cost: 2,
    did: '*drops two tokens in the cabinet and hands her the second controller*',
    reaction: 'She takes it without looking, picks the small fast character, and beats you in forty seconds. "Again. I want to see if that was luck."',
    interestDelta: 6,
    comfortDelta: 4,
  },
};

/** Which gestures a place makes possible. */
export const GESTURES_BY_PLACE: Readonly<Partial<Record<InteriorId, readonly string[]>>> = {
  neon_last_call: ['buy_drink'],
  nightjar: ['buy_cocktail'],
  basilico: ['buy_dinner'],
  copper_kettle: ['buy_coffee'],
  margin_notes: ['buy_coffee'],
  pixel_palace: ['arcade_round'],
};

export function gesturesFor(place: InteriorId | null): readonly GestureDef[] {
  if (!place) return [];
  return (GESTURES_BY_PLACE[place] ?? []).map((id) => GESTURES[id]!).filter(Boolean);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Her scripted reaction to a gesture, applied straight to the conversation.
 * Only used when there is no model to ask; with one, the gesture is sent as a
 * turn and she answers in her own words.
 */
export function applyScriptedGesture(encounter: EncounterState, gesture: GestureDef): EncounterState {
  return {
    ...encounter,
    interest: clamp(encounter.interest + gesture.interestDelta),
    comfort: clamp(encounter.comfort + gesture.comfortDelta),
    lastInterestDelta: gesture.interestDelta,
    lastComfortDelta: gesture.comfortDelta,
    line: gesture.reaction,
    cue: null,
    beats: [
      ...encounter.beats,
      { speaker: 'you', text: gesture.did.replace(/\*/g, '') },
      { speaker: 'her', text: gesture.reaction, cue: null },
    ],
    busy: false,
  };
}
