import type { PlayerState } from '@/types/player';
import { readCueClarity } from '@/engine/traits';
import { BALANCE } from '@/config/gameConfig';

/**
 * How much of her state the player can actually see.
 *
 *  hidden   — nothing but her face and what she does with her hands
 *  vague    — a word for how it is going
 *  coarse   — five-segment bars, no numbers
 *  precise  — numbers, and whether the last thing helped
 *  analytic — numbers plus why
 */
export type MeterVisibility = 'hidden' | 'vague' | 'coarse' | 'precise' | 'analytic';

const BY_LEVEL: readonly MeterVisibility[] = ['hidden', 'vague', 'coarse', 'precise', 'analytic'];

export const AWARENESS_BLURBS: readonly string[] = [
  'You cannot read a room to save your life. Watch her face and guess.',
  'You are starting to notice the difference between polite and interested.',
  'You can feel roughly where you stand, if not the numbers.',
  'You read tone, timing and the pause before an answer.',
  'You can see the whole conversation from above, and why each line landed.',
];

/** Perks and flaws shift how legible she is, on top of the awareness level. */
export function effectiveAwareness(player: PlayerState): number {
  const level = player.awareness.level + readCueClarity(player);
  return Math.max(0, Math.min(BALANCE.awareness.maxLevel, level));
}

export function meterVisibility(player: PlayerState, alwaysShowMeters: boolean): MeterVisibility {
  if (alwaysShowMeters) return 'precise';
  return BY_LEVEL[effectiveAwareness(player)] ?? 'hidden';
}

const INTEREST_WORDS: readonly string[] = [
  'She is not sold on you',
  'She is listening',
  'She is enjoying this',
  'She is very much in this conversation',
];

const COMFORT_WORDS: readonly string[] = [
  'She is on edge',
  'She is guarded',
  'She is relaxed',
  'She is completely at ease',
];

function bucketOf(value: number): number {
  if (value < 25) return 0;
  if (value < 50) return 1;
  if (value < 75) return 2;
  return 3;
}

export interface MeterReadout {
  visibility: MeterVisibility;
  /** Words, from 'vague' up. */
  label: string | null;
  /** 0-4 segments, from 'coarse' up. */
  segments: number | null;
  /** The number, from 'precise' up. */
  value: number | null;
  /** '+3' / '-2', from 'precise' up; an arrow at 'coarse'. */
  delta: string | null;
}

function readMeter(
  value: number,
  delta: number,
  visibility: MeterVisibility,
  words: readonly string[],
): MeterReadout {
  const bucket = bucketOf(value);
  const rounded = Math.round(delta);
  switch (visibility) {
    case 'hidden':
      return { visibility, label: null, segments: null, value: null, delta: null };
    case 'vague':
      return { visibility, label: words[bucket] ?? null, segments: null, value: null, delta: null };
    case 'coarse':
      return {
        visibility,
        label: words[bucket] ?? null,
        segments: Math.max(1, Math.ceil(value / 20)),
        value: null,
        delta: rounded === 0 ? null : rounded > 0 ? 'up' : 'down',
      };
    default:
      return {
        visibility,
        label: words[bucket] ?? null,
        segments: Math.max(1, Math.ceil(value / 20)),
        value: Math.round(value),
        delta: rounded === 0 ? null : rounded > 0 ? `+${rounded}` : `${rounded}`,
      };
  }
}

export function readInterest(value: number, delta: number, visibility: MeterVisibility): MeterReadout {
  return readMeter(value, delta, visibility, INTEREST_WORDS);
}

export function readComfort(value: number, delta: number, visibility: MeterVisibility): MeterReadout {
  return readMeter(value, delta, visibility, COMFORT_WORDS);
}

/** Only the top level gets to see the reasons behind a swing. */
export function showsReasons(visibility: MeterVisibility): boolean {
  return visibility === 'analytic';
}
