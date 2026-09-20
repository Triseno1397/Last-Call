import type { CharacterId, DateIdeaId, ResponseType, TextTone } from '@/content/ids';
import type { CharacterDef, CharacterMemory } from '@/types/character';
import type { GameState, LogEntry } from '@/types/game';
import type { PhoneThread, ScheduledDate, TextMessage } from '@/types/phone';
import type { Rng } from '@/types/core';
import { getCharacter } from '@/content/characters';
import { DATE_IDEAS, DATE_IDEA_LIST } from '@/content/dateIdeas';
import { CADENCE_NOTES, PLAYER_TEXTS } from '@/content/phoneCopy';
import { BALANCE } from '@/config/gameConfig';
import { absoluteDay, appendLog, makeLogEntry } from '@/engine/calendar';
import { memoryFor } from '@/engine/characters';
import { effectiveStat } from '@/engine/progression';
import { collectEffects } from '@/engine/traits';

/** A text is a reply with a tone; her preferences apply the same way. */
export const TONE_AS_TYPE: Readonly<Record<TextTone, ResponseType>> = {
  playful: 'tease',
  warm: 'sincere',
  direct: 'bold',
  callback: 'question',
};

const TONE_BASE: Readonly<Record<TextTone, number>> = {
  playful: 3,
  warm: 3,
  direct: 4.5,
  callback: 5,
};

export function emptyThread(): PhoneThread {
  return { messages: [], lastSentDay: null, lastReceivedDay: null, sentToday: 0, unread: false };
}

export function threadFor(state: GameState, id: string): PhoneThread {
  return state.phone.threads[id] ?? emptyThread();
}

/** Contacts are people whose number you have. */
export function contacts(state: GameState): readonly CharacterId[] {
  return (Object.keys(state.characters) as CharacterId[]).filter(
    (id) => state.characters[id]?.hasNumber,
  );
}

export interface CadenceResult {
  interest: number;
  note: string | null;
}

/**
 * Timing. Texting too much reads as need; going quiet for a week reads as
 * indifference. The sweet spot is a day or three.
 */
export function cadenceModifier(thread: PhoneThread, today: number): CadenceResult {
  if (thread.lastSentDay === null) return { interest: 0, note: null };

  if (thread.lastSentDay === today) {
    if (thread.sentToday >= 2) return { interest: -6, note: CADENCE_NOTES.tripleText };
    return { interest: -3, note: CADENCE_NOTES.doubleText };
  }

  const gap = today - Math.max(thread.lastSentDay, thread.lastReceivedDay ?? thread.lastSentDay);
  if (gap <= 3) return { interest: 1.5, note: CADENCE_NOTES.goodCadence };
  if (gap <= 7) return { interest: 0, note: null };
  return { interest: -2.5, note: CADENCE_NOTES.gone_quiet };
}

export interface ComposeOption {
  tone: TextTone;
  text: string;
  available: boolean;
  lockReason: string | null;
}

/** The four tones, with the callback locked until you know something about her. */
export function composeOptions(state: GameState, characterId: CharacterId, rng: Rng): readonly ComposeOption[] {
  const character = getCharacter(characterId);
  const memory = memoryFor(state.characters, characterId);
  const known = character.facts.filter((fact) => memory.knownFacts.includes(fact.id));

  return (Object.keys(TONE_BASE) as TextTone[]).map((tone) => {
    const pool = PLAYER_TEXTS[tone];
    if (tone === 'callback') {
      const fact = known.length > 0 ? rng.pick(known) : null;
      return {
        tone,
        text: fact
          ? `${rng.pick(pool)} ${fact.callback ?? 'that thing you told me.'}`
          : rng.pick(pool),
        available: fact !== null,
        lockReason: fact === null ? 'Learn something about her first' : null,
      };
    }
    return { tone, text: rng.pick(pool), available: true, lockReason: null };
  });
}

export interface TextResult {
  state: GameState;
  delta: number;
  notes: readonly string[];
  reply: string;
  entries: readonly LogEntry[];
}

function pushMessages(
  state: GameState,
  id: string,
  messages: readonly TextMessage[],
  today: number,
  fromPlayer: boolean,
): GameState {
  const thread = threadFor(state, id);
  const next: PhoneThread = {
    messages: [...thread.messages, ...messages].slice(-40),
    lastSentDay: fromPlayer ? today : thread.lastSentDay,
    lastReceivedDay: fromPlayer ? thread.lastReceivedDay : today,
    sentToday: fromPlayer ? (thread.lastSentDay === today ? thread.sentToday + 1 : 1) : thread.sentToday,
    unread: fromPlayer ? thread.unread : true,
  };
  return { ...state, phone: { ...state.phone, threads: { ...state.phone.threads, [id]: next } } };
}

/** Send her a text. Tone is scored against her; timing is scored against you. */
export function sendText(
  state: GameState,
  characterId: CharacterId,
  tone: TextTone,
  text: string,
  rng: Rng,
): TextResult {
  const character = getCharacter(characterId);
  const memory = memoryFor(state.characters, characterId);
  const today = absoluteDay(state.clock);
  const thread = threadFor(state, characterId);
  const notes: string[] = [];

  const preference = character.preferences[TONE_AS_TYPE[tone]] ?? 1;
  const cadence = cadenceModifier(thread, today);
  if (cadence.note) notes.push(cadence.note);

  const flawDelta = collectEffects(state.player, 'textingToneDelta').reduce(
    (total, effect) => total + effect.amount,
    0,
  );
  if (flawDelta !== 0) notes.push('Your texts do not sound like you do in person.');

  const charm = (effectiveStat(state.player, 'charm') - 40) / 25;
  const interestBefore = memory.interest;
  const raw = TONE_BASE[tone] * preference + cadence.interest + flawDelta + charm;
  const delta = Math.round(raw * 10) / 10;

  const landed = delta > 0;
  const pool = character.texts.replies[tone];
  const reply = rng.pick(landed ? pool.good : pool.bad);

  const outgoing: TextMessage = {
    id: `${characterId}-${today}-${rng.int(0, 999999)}`,
    from: 'you',
    text,
    day: today,
    tone,
    delta,
  };
  const incoming: TextMessage = {
    id: `${characterId}-${today}-${rng.int(0, 999999)}`,
    from: 'her',
    text: reply,
    day: today,
  };

  let next = pushMessages(state, characterId, [outgoing], today, true);
  next = pushMessages(next, characterId, [incoming], today, false);
  next = { ...next, phone: { ...next.phone, threads: { ...next.phone.threads, [characterId]: { ...threadFor(next, characterId), unread: false } } } };

  const updated: CharacterMemory = {
    ...memory,
    interest: Math.max(0, Math.min(BALANCE.stats.max, Math.round(interestBefore + delta))),
    lastContactAbsoluteDay: today,
  };

  next = { ...next, characters: { ...next.characters, [characterId]: updated } };
  const entry = makeLogEntry(
    next,
    `Texted ${character.name}. ${landed ? 'It landed.' : 'It did not land.'}`,
    landed ? 'good' : 'neutral',
    rng,
  );

  return { state: appendLog(next, [entry]), delta, notes, reply, entries: [entry] };
}

/** She texts first when she is interested and you have gone quiet for a bit. */
export function maybeIncomingTexts(state: GameState, rng: Rng): { state: GameState; entries: readonly LogEntry[] } {
  const today = absoluteDay(state.clock);
  let next = state;
  const entries: LogEntry[] = [];

  for (const id of contacts(state)) {
    const memory = memoryFor(state.characters, id);
    const thread = threadFor(state, id);
    if (memory.dealbroken || memory.stage === 'not_interested') continue;
    if (memory.interest < 50) continue;
    const since = today - (memory.lastContactAbsoluteDay ?? today);
    if (since < 2) continue;
    if (thread.lastReceivedDay === today) continue;
    if (!rng.chance(0.45)) continue;

    const character = getCharacter(id);
    const message: TextMessage = {
      id: `${id}-in-${today}-${rng.int(0, 999999)}`,
      from: 'her',
      text: rng.pick(character.texts.opens),
      day: today,
    };
    next = pushMessages(next, id, [message], today, false);
    next = {
      ...next,
      characters: { ...next.characters, [id]: { ...memory, lastContactAbsoluteDay: today } },
    };
    entries.push(makeLogEntry(next, `${character.name} texted you first.`, 'milestone', rng));
  }

  return { state: appendLog(next, entries), entries };
}

// --- Asking her out -------------------------------------------------------

export interface IdeaOption {
  id: DateIdeaId;
  name: string;
  where: string;
  blurb: string;
  cost: number;
  available: boolean;
  lockReason: string | null;
  /** True when the idea lines up with something she actually likes. */
  appeals: boolean;
}

export function dateIdeasFor(state: GameState, character: CharacterDef): readonly IdeaOption[] {
  return DATE_IDEA_LIST.map((idea) => {
    const reasons: string[] = [];
    if (idea.requiresHobby && state.player.hobbies[idea.requiresHobby].level < 1) {
      reasons.push(`Needs ${idea.requiresHobby}`);
    }
    if (idea.requiresStat && state.player.stats[idea.requiresStat.stat].value < idea.requiresStat.min) {
      reasons.push(`Needs ${idea.requiresStat.stat} ${idea.requiresStat.min}`);
    }
    if (state.player.money < idea.cost) reasons.push(`Needs $${idea.cost}`);

    return {
      id: idea.id,
      name: idea.name,
      where: idea.where,
      blurb: idea.blurb,
      cost: idea.cost,
      available: reasons.length === 0,
      lockReason: reasons[0] ?? null,
      appeals: idea.appealsTo.some((hobby) => character.interests.includes(hobby)),
    };
  });
}

export function hasPendingDate(state: GameState, characterId: CharacterId): boolean {
  return state.dates.some((date) => date.characterId === characterId && !date.resolved);
}

/** The next evening at least two days out — enough notice to be taken seriously. */
export function nextDateSlot(state: GameState): { week: number; dayIndex: number; slotIndex: number } {
  const eveningSlot = BALANCE.slotsPerDay - 1;
  let week = state.clock.week;
  let dayIndex = state.clock.dayIndex + 2;
  while (dayIndex >= BALANCE.daysPerWeek) {
    dayIndex -= BALANCE.daysPerWeek;
    week += 1;
  }
  return { week, dayIndex, slotIndex: eveningSlot };
}

export interface AskOutResult {
  state: GameState;
  accepted: boolean;
  reply: string;
  date: ScheduledDate | null;
}

export function askOut(
  state: GameState,
  characterId: CharacterId,
  ideaId: DateIdeaId,
  rng: Rng,
): AskOutResult {
  const character = getCharacter(characterId);
  const memory = memoryFor(state.characters, characterId);
  const idea = DATE_IDEAS[ideaId];
  const today = absoluteDay(state.clock);

  const appeals = idea.appealsTo.some((hobby) => character.interests.includes(hobby));
  const score =
    memory.interest + (appeals ? idea.matchBonus * 3 : 0) - memory.standUps * 20 + rng.int(-4, 4);
  const accepted = !memory.dealbroken && memory.stage !== 'not_interested' && score >= 52;

  const reply = rng.pick(accepted ? character.texts.acceptsDate : character.texts.declinesDate);
  const when = nextDateSlot(state);

  const outgoing: TextMessage = {
    id: `${characterId}-ask-${today}-${rng.int(0, 999999)}`,
    from: 'you',
    text: `${idea.name} — ${idea.where}. You in?`,
    day: today,
    tone: 'direct',
  };
  const incoming: TextMessage = {
    id: `${characterId}-ans-${today}-${rng.int(0, 999999)}`,
    from: 'her',
    text: reply,
    day: today,
  };

  let next = pushMessages(state, characterId, [outgoing], today, true);
  next = pushMessages(next, characterId, [incoming], today, false);
  next = {
    ...next,
    phone: {
      ...next.phone,
      threads: { ...next.phone.threads, [characterId]: { ...threadFor(next, characterId), unread: false } },
    },
    characters: {
      ...next.characters,
      [characterId]: {
        ...memory,
        lastContactAbsoluteDay: today,
        interest: Math.max(0, memory.interest + (accepted ? 2 : -4)),
      },
    },
  };

  if (!accepted) return { state: next, accepted, reply, date: null };

  const date: ScheduledDate = { characterId, ideaId, ...when, resolved: false };
  return { state: { ...next, dates: [...next.dates, date] }, accepted, reply, date };
}
