import type { AppearanceChoice } from '@/types/player';

/**
 * Placeholder-art friendly appearance options. Each choice carries a swatch the
 * CSS portrait uses now; final art keys off the same ids (see docs/ART_GUIDE.md).
 */
export const HAIR_STYLES: readonly AppearanceChoice[] = [
  { id: 'undercut', name: 'Undercut' },
  { id: 'messy_waves', name: 'Messy waves' },
  { id: 'slicked_back', name: 'Slicked back' },
  { id: 'long_tie_up', name: 'Long, tied up' },
  { id: 'buzz', name: 'Buzz cut' },
  { id: 'curtains', name: 'Curtain bangs' },
];

export const HAIR_COLORS: readonly AppearanceChoice[] = [
  { id: 'jet', name: 'Jet black', swatch: '#141326' },
  { id: 'midnight', name: 'Midnight blue', swatch: '#243a8f' },
  { id: 'ash', name: 'Ash silver', swatch: '#b9c2d6' },
  { id: 'crimson', name: 'Crimson', swatch: '#b5273f' },
  { id: 'sand', name: 'Sandy blond', swatch: '#d8b06a' },
  { id: 'mint', name: 'Mint', swatch: '#7fd6bd' },
];

export const EYE_COLORS: readonly AppearanceChoice[] = [
  { id: 'amber', name: 'Amber', swatch: '#e2a03f' },
  { id: 'violet', name: 'Violet', swatch: '#9a6bff' },
  { id: 'emerald', name: 'Emerald', swatch: '#3fbf85' },
  { id: 'steel', name: 'Steel grey', swatch: '#8fa3bd' },
  { id: 'hazel', name: 'Hazel', swatch: '#a87545' },
];

export const BUILDS: readonly AppearanceChoice[] = [
  { id: 'lean', name: 'Lean' },
  { id: 'athletic', name: 'Athletic' },
  { id: 'broad', name: 'Broad' },
  { id: 'soft', name: 'Soft' },
];

export const VIBES: readonly AppearanceChoice[] = [
  { id: 'gallery', name: 'Gallery opening' },
  { id: 'dive_bar', name: 'Back of the dive bar' },
  { id: 'six_am', name: 'Gym at six a.m.' },
  { id: 'vinyl', name: 'Vinyl shop clerk' },
  { id: 'late_train', name: 'Last train home' },
];

export const DEFAULT_APPEARANCE = {
  hairStyle: 'messy_waves',
  hairColor: 'jet',
  eyeColor: 'amber',
  build: 'lean',
  vibe: 'dive_bar',
} as const;
