import type {
  EncounterOutcome,
  Expression,
  HobbyId,
  PerkId,
  RelationshipStage,
  ResponseType,
  StatId,
  TopicTag,
} from '@/content/ids';
import type { CharacterDef, CharacterMemory, MoodBand } from '@/types/character';
import type { PlayerState } from '@/types/player';
import type { VenueDef } from '@/types/venues';

/** Gate on a reply. Locked replies are shown with what would unlock them. */
export type DialogueRequirement =
  | { kind: 'stat'; stat: StatId; min: number }
  | { kind: 'hobby'; hobby: HobbyId; minLevel: number }
  | { kind: 'perk'; perk: PerkId }
  | { kind: 'fact'; fact: string }
  | { kind: 'interest'; min: number }
  | { kind: 'comfort'; min: number }
  | { kind: 'stage'; stages: readonly RelationshipStage[] };

export interface DialogueOptionDef {
  id: string;
  type: ResponseType;
  /** What the player says. Write it the way a person would actually say it. */
  text: string;
  tags?: readonly TopicTag[];
  requires?: readonly DialogueRequirement[];
  /** Authored baseline before her preferences and your stats are applied. */
  interest?: number;
  comfort?: number;
  /** Facts about her the player learns by choosing this. */
  learn?: readonly string[];
  /** Things she learns about the player. */
  tell?: readonly string[];
  next: string;
}

export interface DialogueLine {
  text: string;
  expression: Expression;
  /** Body language. This is all the player gets at low awareness. */
  cue?: string;
  /** Variant filters: the first line whose filters all pass is used. */
  mood?: MoodBand;
  minInterest?: number;
  maxInterest?: number;
  minEncounters?: number;
}

export interface DialogueNode {
  id: string;
  /** Her line. Several variants; the first that fits the moment wins. */
  lines: readonly DialogueLine[];
  options?: readonly DialogueOptionDef[];
  /** Reaching this node ends the encounter with this outcome. */
  outcome?: EncounterOutcome;
  /** Subjects covered here, recorded in her memory so they are not repeated. */
  topics?: readonly TopicTag[];
}

export interface DialogueTree {
  /** Where the conversation starts, by how well she knows you. */
  openings: Readonly<Partial<Record<RelationshipStage, string>>> & { stranger: string };
  nodes: Readonly<Record<string, DialogueNode>>;
}

// --- Provider interface ---------------------------------------------------

export interface EncounterContext {
  character: CharacterDef;
  memory: CharacterMemory;
  player: PlayerState;
  venue: VenueDef;
  mood: MoodBand;
  /** -12..+12, the numeric version of the mood band. */
  moodValue: number;
  /** Carried in from the venue mini-game or a wingman assist. */
  openingBonus: number;
  /** Player's social awareness level, 0-4. */
  awareness: number;
  /** Where the meters start, after memory, mood, reputation and gossip. */
  startingInterest: number;
  startingComfort: number;
  /** Why they start there — shown as a cue before the first line. */
  openingNotes: readonly string[];
}

export interface PresentedOption {
  id: string;
  type: ResponseType;
  text: string;
  available: boolean;
  /** "Needs Confidence 40" — shown on locked options so they read as goals. */
  lockReason: string | null;
}

/** Where the provider is in the conversation. Opaque to the rest of the game. */
export interface ProviderCursor {
  /** Scripted: the current node id. An LLM provider would put its own id here. */
  value: string;
  turn: number;
}

export interface ProviderTurn {
  line: string;
  expression: Expression;
  cue: string | null;
  interestDelta: number;
  comfortDelta: number;
  options: readonly PresentedOption[];
  learned: readonly string[];
  told: readonly string[];
  topics: readonly TopicTag[];
  outcome: EncounterOutcome | null;
  /** Why the numbers moved. Only shown at the top awareness level. */
  notes: readonly string[];
  /** True when the reply hit her dealbreaker. Nothing recovers from this. */
  dealbroken: boolean;
  cursor: ProviderCursor;
}

export interface EncounterProgress {
  cursor: ProviderCursor;
  interest: number;
  comfort: number;
}

/**
 * The seam between the game and whatever is generating her side of the
 * conversation. Everything above this interface — encounter loop, meters,
 * memory, outcomes — is provider-agnostic.
 *
 * Implementations: ScriptedDialogueProvider (authored trees, shipped) and
 * LLMDialogueProvider (documented stub, see engine/dialogue/llmProvider.ts).
 */
export interface DialogueProvider {
  readonly id: string;
  /** Her opening line and the first set of replies. */
  open(context: EncounterContext): Promise<ProviderTurn>;
  /** The player picked a reply; she responds. */
  respond(
    context: EncounterContext,
    progress: EncounterProgress,
    optionId: string,
  ): Promise<ProviderTurn>;
}

export interface EncounterBeat {
  speaker: 'her' | 'you';
  text: string;
  /** Present on her beats when the player is aware enough to read it. */
  cue?: string | null;
}

export interface EncounterState {
  characterId: string;
  venueId: string;
  providerId: string;
  cursor: ProviderCursor;
  interest: number;
  comfort: number;
  mood: MoodBand;
  moodValue: number;
  expression: Expression;
  line: string;
  cue: string | null;
  options: readonly PresentedOption[];
  beats: readonly EncounterBeat[];
  learned: readonly string[];
  told: readonly string[];
  topics: readonly TopicTag[];
  outcome: EncounterOutcome | null;
  notes: readonly string[];
  dealbroken: boolean;
  /** Last deltas, for the awareness readout. */
  lastInterestDelta: number;
  lastComfortDelta: number;
  openingBonus: number;
  busy: boolean;
}
