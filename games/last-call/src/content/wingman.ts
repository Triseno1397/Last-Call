import type { CharacterId } from '@/content/ids';

/**
 * Dez — the wingman. Not a romance option, and the game does not treat him as
 * one. He knows this city, he knows these three women socially, and he is
 * wrong about roughly a third of what he says with total confidence.
 */
export const WINGMAN = {
  id: 'dez' as const,
  name: 'Dez',
  age: 34,
  gender: 'man' as const,
  bio: 'Knows everyone, remembers nothing important, turns up when it matters.',
  /** Where and when he can be found, for the bar assist. */
  atVenue: 'neon_last_call' as const,
  nights: ['fri', 'sat'] as const,
};

export interface WingmanTip {
  id: string;
  about: CharacterId;
  /** What the tip reveals, in his voice. */
  text: string;
  /** Fact id it unlocks in her contact card, if any. */
  unlocksFact?: string;
}

export const WINGMAN_TIPS: readonly WingmanTip[] = [
  {
    id: 'tip_sable_lines',
    about: 'sable',
    text: "Sable? Mate. She has heard every line in that building, twice, and once from me. Don't perform. Ask her something real and then actually listen to the answer.",
  },
  {
    id: 'tip_sable_schedule',
    about: 'sable',
    text: "She's on Wednesday through Saturday. Thursdays are quieter — you'll get more than four seconds of her.",
  },
  {
    id: 'tip_sable_cooks',
    about: 'sable',
    text: 'She cooks when she gets in, like three in the morning. Ask her about food, not about the bar.',
    unlocksFact: 'sable_cooks',
  },
  {
    id: 'tip_wren_flattery',
    about: 'wren',
    text: "The one in the bookshop — Wren. Do not compliment her looks, she short-circuits. Compliment an opinion and she'll talk to you for an hour.",
  },
  {
    id: 'tip_wren_lying',
    about: 'wren',
    text: "Whatever you do, don't pretend you've read something. She does that for a living. She will ask you what colour the cover is.",
  },
  {
    id: 'tip_wren_sunday',
    about: 'wren',
    text: 'She climbs Sundays, upstairs at Ironhaus. Completely different person with chalk on her hands.',
    unlocksFact: 'wren_climbs',
  },
  {
    id: 'tip_nadia_smalltalk',
    about: 'nadia',
    text: "Nadia gets bored in about a line and a half. Skip the weather. Give her something to win.",
  },
  {
    id: 'tip_nadia_physio',
    about: 'nadia',
    text: "She's a physio. Do not explain her own knee to her. I did that. Once.",
    unlocksFact: 'nadia_physio',
  },
  {
    id: 'tip_nadia_friday',
    about: 'nadia',
    text: "Fridays she's at Last Call, off the gym floor, entirely different energy. Also she and Sable are close, so behave.",
  },
];

export const WINGMAN_GENERIC: readonly string[] = [
  "Rule one: if she's working, she's working. Read the room before you read your line.",
  "You don't need a better opener, you need to stop planning the second sentence while she's saying hers.",
  "Getting turned down is fine. Getting turned down and then sulking about it is the part people remember.",
];

/** What Dez says when he comes over at the bar. */
export const WINGMAN_ASSIST: readonly string[] = [
  'Dez arrives with three drinks and an anecdote that makes you look good by accident.',
  'Dez leans in, says something short to her, and leaves at exactly the right moment.',
  'Dez does the introduction properly, which is the only thing he is reliably excellent at.',
];
