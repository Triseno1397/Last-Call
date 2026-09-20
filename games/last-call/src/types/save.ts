import type { GameState } from '@/types/game';

/** Bump when the shape of GameState changes; add a migration alongside it. */
export const SAVE_VERSION = 1;

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: GameState;
}

export type LoadResult =
  | { ok: true; state: GameState; migratedFrom: number | null }
  | { ok: false; reason: string };
