import type { ResponseType, StatId, TopicTag } from '@/content/ids';
import type { CharacterDef, CharacterMemory } from '@/types/character';
import type { DialogueOptionDef } from '@/types/dialogue';
import type { PlayerState } from '@/types/player';
import type { VenueDef } from '@/types/venues';
import { effectiveStat } from '@/engine/progression';
import { collectEffects } from '@/engine/traits';
import { WARDROBE } from '@/content/lifestyle';
import { BALANCE } from '@/config/gameConfig';

/** Which stats carry a reply of each type. */
export const TYPE_STATS: Readonly<Record<ResponseType, readonly StatId[]>> = {
  joke: ['humor'],
  tease: ['humor', 'confidence'],
  compliment: ['charm'],
  question: ['charm', 'culture'],
  story: ['culture', 'charm'],
  sincere: ['charm', 'confidence'],
  bold: ['confidence'],
  exit: [],
};

/** A stat of 40 is par. Every 12 points above or below is one step. */
const STAT_PAR = 40;
const STAT_STEP = 12;

export interface ScoreInput {
  option: DialogueOptionDef;
  character: CharacterDef;
  memory: CharacterMemory;
  player: PlayerState;
  venue: VenueDef;
  /** -12..+12. */
  mood: number;
  interest: number;
  comfort: number;
  turn: number;
  /** Carried in from the darts board or a wingman. Applies on turn 1 only. */
  openingBonus: number;
}

export interface ScoreResult {
  interestDelta: number;
  comfortDelta: number;
  /** Plain-language reasons, revealed at high social awareness. */
  notes: readonly string[];
  /** True when the reply hit her dealbreaker. */
  dealbroken: boolean;
}

function statPower(
  player: PlayerState,
  character: CharacterDef,
  venue: VenueDef,
  type: ResponseType,
): number {
  const stats = TYPE_STATS[type];
  if (stats.length === 0) return 0;
  let total = 0;
  for (const stat of stats) {
    const weight = (character.statWeights[stat] ?? 1) * (venue.statWeights[stat] ?? 1);
    total += ((effectiveStat(player, stat) - STAT_PAR) / STAT_STEP) * weight;
  }
  return total / stats.length;
}

/** What you are wearing counts, but only for the first impression. */
export function firstImpressionBonus(player: PlayerState, venue: VenueDef): number {
  const outfit = player.outfitId ? WARDROBE[player.outfitId] : null;
  const suited = outfit && outfit.suitedTo.includes(venue.id) ? 2 : 0;
  const style = (effectiveStat(player, 'style') - STAT_PAR) / 20;
  return Math.round((suited + style) * 10) / 10;
}

function tagScore(
  tags: readonly TopicTag[],
  character: CharacterDef,
): { interest: number; notes: string[]; dealbroken: boolean } {
  let interest = 0;
  const notes: string[] = [];
  let dealbroken = false;

  for (const tag of tags) {
    if (tag === character.dealbreaker.tag) {
      dealbroken = true;
      interest -= 40;
      notes.push(character.dealbreaker.line);
      continue;
    }
    if (character.likes.includes(tag)) {
      interest += 2.5;
      notes.push(`She likes ${tag.replace('_', ' ')}.`);
    }
    if (character.dislikes.includes(tag)) {
      interest -= 3.5;
      notes.push(`She has no patience for ${tag.replace('_', ' ')}.`);
    }
  }
  return { interest, notes, dealbroken };
}

/**
 * Turn an authored reply into interest and comfort deltas.
 *
 * The shape of it: what you said (authored baseline) × who she is (her type
 * preferences and likes) + who you are (stats she cares about, at this venue)
 * ± how her day is going. Comfort is separate and less forgiving: pushing hard
 * while she is uncomfortable costs double.
 */
export function scoreOption(input: ScoreInput): ScoreResult {
  const { option, character, player, venue, memory, mood, comfort, turn } = input;
  const notes: string[] = [];

  const baseInterest = option.interest ?? 0;
  const baseComfort = option.comfort ?? 0;

  const preference = character.preferences[option.type] ?? 1;
  const tags = option.tags ?? [];
  const tagResult = tagScore(tags, character);
  notes.push(...tagResult.notes);

  const power = statPower(player, character, venue, option.type);
  if (power >= 1) notes.push('You have the stats to carry that.');
  if (power <= -1) notes.push('That landed above your weight class.');

  // A topic she has already covered with you is worth less the second time.
  const repeated = tags.some((tag) => memory.discussedTopics.includes(tag));
  const repetition = repeated && baseInterest > 0 ? -1.5 : 0;
  if (repeated) notes.push('You have been here before, and she remembers.');

  const perkOpener =
    turn === 1
      ? collectEffects(player, 'openerInterest').reduce((total, effect) => total + effect.amount, 0)
      : 0;
  const opening = turn === 1 ? firstImpressionBonus(player, venue) + input.openingBonus : 0;

  let interestDelta =
    baseInterest * preference + tagResult.interest + power + repetition + perkOpener + opening;

  // Her day scales everything: a good mood forgives, a bad one does not.
  const moodScale = 1 + mood / 40;
  interestDelta = interestDelta >= 0 ? interestDelta * moodScale : interestDelta / moodScale;

  // Winning her over is meant to take a few visits, so gains are dialled back.
  // Missteps are not: a bad line costs exactly what it says it costs.
  if (interestDelta > 0) interestDelta *= BALANCE.conversation.interestScale;

  // Comfort: losses are amplified by flaws and by her already being uneasy.
  const comfortDecay = collectEffects(player, 'comfortDecayMultiplier').reduce(
    (total, effect) => total * effect.multiplier,
    1,
  );
  let comfortDelta = baseComfort;
  if (comfortDelta < 0) {
    comfortDelta *= comfortDecay;
    if (comfort < 40) {
      comfortDelta *= 1.5;
      notes.push('She was already uneasy. That cost more than it would have.');
    }
  } else {
    comfortDelta *= 1 + mood / 60;
  }

  if (tagResult.dealbroken) {
    comfortDelta -= 30;
  }

  // Interest cannot run away from comfort: she will not warm to someone she is
  // not relaxed around, however good the line was.
  if (comfort < 30 && interestDelta > 0) {
    interestDelta *= 0.5;
    notes.push('She is not comfortable enough for that to land properly.');
  }

  return {
    interestDelta: Math.round(interestDelta * 10) / 10,
    comfortDelta: Math.round(comfortDelta * 10) / 10,
    notes,
    dealbroken: tagResult.dealbroken,
  };
}
