import type {
  CharacterId,
  EncounterOutcome,
  Expression,
  Gender,
  HobbyId,
  RelationshipStage,
  ResponseType,
  StatId,
  TopicTag,
  VenueId,
} from '@/content/ids';
import type { DialogueTree } from '@/types/dialogue';

/** Her baseline for the day. Shifts how hard the encounter is. */
export type MoodBand = 'bad' | 'okay' | 'good';

export interface OutfitDef {
  id: string;
  name: string;
  /** Venues this outfit belongs at; used to pick what she is wearing. */
  worn: readonly VenueId[];
  /** Unlocked outfits show in the gallery once seen. */
  unlockHint?: string;
  palette: { primary: string; secondary: string; accent: string };
}

/** A discoverable fact about her. The player only sees these once learned. */
export interface CharacterFact {
  id: string;
  /** One line, in the player's voice, for the phone/contacts screen. */
  text: string;
  /** Topics this fact unlocks in later conversations. */
  unlocks?: readonly TopicTag[];
}

/** Placeholder-portrait colours; real art overrides this entirely. */
export interface CharacterPalette {
  hair: string;
  hairShadow: string;
  skin: string;
  eyes: string;
  accent: string;
  background: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  /** Every character in the game is 21 or older. A test enforces it. */
  age: number;
  gender: Gender;
  archetype: string;
  tagline: string;
  bio: string;
  personality: readonly string[];
  likes: readonly TopicTag[];
  dislikes: readonly TopicTag[];
  /** The one thing she will not forgive. */
  dealbreaker: { tag: TopicTag; line: string };
  interests: readonly HobbyId[];
  /** Multiplier applied to a reply of this type. 1 is neutral. */
  preferences: Partial<Record<ResponseType, number>>;
  /** Stats that carry weight with her specifically. */
  statWeights: Partial<Record<StatId, number>>;
  /** Where she is usually found; her schedule lives on the venue. */
  homeVenue: VenueId;
  /** Starting values for a first encounter. */
  baseInterest: number;
  baseComfort: number;
  /** How many turns she gives you before the conversation runs out of road. */
  patience: number;
  facts: readonly CharacterFact[];
  outfits: readonly OutfitDef[];
  palette: CharacterPalette;
  /** Characters who know her. Phase 3 spreads reputation along these. */
  knows: readonly CharacterId[];
  dialogue: DialogueTree;
}

export interface EncounterRecord {
  week: number;
  dayIndex: number;
  outcome: EncounterOutcome;
  interest: number;
  comfort: number;
}

/**
 * What she remembers. Persisted in the save; the conversation engine reads it
 * to avoid repeating topics and to open differently once she knows you.
 */
export interface CharacterMemory {
  met: boolean;
  stage: RelationshipStage;
  /** Carried-over affinity between encounters, 0-100. */
  interest: number;
  encounters: number;
  lastSeenAbsoluteDay: number | null;
  discussedTopics: readonly TopicTag[];
  knownFacts: readonly string[];
  /** Things the player told her about himself. */
  toldFacts: readonly string[];
  outcomes: readonly EncounterRecord[];
  hasNumber: boolean;
  /** Outfits and CGs the player has unlocked, for the gallery. */
  seenOutfits: readonly string[];
  unlockedCgs: readonly string[];
  /** Set when she is done with you. Nothing brings this back. */
  dealbroken: boolean;
}

export interface CharacterView {
  def: CharacterDef;
  memory: CharacterMemory;
  mood: MoodBand;
  moodLine: string;
  expression: Expression;
}
