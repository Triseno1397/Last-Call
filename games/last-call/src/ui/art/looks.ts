/**
 * Turning game data into something drawable.
 *
 * The engine knows a player has `hairColor: 'crimson'` and `vibe: 'dive_bar'`;
 * the renderer needs hex. This is the one place that translation happens, so
 * adding an appearance option means adding a row here and nothing else — the
 * sprite code never learns what a vibe is.
 */
import type { CharacterDef } from '@/types/character';
import type { Appearance } from '@/types/player';
import type { Gender } from '@/content/ids';
import type { CharacterLook } from '@/ui/art/sprite';
import { EYE_COLORS, HAIR_COLORS } from '@/content/appearance';

const SKIN = '#e8c4a8';

/** What each starting vibe actually puts on. */
const VIBE_OUTFITS: Readonly<Record<string, { top: string; bottom: string; accent: string }>> = {
  gallery: { top: '#2b2440', bottom: '#15122a', accent: '#e4d9ff' },
  dive_bar: { top: '#3a1f2b', bottom: '#1b1622', accent: '#ff5fa8' },
  six_am: { top: '#14323a', bottom: '#101c22', accent: '#4fd6ff' },
  vinyl: { top: '#2d3320', bottom: '#191c14', accent: '#ffce6b' },
  late_train: { top: '#1d2740', bottom: '#12161f', accent: '#8fa3bd' },
};

function swatch(list: readonly { id: string; swatch?: string }[], id: string, fallback: string): string {
  return list.find((option) => option.id === id)?.swatch ?? fallback;
}

function darken(colour: string, factor = 0.58): string {
  const hex = colour.replace('#', '');
  if (hex.length !== 6) return colour;
  // Clamped at both ends: `factor` above 1 is used to brighten a trim colour.
  const dim = (from: number) =>
    Math.min(255, Math.max(0, Math.round(Number.parseInt(hex.slice(from, from + 2), 16) * factor)))
      .toString(16)
      .padStart(2, '0');
  return `#${dim(0)}${dim(2)}${dim(4)}`;
}

/** The player, as they built themselves in creation. */
export function playerLook(appearance: Appearance, gender: Gender): CharacterLook {
  const hair = swatch(HAIR_COLORS, appearance.hairColor, '#141326');
  const outfit = VIBE_OUTFITS[appearance.vibe] ?? VIBE_OUTFITS['dive_bar']!;
  return {
    hairStyle: appearance.hairStyle,
    hair,
    hairShadow: darken(hair),
    skin: SKIN,
    eyes: swatch(EYE_COLORS, appearance.eyeColor, '#e2a03f'),
    top: outfit.top,
    bottom: outfit.bottom,
    accent: outfit.accent,
    build: appearance.build,
    gender,
  };
}

/** Hair styles for the women, keyed off their existing palettes. */
const CHARACTER_HAIR: Readonly<Record<string, string>> = {
  sable: 'long_tie_up',
  wren: 'curtains',
  nadia: 'undercut',
};

const CHARACTER_BUILD: Readonly<Record<string, string>> = {
  sable: 'lean',
  wren: 'soft',
  nadia: 'athletic',
};

/**
 * One of the three, in whichever outfit she is wearing. The outfit's palette
 * already exists for the portrait; this reuses it rather than inventing a
 * second wardrobe.
 */
export function characterLook(character: CharacterDef, outfitId?: string): CharacterLook {
  const outfit = character.outfits.find((entry) => entry.id === outfitId) ?? character.outfits[0];
  return {
    hairStyle: CHARACTER_HAIR[character.id] ?? 'messy_waves',
    hair: character.palette.hair,
    hairShadow: character.palette.hairShadow,
    skin: character.palette.skin,
    eyes: character.palette.eyes,
    top: outfit?.palette.primary ?? '#2a2338',
    bottom: outfit?.palette.secondary ?? '#1b1622',
    accent: outfit?.palette.accent ?? character.palette.accent,
    build: CHARACTER_BUILD[character.id] ?? 'lean',
    gender: 'woman',
  };
}

/** Background extras, varied enough that the street does not look cloned. */
const EXTRA_HAIR = ['messy_waves', 'buzz', 'slicked_back', 'curtains', 'long_tie_up', 'undercut'] as const;
const EXTRA_HAIR_COLOURS = ['#141326', '#3b2a1c', '#b9c2d6', '#2a1f3a', '#5a3a2a', '#243a8f'] as const;
const EXTRA_BUILDS = ['lean', 'athletic', 'broad', 'soft'] as const;

/**
 * A passer-by. Derived from an index rather than randomly, so the same extra
 * looks the same every frame and every visit.
 */
export function extraLook(index: number, coat: string): CharacterLook {
  const hair = EXTRA_HAIR_COLOURS[index % EXTRA_HAIR_COLOURS.length]!;
  return {
    hairStyle: EXTRA_HAIR[index % EXTRA_HAIR.length]!,
    hair,
    hairShadow: darken(hair),
    skin: index % 3 === 0 ? '#c99a78' : index % 3 === 1 ? '#e8c4a8' : '#8d6248',
    eyes: '#4a3a52',
    top: coat,
    bottom: darken(coat, 0.7),
    accent: darken(coat, 1.25),
    build: EXTRA_BUILDS[index % EXTRA_BUILDS.length]!,
    gender: index % 2 === 0 ? 'man' : 'woman',
  };
}
