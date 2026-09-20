import type { CharacterId, EncounterOutcome, RelationshipStage, VenueId } from '@/content/ids';
import type { CharacterDef, CharacterMemory, MoodBand } from '@/types/character';
import type { GameClock } from '@/types/core';
import type { VenueDef } from '@/types/venues';
import { CHARACTERS, getCharacter } from '@/content/characters';
import { VENUES } from '@/content/venues';
import { absoluteDay, currentDay, currentSlot } from '@/engine/calendar';

export function emptyMemory(): CharacterMemory {
  return {
    met: false,
    stage: 'stranger',
    interest: 0,
    encounters: 0,
    lastSeenAbsoluteDay: null,
    discussedTopics: [],
    knownFacts: [],
    toldFacts: [],
    outcomes: [],
    hasNumber: false,
    lastContactAbsoluteDay: null,
    dates: 0,
    standUps: 0,
    seenOutfits: [],
    unlockedCgs: [],
    dealbroken: false,
  };
}

export function memoryFor(
  memories: Readonly<Partial<Record<CharacterId, CharacterMemory>>>,
  id: CharacterId,
): CharacterMemory {
  return memories[id] ?? emptyMemory();
}

/** Deterministic per character, per day: the same day always feels the same. */
export function moodValueFor(seed: number, id: CharacterId, absDay: number): number {
  let hash = seed ^ (absDay * 2654435761);
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  }
  const normalised = ((hash >>> 0) % 1000) / 1000;
  return Math.round((normalised * 24 - 12) * 10) / 10;
}

export function moodBand(value: number): MoodBand {
  if (value <= -4) return 'bad';
  if (value >= 4) return 'good';
  return 'okay';
}

export const MOOD_CUES: Readonly<Record<MoodBand, string>> = {
  bad: 'Something happened before you got here. It is still happening behind her eyes.',
  okay: 'Working night. Nothing to read into either way.',
  good: 'She is in a good mood, and the whole end of the bar knows it.',
};

/** Interest fades if you disappear for a fortnight. She has a life. */
export function decayInterest(memory: CharacterMemory, absDay: number): CharacterMemory {
  if (memory.lastSeenAbsoluteDay === null || !memory.met) return memory;
  const away = absDay - memory.lastSeenAbsoluteDay;
  if (away <= 10) return memory;
  const lost = Math.min(memory.interest, (away - 10) * 1.5);
  if (lost <= 0) return memory;
  return { ...memory, interest: Math.round(memory.interest - lost) };
}

export interface CrowdMember {
  character: CharacterDef;
  memory: CharacterMemory;
  /** False when the character has data but is not here right now. */
  present: boolean;
}

/** Who is at this venue in the current slot, from the venue's schedule. */
export function crowdAt(
  venue: VenueDef,
  clock: GameClock,
  memories: Readonly<Partial<Record<CharacterId, CharacterMemory>>>,
): readonly CrowdMember[] {
  const day = currentDay(clock);
  const slot = currentSlot(clock);
  return venue.regulars
    .filter((entry) => entry.days.includes(day) && entry.slots.includes(slot))
    .filter((entry) => CHARACTERS[entry.character] !== undefined)
    .map((entry) => ({
      character: getCharacter(entry.character),
      memory: decayInterest(memoryFor(memories, entry.character), absoluteDay(clock)),
      present: true,
    }));
}

/** Everywhere a character might be this week, for the phone and the wingman. */
export function whereToFind(character: CharacterDef): readonly { venue: VenueDef; days: readonly string[] }[] {
  const found: { venue: VenueDef; days: readonly string[] }[] = [];
  for (const venue of Object.values(VENUES)) {
    const entry = venue.regulars.find((regular) => regular.character === character.id);
    if (entry) found.push({ venue, days: entry.days });
  }
  return found;
}

const STAGE_ORDER: readonly RelationshipStage[] = [
  'stranger',
  'acquaintance',
  'interested',
  'dating',
  'relationship',
];

/**
 * Where the two of you stand after an encounter. Stages only move up through
 * behaviour; a dealbreaker or a second hard no moves it to not_interested and
 * nothing moves it back.
 */
export function nextStage(
  memory: CharacterMemory,
  outcome: EncounterOutcome,
  finalInterest: number,
): RelationshipStage {
  if (memory.dealbroken) return 'not_interested';
  if (memory.stage === 'not_interested') return 'not_interested';

  const hardNos = memory.outcomes.filter((record) => record.outcome === 'rejected').length;
  if (outcome === 'rejected' && hardNos >= 1) return 'not_interested';

  if (outcome === 'date_planned') return 'dating';
  if (outcome === 'number' || finalInterest >= 55) {
    return STAGE_ORDER.indexOf(memory.stage) > STAGE_ORDER.indexOf('interested')
      ? memory.stage
      : 'interested';
  }

  const friendlyRuns = memory.outcomes.filter((record) => record.outcome === 'friendly').length;
  if (friendlyRuns >= 3 && finalInterest < 40) return 'friend';

  if (memory.stage === 'stranger') return 'acquaintance';
  return memory.stage;
}

export const STAGE_LABELS: Readonly<Record<RelationshipStage, string>> = {
  stranger: 'Stranger',
  acquaintance: 'Knows your face',
  interested: 'Interested',
  dating: 'Dating',
  relationship: 'Together',
  friend: 'Friends',
  not_interested: 'Not interested',
};

export function venueNameFor(id: VenueId): string {
  return VENUES[id].name;
}
