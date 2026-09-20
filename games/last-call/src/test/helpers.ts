import type { FlawId, PerkId } from '@/content/ids';
import type { GameState } from '@/types/game';
import type { CreationChoices } from '@/engine/newGame';
import { createNewGame } from '@/engine/newGame';
import { DEFAULT_APPEARANCE } from '@/content/appearance';

export function choices(overrides: Partial<CreationChoices> = {}): CreationChoices {
  return {
    name: 'Ro',
    appearance: { ...DEFAULT_APPEARANCE },
    perks: ['quick_wit', 'thick_skin'] as readonly PerkId[],
    flaw: 'overthinker' as FlawId,
    startingHobby: 'guitar',
    ...overrides,
  };
}

/** A deterministic new game (fixed seed) for tests. */
export function newTestGame(overrides: Partial<CreationChoices> = {}): GameState {
  return createNewGame(choices(overrides), 1234);
}
