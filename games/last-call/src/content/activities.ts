import type { ActivityId, BaseActivityId } from '@/content/ids';
import type { ActivityDef } from '@/types/activities';
import { HOBBY_LIST } from '@/content/hobbies';
import { VENUE_LIST } from '@/content/venues';
import { WARDROBE_LIST } from '@/content/lifestyle';
import { WEEKDAYS } from '@/types/core';

/**
 * Hand-authored activities. Practice / shopping / night-out activities are
 * generated below from hobby, wardrobe and venue data, so adding one of those
 * only means adding the data.
 */
const BASE_ACTIVITIES: Readonly<Record<BaseActivityId, ActivityDef>> = {
  work_shift: {
    id: 'work_shift',
    name: 'Work a shift',
    blurb: 'Money arrives. Dignity is negotiable.',
    category: 'career',
    tags: ['work'],
    cost: { slots: 1, energy: 0, money: 0 },
    requirements: [{ kind: 'day', days: WEEKDAYS }],
    effects: [{ kind: 'careerXp', amount: 26 }],
    usesJobPay: true,
    flavour: [
      'You did the thing. They paid you for the thing.',
      'Four hours of competence, one hour of staring at a wall. Standard.',
      'A coworker told you a story about their landlord that will outlive you both.',
    ],
  },
  overtime: {
    id: 'overtime',
    name: 'Pull a double',
    blurb: 'Two slots, better pay, and the personality of a damp towel afterwards.',
    category: 'career',
    tags: ['work'],
    cost: { slots: 2, energy: 12, money: 0 },
    requirements: [{ kind: 'day', days: WEEKDAYS }],
    effects: [{ kind: 'careerXp', amount: 68 }],
    usesJobPay: true,
    flavour: [
      'Your manager said "you are a machine" which is not the compliment they think it is.',
      'You have earned money and lost an evening. The city will survive without you.',
    ],
  },
  gym_session: {
    id: 'gym_session',
    name: 'Train at Ironhaus',
    blurb: 'Headphones in, no talking, nothing but you and the plates.',
    category: 'self',
    tags: ['physical', 'solo'],
    cost: { slots: 1, energy: 26, money: 0 },
    requirements: [],
    effects: [
      { kind: 'statXp', stat: 'fitness', amount: 46 },
      { kind: 'statXp', stat: 'confidence', amount: 12 },
    ],
    flavour: [
      'You left with the specific smugness of someone who did the last set properly.',
      'You caught yourself in the mirror and did not immediately look away. Progress.',
    ],
  },
  improv_class: {
    id: 'improv_class',
    name: 'Improv class',
    blurb: 'A church basement, eleven adults, and the phrase "yes, and" said far too often.',
    category: 'self',
    tags: ['social', 'creative'],
    cost: { slots: 1, energy: 20, money: 28 },
    requirements: [{ kind: 'slot', slots: ['evening'] }],
    effects: [
      { kind: 'statXp', stat: 'humor', amount: 42 },
      { kind: 'statXp', stat: 'charm', amount: 16 },
      { kind: 'statXp', stat: 'confidence', amount: 14 },
      { kind: 'awarenessXp', amount: 12 },
    ],
    flavour: [
      'You played a divorced lighthouse. The room went up. You will think about this for days.',
      'A man named Dennis would not stop adding aliens to every scene. You survived Dennis.',
    ],
  },
  read_a_book: {
    id: 'read_a_book',
    name: 'Read',
    blurb: 'Eighty pages and one opinion you can now deploy in public.',
    category: 'self',
    tags: ['study', 'solo'],
    cost: { slots: 1, energy: 10, money: 0 },
    requirements: [],
    effects: [
      { kind: 'statXp', stat: 'culture', amount: 38 },
      { kind: 'awarenessXp', amount: 8 },
    ],
    flavour: [
      'You underlined a sentence like you are the kind of person who underlines sentences.',
      'Two chapters in you realised you have been reading the same paragraph since the radiator started.',
    ],
  },
  barber: {
    id: 'barber',
    name: 'Barber',
    blurb: 'Forty-five minutes of someone touching your hair and asking about your holidays.',
    category: 'lifestyle',
    tags: ['grooming', 'spending'],
    cost: { slots: 1, energy: 5, money: 45 },
    requirements: [],
    effects: [
      { kind: 'statXp', stat: 'style', amount: 22 },
      { kind: 'statXp', stat: 'confidence', amount: 8 },
      { kind: 'temporaryStatBonus', stat: 'style', amount: 6, days: 7, label: 'Fresh Cut' },
    ],
    flavour: [
      'You look like the version of yourself that answers emails on time.',
      'The barber held up the mirror. You nodded like you could see the back. You could not.',
    ],
  },
  rest: {
    id: 'rest',
    name: 'Rest',
    blurb: 'Doing nothing, on purpose, without checking your phone. Allegedly.',
    category: 'rest',
    tags: ['restful', 'solo'],
    cost: { slots: 1, energy: 0, money: 0 },
    requirements: [],
    effects: [{ kind: 'energy', amount: 25 }],
    flavour: [
      'You watched most of a film and all of a ceiling.',
      'A nap that lasted exactly long enough to ruin the evening in the best way.',
    ],
  },
  wander_the_city: {
    id: 'wander_the_city',
    name: 'Wander the city',
    blurb: 'No destination. Good coat. Mild main-character energy.',
    category: 'self',
    tags: ['solo', 'social'],
    cost: { slots: 1, energy: 12, money: 8 },
    requirements: [],
    effects: [
      { kind: 'statXp', stat: 'culture', amount: 14 },
      { kind: 'statXp', stat: 'style', amount: 10 },
      { kind: 'awarenessXp', amount: 16 },
    ],
    flavour: [
      'You found a bakery you will never find again and a bench worth remembering.',
      'Two strangers had an entire argument about a dog in front of you. You have chosen a side.',
      'You watched the light go orange on the tall buildings and felt fine about everything.',
    ],
  },
};

/** One practice activity per hobby. */
const PRACTICE_ACTIVITIES: readonly ActivityDef[] = HOBBY_LIST.map((hobby) => ({
  id: `practice_${hobby.id}` as ActivityId,
  name: `Practice ${hobby.name.toLowerCase()}`,
  blurb: hobby.blurb,
  category: 'self',
  tags: hobby.id === 'climbing' || hobby.id === 'salsa' ? ['physical', 'creative'] : ['creative', 'solo'],
  cost: { slots: 1, energy: 16, money: hobby.id === 'cooking' ? 18 : 0 },
  requirements: [],
  effects: [
    { kind: 'hobbyXp', hobby: hobby.id, amount: 42 },
    { kind: 'statXp', stat: hobby.affinity, amount: 18 },
  ],
  flavour: [
    `Not good yet. Closer than last week.`,
    `You lost ninety minutes and found them again somewhere better.`,
  ],
}));

/** One purchase activity per wardrobe item that costs money. */
const SHOP_ACTIVITIES: readonly ActivityDef[] = WARDROBE_LIST.filter((item) => item.price > 0).map(
  (item) => ({
    id: `shop_${item.id}` as ActivityId,
    name: `Buy: ${item.name}`,
    blurb: item.blurb,
    category: 'lifestyle',
    tags: ['spending', 'grooming'],
    cost: { slots: 1, energy: 8, money: item.price },
    requirements: [{ kind: 'flag', flag: `owns_${item.id}`, value: false }],
    effects: [
      { kind: 'unlockWardrobe', item: item.id },
      { kind: 'setFlag', flag: `owns_${item.id}`, value: true },
      { kind: 'statXp', stat: 'style', amount: 16 },
    ],
    flavour: [
      'The changing-room mirror lied in your favour and you accepted it.',
      'You wore it out of the shop. Obviously you wore it out of the shop.',
    ],
  }),
);

/** One night-out activity per venue. Phase 2 hands these off to encounters. */
const VENUE_ACTIVITIES: readonly ActivityDef[] = VENUE_LIST.map((venue) => ({
  id: `go_out_${venue.id}` as ActivityId,
  name: `Go to ${venue.name}`,
  blurb: venue.tagline,
  category: 'social',
  tags: venue.pace === 'fast' ? ['social', 'nightlife'] : ['social'],
  cost: { slots: 1, energy: venue.energyCost, money: venue.entryCost },
  requirements: [
    { kind: 'day', days: venue.openDays },
    { kind: 'slot', slots: venue.openSlots },
  ],
  effects: [
    { kind: 'visitVenue', venue: venue.id },
    { kind: 'statXp', stat: 'charm', amount: 14 },
    { kind: 'statXp', stat: 'confidence', amount: 10 },
    { kind: 'awarenessXp', amount: 18 },
  ],
  flavour: venue.atmosphere,
  venue: venue.id,
}));

export const ACTIVITIES: Readonly<Record<ActivityId, ActivityDef>> = Object.fromEntries(
  [...Object.values(BASE_ACTIVITIES), ...PRACTICE_ACTIVITIES, ...SHOP_ACTIVITIES, ...VENUE_ACTIVITIES].map(
    (activity) => [activity.id, activity],
  ),
) as Record<ActivityId, ActivityDef>;

export const ACTIVITY_LIST: readonly ActivityDef[] = Object.values(ACTIVITIES);

export function getActivity(id: ActivityId): ActivityDef {
  const activity = ACTIVITIES[id];
  if (!activity) throw new Error(`Unknown activity: ${id}`);
  return activity;
}
