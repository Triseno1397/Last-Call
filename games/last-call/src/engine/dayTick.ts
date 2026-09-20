import type { GameState, LogEntry } from '@/types/game';
import type { Rng } from '@/types/core';
import { maybeIncomingTexts } from '@/engine/phone';
import { resolveMissedDates } from '@/engine/dates';

/**
 * Everything that happens between days: dates the player did not turn up to,
 * and characters who decide to text first.
 */
export function onDayRolled(state: GameState, rng: Rng): { state: GameState; entries: readonly LogEntry[] } {
  const missed = resolveMissedDates(state, rng);
  const texts = maybeIncomingTexts(missed.state, rng);
  return { state: texts.state, entries: [...missed.entries, ...texts.entries] };
}
