import type { CharacterId, EncounterOutcome, VenueId } from '@/content/ids';
import type { CharacterMemory } from '@/types/character';
import type { GameState, LogEntry } from '@/types/game';
import type { Rng } from '@/types/core';
import type {
  DialogueProvider,
  EncounterContext,
  EncounterState,
  ProviderTurn,
} from '@/types/dialogue';
import { getCharacter } from '@/content/characters';
import { VENUES } from '@/content/venues';
import { FORCED_ENDINGS, OUTCOME_LINES, OUTCOME_TONE } from '@/content/encounterCopy';
import { createScriptedDialogueProvider } from '@/engine/dialogue/scriptedProvider';
import { TYPE_STATS } from '@/engine/dialogue/scoring';
import { absoluteDay, appendLog, makeLogEntry } from '@/engine/calendar';
import { decayInterest, memoryFor, moodBand, moodValueFor, nextStage } from '@/engine/characters';
import { grantAwarenessXp, grantStatXp, registerSocialOutcome } from '@/engine/progression';
import { effectiveAwareness } from '@/engine/awareness';
import {
  REPUTATION_FOR_OUTCOME,
  adjustReputation,
  gossipFor,
  reputationAt,
  reputationComfortBonus,
} from '@/engine/reputation';

/**
 * The provider the game is currently talking to. Swapping this line for
 * `createLlmDialogueProvider()` is the entire integration: nothing below this
 * module knows which one is running.
 */
export const dialogueProvider: DialogueProvider = createScriptedDialogueProvider();

const MIN_COMFORT = 0;
const MAX_METER = 100;

function clampMeter(value: number): number {
  return Math.max(MIN_COMFORT, Math.min(MAX_METER, Math.round(value * 10) / 10));
}

export function buildContext(
  state: GameState,
  characterId: CharacterId,
  venueId: VenueId,
  openingBonus = 0,
  mode: 'encounter' | 'date' = 'encounter',
): EncounterContext {
  const character = getCharacter(characterId);
  const absDay = absoluteDay(state.clock);
  const memory = decayInterest(memoryFor(state.characters, characterId), absDay);
  const moodValue = moodValueFor(state.rngSeed, characterId, absDay);
  const gossip = gossipFor(character, state.characters);
  const reputation = reputationComfortBonus(reputationAt(state, venueId));

  const startingInterest = Math.max(
    0,
    (memory.met ? memory.interest : character.baseInterest) + gossip.interest,
  );
  const startingComfort = Math.max(
    5,
    character.baseComfort + Math.round(moodValue / 2) + reputation + gossip.comfort,
  );

  return {
    character,
    memory,
    player: state.player,
    venue: VENUES[venueId],
    mood: moodBand(moodValue),
    moodValue,
    openingBonus,
    awareness: effectiveAwareness(state.player),
    mode,
    startingInterest,
    startingComfort,
    openingNotes: gossip.notes,
  };
}

function stateFromTurn(
  context: EncounterContext,
  turn: ProviderTurn,
  previous: EncounterState | null,
  interest: number,
  comfort: number,
): EncounterState {
  return {
    characterId: context.character.id,
    venueId: context.venue.id,
    mode: context.mode,
    providerId: dialogueProvider.id,
    cursor: turn.cursor,
    interest: clampMeter(interest),
    comfort: clampMeter(comfort),
    mood: context.mood,
    moodValue: context.moodValue,
    expression: turn.expression,
    line: turn.line,
    cue: turn.cue,
    options: turn.options,
    beats: [...(previous?.beats ?? []), { speaker: 'her', text: turn.line, cue: turn.cue }],
    learned: [...(previous?.learned ?? []), ...turn.learned],
    told: [...(previous?.told ?? []), ...turn.told],
    topics: [...(previous?.topics ?? []), ...turn.topics],
    outcome: turn.outcome,
    notes: turn.notes,
    dealbroken: (previous?.dealbroken ?? false) || turn.dealbroken,
    lastInterestDelta: turn.interestDelta,
    lastComfortDelta: turn.comfortDelta,
    openingBonus: context.openingBonus,
    busy: false,
  };
}

export async function beginEncounter(
  state: GameState,
  characterId: CharacterId,
  venueId: VenueId,
  openingBonus = 0,
  provider: DialogueProvider = dialogueProvider,
  mode: 'encounter' | 'date' = 'encounter',
): Promise<EncounterState> {
  const context = buildContext(state, characterId, venueId, openingBonus, mode);
  const turn = await provider.open(context);
  const opened = stateFromTurn(context, turn, null, context.startingInterest, context.startingComfort);
  return context.openingNotes.length > 0
    ? { ...opened, cue: [turn.cue, ...context.openingNotes].filter(Boolean).join(' ') }
    : opened;
}

/**
 * Apply the player's choice. The provider writes her reply; these rules decide
 * when the conversation is over regardless of what she said:
 *  - comfort on the floor ends it, however interested she was
 *  - her patience is finite
 *  - a dealbreaker ends it permanently
 */
export async function chooseOption(
  state: GameState,
  encounter: EncounterState,
  optionId: string,
  provider: DialogueProvider = dialogueProvider,
  rng?: Rng,
): Promise<EncounterState> {
  const option = encounter.options.find((candidate) => candidate.id === optionId);
  if (!option || !option.available) return encounter;

  const context = buildContext(
    state,
    encounter.characterId as CharacterId,
    encounter.venueId as VenueId,
    encounter.openingBonus,
    encounter.mode,
  );
  const turn = await provider.respond(
    context,
    { cursor: encounter.cursor, interest: encounter.interest, comfort: encounter.comfort },
    optionId,
  );

  const interest = clampMeter(encounter.interest + turn.interestDelta);
  const comfort = clampMeter(encounter.comfort + turn.comfortDelta);
  const withPlayerBeat: EncounterState = {
    ...encounter,
    beats: [...encounter.beats, { speaker: 'you', text: option.text }],
  };
  let next = stateFromTurn(context, turn, withPlayerBeat, interest, comfort);

  const pick = (lines: readonly string[]): string =>
    rng ? rng.pick(lines) : (lines[0] as string);

  if (!next.outcome && (comfort <= MIN_COMFORT || next.dealbroken)) {
    next = {
      ...next,
      line: pick(FORCED_ENDINGS.she_left),
      cue: null,
      expression: next.dealbroken ? 'annoyed' : 'uncomfortable',
      options: [],
      outcome: 'she_left',
      beats: [...next.beats.slice(0, -1), { speaker: 'her', text: pick(FORCED_ENDINGS.she_left), cue: null }],
    };
  } else if (!next.outcome && turn.cursor.turn > context.character.patience) {
    const windDown = pick(FORCED_ENDINGS.wind_down);
    next = {
      ...next,
      line: windDown,
      cue: null,
      options: [],
      outcome: 'friendly',
      beats: [...next.beats, { speaker: 'her', text: windDown, cue: null }],
    };
  }

  return next;
}

function blendInterest(memory: CharacterMemory, finalInterest: number): number {
  if (!memory.met) return Math.round(finalInterest);
  return Math.round(memory.interest * 0.35 + finalInterest * 0.65);
}

export interface ConcludeResult {
  state: GameState;
  entries: readonly LogEntry[];
}

/** Write the encounter into her memory and pay out what the player earned. */
export function concludeEncounter(
  state: GameState,
  encounter: EncounterState,
  rng: Rng,
): ConcludeResult {
  const outcome: EncounterOutcome = encounter.outcome ?? 'you_left';
  const characterId = encounter.characterId as CharacterId;
  const character = getCharacter(characterId);
  const previous = memoryFor(state.characters, characterId);
  const absDay = absoluteDay(state.clock);

  const record = {
    week: state.clock.week,
    dayIndex: state.clock.dayIndex,
    outcome,
    interest: Math.round(encounter.interest),
    comfort: Math.round(encounter.comfort),
  };

  const interest = encounter.dealbroken ? 0 : blendInterest(previous, encounter.interest);
  const outfit = character.outfits.find((item) => item.worn.includes(encounter.venueId as VenueId));

  const memory: CharacterMemory = {
    met: true,
    stage: 'stranger',
    interest,
    encounters: previous.encounters + 1,
    lastSeenAbsoluteDay: absDay,
    discussedTopics: [...new Set([...previous.discussedTopics, ...encounter.topics])],
    knownFacts: [...new Set([...previous.knownFacts, ...encounter.learned])],
    toldFacts: [...new Set([...previous.toldFacts, ...encounter.told])],
    outcomes: [...previous.outcomes, record].slice(-12),
    hasNumber: previous.hasNumber || outcome === 'number' || outcome === 'date_planned',
    lastContactAbsoluteDay: absDay,
    dates: previous.dates,
    standUps: previous.standUps,
    seenOutfits: [...new Set([...previous.seenOutfits, ...(outfit ? [outfit.id] : [])])],
    unlockedCgs: previous.unlockedCgs,
    dealbroken: previous.dealbroken || encounter.dealbroken,
  };
  memory.stage = nextStage({ ...memory, stage: previous.stage }, outcome, interest);

  let player = state.player;
  const entries: LogEntry[] = [];
  let next: GameState = { ...state, characters: { ...state.characters, [characterId]: memory } };

  // Practice pays: the reply types you used nudge the stats behind them.
  const usedTypes = encounter.beats.filter((beat) => beat.speaker === 'you').length;
  for (const stat of new Set(encounter.options.flatMap((option) => TYPE_STATS[option.type]))) {
    const granted = grantStatXp(player, stat, 4);
    player = granted.player;
  }
  const awareness = grantAwarenessXp(player, 10 + usedTypes * 5);
  player = awareness.player;

  const socialOutcome =
    outcome === 'number' || outcome === 'date_planned'
      ? 'success'
      : outcome === 'rejected'
        ? 'rejection'
        : outcome === 'she_left'
          ? 'failure'
          : null;

  if (socialOutcome) {
    const result = registerSocialOutcome(player, socialOutcome);
    player = result.player;
    for (const note of result.notes) {
      entries.push(makeLogEntry(next, note, socialOutcome === 'success' ? 'good' : 'neutral', rng));
    }
  }

  next = adjustReputation({ ...next, player }, encounter.venueId as VenueId, REPUTATION_FOR_OUTCOME[outcome]);
  entries.unshift(
    makeLogEntry(
      next,
      `${character.name}: ${OUTCOME_LINES[outcome]}`,
      OUTCOME_TONE[outcome] === 'good' ? 'milestone' : OUTCOME_TONE[outcome] === 'bad' ? 'bad' : 'neutral',
      rng,
    ),
  );
  if (awareness.levelsGained > 0) {
    entries.push(
      makeLogEntry(next, 'You are reading people better than you were last week.', 'milestone', rng),
    );
  }
  if (memory.dealbroken) {
    entries.push(makeLogEntry(next, character.dealbreaker.line, 'bad', rng));
  }

  return { state: appendLog(next, entries), entries };
}
