/**
 * Starting without filling in a form.
 *
 * Character creation is a screen some people want and most do not. This rolls
 * a complete, valid set of choices so the title screen can drop you straight
 * onto the street — the creation screen stays for anyone who asks for it, but
 * it is no longer the toll gate on the way into the game.
 *
 * Everything it produces must satisfy `validateCreation`; the unit tests hold
 * it to that, so a new perk or hobby cannot quietly break the fast path.
 */
import type { CreationChoices } from '@/engine/newGame';
import type { Appearance } from '@/types/player';
import {
  BUILDS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  VIBES,
} from '@/content/appearance';
import { FLAW_IDS, GENDERS, HOBBY_IDS, PERK_IDS } from '@/content/ids';
import { PERKS_TO_PICK } from '@/engine/newGame';

/** Names that fit a bar tab and do not imply anyone in particular. */
const NAMES: readonly string[] = [
  'Alex',
  'Sam',
  'Rory',
  'Jesse',
  'Kai',
  'Robin',
  'Frankie',
  'Ellis',
  'Charlie',
  'Nico',
  'Quinn',
  'Sasha',
];

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)] ?? list[0]!;
}

/** Two different perks, drawn without replacement. */
function pickPerks(random: () => number): readonly (typeof PERK_IDS)[number][] {
  const pool = [...PERK_IDS];
  const chosen: (typeof PERK_IDS)[number][] = [];
  while (chosen.length < PERKS_TO_PICK && pool.length > 0) {
    const [taken] = pool.splice(Math.floor(random() * pool.length), 1);
    if (taken) chosen.push(taken);
  }
  return chosen;
}

export function randomAppearance(random: () => number = Math.random): Appearance {
  return {
    hairStyle: pick(HAIR_STYLES, random).id,
    hairColor: pick(HAIR_COLORS, random).id,
    eyeColor: pick(EYE_COLORS, random).id,
    build: pick(BUILDS, random).id,
    vibe: pick(VIBES, random).id,
  };
}

/**
 * A whole character, ready to play. `random` is injectable so the tests can
 * sweep every seed rather than trusting one lucky roll.
 */
export function randomCreation(random: () => number = Math.random): CreationChoices {
  return {
    name: pick(NAMES, random),
    gender: pick(GENDERS, random),
    appearance: randomAppearance(random),
    perks: pickPerks(random),
    flaw: pick(FLAW_IDS, random),
    startingHobby: pick(HOBBY_IDS, random),
  };
}
