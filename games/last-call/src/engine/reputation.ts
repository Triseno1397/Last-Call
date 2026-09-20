import type { CharacterId, EncounterOutcome, VenueId } from '@/content/ids';
import type { CharacterDef, CharacterMemory } from '@/types/character';
import type { GameState } from '@/types/game';
import { VENUES } from '@/content/venues';
import { memoryFor } from '@/engine/characters';

/** How a night ends changes how the room treats you next time. */
export const REPUTATION_FOR_OUTCOME: Readonly<Record<EncounterOutcome, number>> = {
  number: 3,
  date_planned: 4,
  friendly: 1,
  you_left: 0,
  rejected: -1,
  she_left: -3,
};

export const REPUTATION_FLOOR = -30;
export const REPUTATION_CEILING = 30;

export function reputationAt(state: GameState, venue: VenueId): number {
  return state.player.venueReputation[venue] ?? 0;
}

export function adjustReputation(state: GameState, venue: VenueId, delta: number): GameState {
  const current = reputationAt(state, venue);
  const next = Math.max(REPUTATION_FLOOR, Math.min(REPUTATION_CEILING, current + delta));
  return {
    ...state,
    player: {
      ...state.player,
      venueReputation: { ...state.player.venueReputation, [venue]: next },
    },
  };
}

export function reputationLabel(value: number): string {
  if (value <= -15) return 'They would rather you drank somewhere else.';
  if (value <= -5) return 'The staff have opinions about you.';
  if (value < 5) return 'Another face in the room.';
  if (value < 15) return 'A regular. The good kind.';
  return 'You are part of the furniture here, and it suits you.';
}

/** Being known here makes people relax around you a little faster. */
export function reputationComfortBonus(value: number): number {
  return Math.round(Math.max(-10, Math.min(8, value * 0.45)) * 10) / 10;
}

export interface GossipResult {
  interest: number;
  comfort: number;
  notes: readonly string[];
}

/**
 * Characters talk to each other. Burning one of them costs you with her
 * friends; doing well with one warms the room slightly.
 */
export function gossipFor(
  character: CharacterDef,
  memories: Readonly<Partial<Record<CharacterId, CharacterMemory>>>,
): GossipResult {
  let interest = 0;
  let comfort = 0;
  const notes: string[] = [];

  for (const friendId of character.knows) {
    const friend = memoryFor(memories, friendId);
    if (!friend.met) continue;

    if (friend.dealbroken || friend.stage === 'not_interested') {
      interest -= 12;
      comfort -= 16;
      notes.push('Word travels between these two, and it has already travelled.');
      continue;
    }
    if (friend.interest >= 55) {
      comfort += 6;
      notes.push('Somebody has said something good about you.');
    } else if (friend.encounters > 0) {
      comfort += 2;
    }
  }

  return { interest, comfort, notes };
}

export function venueName(venue: VenueId): string {
  return VENUES[venue].name;
}
