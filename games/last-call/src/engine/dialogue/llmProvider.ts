import type { EncounterOutcome, Expression, ResponseType, TopicTag } from '@/content/ids';
import type { CharacterDef } from '@/types/character';
import type {
  DialogueOptionDef,
  DialogueProvider,
  EncounterContext,
  EncounterProgress,
  PresentedOption,
  ProviderTurn,
} from '@/types/dialogue';
import { EXPRESSIONS, RESPONSE_TYPES, TOPIC_TAGS } from '@/content/ids';
import { BALANCE } from '@/config/gameConfig';
import { scoreOption } from '@/engine/dialogue/scoring';
import type { DialogueTransport } from '@/engine/dialogue/transports';
import { TransportError, resolveTransport } from '@/engine/dialogue/transports';

/**
 * AI dialogue: the player types whatever he likes and she answers in character.
 *
 * The split of responsibility is the point. The model writes her words, her
 * face and its own read of how the line landed. The game decides what any of
 * that is worth: deltas go through the same scoring pass as authored replies,
 * so her preferences, the player's stats, the venue and her mood still apply,
 * and an outcome the model hands out is only honoured when the local rules
 * already allow it. A model that tries to be generous cannot give the player
 * a win he has not earned.
 *
 * The key lives on the server (`server/dialogueService.mjs`). The browser-key
 * path exists for local tinkering and says so in the UI.
 */
export const AI_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'] as const;
export type AiModel = (typeof AI_MODELS)[number];

export interface LlmProviderConfig {
  endpoint: string;
  model: AiModel;
  timeoutMs: number;
  /** Set only in bring-your-own-key mode; never written to the save file. */
  apiKey?: string | null;
  /** Overridden in tests; resolved from the environment otherwise. */
  transport?: DialogueTransport;
}

export const DEFAULT_LLM_CONFIG: LlmProviderConfig = {
  endpoint: '/api/dialogue',
  model: 'claude-opus-5',
  timeoutMs: 30_000,
};

export class DialogueServiceError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'DialogueServiceError';
    this.status = status;
  }
}

interface RawSuggestion {
  type: string;
  text: string;
}

interface RawTurn {
  line: string;
  cue: string;
  expression: string;
  interestDelta: number;
  comfortDelta: number;
  tags: string[];
  dealbroken: boolean;
  learnedFactIds: string[];
  outcome: string;
  suggestions: RawSuggestion[];
}

/** Sample her authored lines so the model sounds like the written version. */
function sampleLines(character: CharacterDef, count = 8): readonly string[] {
  const lines: string[] = [];
  for (const node of Object.values(character.dialogue.nodes)) {
    const first = node.lines[0];
    if (first) lines.push(first.text);
    if (lines.length >= count) break;
  }
  return lines;
}

function characterPayload(character: CharacterDef) {
  return {
    id: character.id,
    name: character.name,
    age: character.age,
    archetype: character.archetype,
    tagline: character.tagline,
    bio: character.bio,
    personality: character.personality,
    voiceRules: character.voice,
    sampleLines: sampleLines(character),
    likes: character.likes,
    dislikes: character.dislikes,
    dealbreaker: character.dealbreaker,
    interests: character.interests,
    facts: character.facts.map((fact) => ({ id: fact.id, text: fact.text })),
  };
}

function situationPayload(context: EncounterContext, progress: EncounterProgress | null) {
  const { character, memory, venue } = context;
  return {
    venue: { name: venue.name, tagline: venue.tagline, atmosphere: venue.blurb },
    mood: context.mood,
    mode: context.mode,
    meters: {
      interest: progress?.interest ?? context.startingInterest,
      comfort: progress?.comfort ?? context.startingComfort,
    },
    memory: {
      stage: memory.stage,
      encounters: memory.encounters,
      knownFacts: character.facts
        .filter((fact) => memory.knownFacts.includes(fact.id))
        .map((fact) => fact.text),
      toldFacts: memory.toldFacts,
      discussedTopics: memory.discussedTopics,
      outcomes: memory.outcomes.slice(-3).map((record) => record.outcome),
    },
    turn: progress?.cursor.turn ?? 1,
    patience: character.patience,
    openingNotes: context.openingNotes,
  };
}

function isExpression(value: string): value is Expression {
  return (EXPRESSIONS as readonly string[]).includes(value);
}

function isResponseType(value: string): value is ResponseType {
  return (RESPONSE_TYPES as readonly string[]).includes(value);
}

function isTopicTag(value: string): value is TopicTag {
  return (TOPIC_TAGS as readonly string[]).includes(value);
}

function tidy(text: string, max: number): string {
  const trimmed = text.trim().replace(/^["“](.*)["”]$/s, '$1').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

function clamp(value: number, limit = 12): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * Decide whether an outcome the model reached for is actually allowed. The
 * model can end a conversation badly whenever it likes — that is her right —
 * but it cannot hand out a number or a date the player has not earned.
 */
export function permitOutcome(
  raw: string,
  context: EncounterContext,
  interest: number,
  comfort: number,
): EncounterOutcome | null {
  switch (raw) {
    case 'rejected':
    case 'she_left':
    case 'friendly':
    case 'you_left':
      return raw;
    case 'number':
      if (context.memory.hasNumber) return null;
      return interest >= BALANCE.conversation.boldInterest && comfort >= BALANCE.conversation.boldComfort
        ? 'number'
        : null;
    case 'date_planned':
      return context.mode === 'date' &&
        interest >= BALANCE.conversation.boldInterest &&
        comfort >= BALANCE.conversation.boldComfort
        ? 'date_planned'
        : null;
    default:
      return null;
  }
}

/**
 * Turn the model's answer into a game turn: clamp its numbers, re-score them
 * through the same pipeline authored replies use, and drop anything it made up.
 */
export function sanitiseTurn(
  raw: RawTurn,
  context: EncounterContext,
  progress: EncounterProgress | null,
  playerSaid: string | null,
): ProviderTurn {
  const tags = (raw.tags ?? []).filter(isTopicTag);
  const suggestions = (raw.suggestions ?? [])
    .filter((suggestion) => suggestion && typeof suggestion.text === 'string')
    .slice(0, 4)
    .map((suggestion, index): PresentedOption => ({
      id: `ai_${index}`,
      type: isResponseType(suggestion.type) ? suggestion.type : 'sincere',
      text: tidy(suggestion.text, 160),
      available: true,
      lockReason: null,
    }));

  const interest = progress?.interest ?? context.startingInterest;
  const comfort = progress?.comfort ?? context.startingComfort;

  let interestDelta = 0;
  let comfortDelta = 0;
  let notes: readonly string[] = [];
  let dealbroken = Boolean(raw.dealbroken);

  if (playerSaid !== null) {
    // The model's read is the authored baseline; the engine applies everything
    // else — her preferences, his stats, the venue, her mood, repetition.
    const synthetic: DialogueOptionDef = {
      id: 'ai_said',
      type: suggestions[0]?.type ?? 'sincere',
      text: playerSaid,
      tags,
      interest: clamp(raw.interestDelta) * 0.65,
      comfort: clamp(raw.comfortDelta) * 0.65,
      next: 'ai',
    };
    const scored = scoreOption({
      option: synthetic,
      character: context.character,
      memory: context.memory,
      player: context.player,
      venue: context.venue,
      mood: context.moodValue,
      interest,
      comfort,
      turn: progress?.cursor.turn ?? 1,
      openingBonus: context.openingBonus,
    });
    interestDelta = scored.interestDelta;
    comfortDelta = scored.comfortDelta;
    notes = scored.notes;
    dealbroken = dealbroken || scored.dealbroken;
  }

  const factIds = new Set(context.character.facts.map((fact) => fact.id));
  const learned = (raw.learnedFactIds ?? []).filter((id) => factIds.has(id));

  const outcome = permitOutcome(
    raw.outcome ?? 'none',
    context,
    interest + interestDelta,
    comfort + comfortDelta,
  );

  return {
    line: tidy(raw.line ?? '', 400),
    expression: isExpression(raw.expression) ? raw.expression : 'neutral',
    cue: raw.cue ? tidy(raw.cue, 200) : null,
    interestDelta,
    comfortDelta,
    options: outcome ? [] : suggestions,
    learned,
    told: [],
    topics: tags,
    outcome,
    notes,
    dealbroken,
    cursor: { value: 'ai', turn: (progress?.cursor.turn ?? 0) + 1 },
  };
}

async function requestTurn(
  transport: DialogueTransport,
  config: LlmProviderConfig,
  payload: Omit<Parameters<DialogueTransport['request']>[0], 'model'>,
): Promise<RawTurn> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const raw = await transport.request({ ...payload, model: config.model }, controller.signal);
    const turn = raw as RawTurn | undefined;
    if (!turn || typeof turn.line !== 'string') {
      throw new DialogueServiceError('She did not answer in a way the game could read.', 502);
    }
    return turn;
  } catch (error) {
    if (error instanceof DialogueServiceError) throw error;
    if (error instanceof TransportError) throw new DialogueServiceError(error.message, 0);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new DialogueServiceError('She took too long to answer. (Request timed out.)', 408);
    }
    throw new DialogueServiceError(
      error instanceof Error ? error.message : 'Could not reach Claude.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export interface FreeTextProvider extends DialogueProvider {
  /** The player typed something of his own. */
  say(context: EncounterContext, progress: EncounterProgress, text: string): Promise<ProviderTurn>;
}

export function createLlmDialogueProvider(
  overrides: Partial<LlmProviderConfig> = {},
): FreeTextProvider {
  const config: LlmProviderConfig = { ...DEFAULT_LLM_CONFIG, ...overrides };

  // Resolved once: the page's own Claude runtime when there is one (a
  // published artifact), the local dialogue service otherwise.
  let transportPromise: Promise<DialogueTransport> | null = null;
  const transportFor = (): Promise<DialogueTransport> => {
    if (config.transport) return Promise.resolve(config.transport);
    transportPromise ??= resolveTransport(config.endpoint, config.apiKey);
    return transportPromise;
  };

  const turnFor = async (
    context: EncounterContext,
    progress: EncounterProgress | null,
    playerSaid: string | null,
  ): Promise<ProviderTurn> => {
    const transport = await transportFor();
    const raw = await requestTurn(transport, config, {
      character: characterPayload(context.character),
      situation: situationPayload(context, progress),
      beats: (progress?.beats ?? []).map((beat) => ({ speaker: beat.speaker, text: beat.text })),
      playerSaid,
      contentRating: context.contentRating,
    });
    return sanitiseTurn(raw, context, progress, playerSaid);
  };

  return {
    id: 'llm',

    open: (context) => turnFor(context, null, null),

    respond: (context, progress, optionId) => {
      const chosen = progress.options?.find((option) => option.id === optionId);
      return turnFor(context, progress, chosen ? chosen.text : optionId);
    },

    say: (context, progress, text) => turnFor(context, progress, tidy(text, 600)),
  };
}
