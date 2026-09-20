import type { HobbyId } from '@/content/ids';
import type { HobbyDef } from '@/types/activities';

export const HOBBIES: Readonly<Record<HobbyId, HobbyDef>> = {
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    blurb: 'Four chords, one capo, and the restraint not to play Wonderwall.',
    affinity: 'culture',
    sharedInterestLine: 'plays guitar badly on purpose',
  },
  cooking: {
    id: 'cooking',
    name: 'Cooking',
    blurb: 'You can feed someone properly. This is an unfair advantage.',
    affinity: 'charm',
    sharedInterestLine: 'cooks for people as a love language',
  },
  salsa: {
    id: 'salsa',
    name: 'Salsa',
    blurb: 'Two months of classes and you can now be confidently wrong in rhythm.',
    affinity: 'confidence',
    sharedInterestLine: 'dances, and will drag you into it',
  },
  climbing: {
    id: 'climbing',
    name: 'Climbing',
    blurb: 'Hanging off a wall by your fingertips, yelling encouragement at a stranger.',
    affinity: 'fitness',
    sharedInterestLine: 'climbs, mostly for the problem-solving',
  },
  photography: {
    id: 'photography',
    name: 'Photography',
    blurb: 'You notice light now. It has ruined walking anywhere on time.',
    affinity: 'style',
    sharedInterestLine: 'shoots film and refuses to explain why',
  },
};

export const HOBBY_LIST: readonly HobbyDef[] = Object.values(HOBBIES);
