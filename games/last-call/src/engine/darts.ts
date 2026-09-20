import type { PlayerState } from '@/types/player';
import { effectiveStat } from '@/engine/progression';

/**
 * Darts at the bar. Pure scoring so it can be tested and so the UI can be
 * swapped (timing bar now, something better later).
 *
 * `accuracy` is 0 at the centre of the target and 1 at the far edge.
 */
export const DARTS_THROWS = 3;

/** Fitness steadies the hand, confidence stops the second-guessing. */
export function sweetSpot(player: PlayerState): number {
  const fitness = effectiveStat(player, 'fitness');
  const confidence = effectiveStat(player, 'confidence');
  return 0.1 + ((fitness + confidence) / 2 / 100) * 0.22;
}

export function scoreThrow(accuracy: number, player: PlayerState): number {
  const spot = sweetSpot(player);
  const distance = Math.abs(accuracy);
  if (distance <= spot * 0.35) return 60;
  if (distance <= spot) return 40;
  if (distance <= spot * 2) return 20;
  if (distance <= spot * 3.2) return 10;
  return 0;
}

export const MAX_DARTS_SCORE = 60 * DARTS_THROWS;

/** Interest bonus carried into the next conversation, 0-4. */
export function dartsBonus(total: number): number {
  return Math.round((total / MAX_DARTS_SCORE) * 4 * 10) / 10;
}

export function dartsVerdict(total: number): string {
  if (total >= 150) return 'Three in the middle. Someone at the bar said "oh, come on".';
  if (total >= 100) return 'Respectable. You did the little nod. Everyone saw the little nod.';
  if (total >= 50) return 'Two good, one that went where darts do not go.';
  if (total > 0) return 'You hit the board. Technically. Legally.';
  return 'You have apologised to the wall. Gary would understand.';
}
