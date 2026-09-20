import type { FlawId, Gender, HobbyId, PerkId, StatId, WardrobeItemId } from '@/content/ids';
import type { Appearance, PlayerState } from '@/types/player';
import type { GameState } from '@/types/game';
import type { StatBlock } from '@/types/core';
import { HOBBY_IDS, STAT_IDS } from '@/content/ids';
import { FLAWS, PERKS } from '@/content/traits';
import {
  STARTING_APARTMENT,
  STARTING_JOB,
  STARTING_WARDROBE,
  WARDROBE,
} from '@/content/lifestyle';
import { BUILDS, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, VIBES } from '@/content/appearance';
import { BALANCE, CONTENT_RATING } from '@/config/gameConfig';
import { emptyWeekSummary } from '@/engine/calendar';
import { maxEnergy } from '@/engine/traits';
import { clampStat } from '@/engine/progression';

export interface CreationChoices {
  name: string;
  gender: Gender;
  appearance: Appearance;
  perks: readonly PerkId[];
  flaw: FlawId;
  /** The thing you already do. Starts at level 1. */
  startingHobby: HobbyId;
}

export const PERKS_TO_PICK = 2;

export function validateCreation(choices: CreationChoices): readonly string[] {
  const problems: string[] = [];
  const name = choices.name.trim();
  if (name.length === 0) problems.push('Your character needs a name.');
  if (name.length > 24) problems.push('That name is too long for a bar tab.');
  if (choices.perks.length !== PERKS_TO_PICK) problems.push(`Pick exactly ${PERKS_TO_PICK} perks.`);
  if (new Set(choices.perks).size !== choices.perks.length) problems.push('Pick two different perks.');
  for (const perk of choices.perks) {
    if (!(perk in PERKS)) problems.push(`Unknown perk: ${perk}`);
  }
  if (!(choices.flaw in FLAWS)) problems.push('Pick a flaw. Everyone has one.');
  if (!HOBBY_IDS.includes(choices.startingHobby)) problems.push('Pick something you already do.');
  if (choices.gender !== 'man' && choices.gender !== 'woman') problems.push('Pick man or woman.');

  const appearanceChecks: readonly [readonly { id: string }[], string, string][] = [
    [HAIR_STYLES, choices.appearance.hairStyle, 'hair style'],
    [HAIR_COLORS, choices.appearance.hairColor, 'hair colour'],
    [EYE_COLORS, choices.appearance.eyeColor, 'eye colour'],
    [BUILDS, choices.appearance.build, 'build'],
    [VIBES, choices.appearance.vibe, 'vibe'],
  ];
  for (const [options, value, label] of appearanceChecks) {
    if (!options.some((option) => option.id === value)) problems.push(`Unknown ${label}.`);
  }

  return problems;
}

function startingStats(perks: readonly PerkId[], flaw: FlawId): StatBlock {
  const stats = Object.fromEntries(
    STAT_IDS.map((stat) => [stat, { value: BALANCE.stats.startingValue, xp: 0 }]),
  ) as StatBlock;

  const traits = [...perks.map((perk) => PERKS[perk]), FLAWS[flaw]];
  for (const trait of traits) {
    for (const effect of trait.effects) {
      if (effect.kind === 'statStart') {
        const stat: StatId = effect.stat;
        stats[stat] = { value: clampStat(stats[stat].value + effect.amount), xp: 0 };
      }
    }
  }
  return stats;
}

function startingMoney(perks: readonly PerkId[], flaw: FlawId): number {
  const traits = [...perks.map((perk) => PERKS[perk]), FLAWS[flaw]];
  let money = BALANCE.money.startingMoney;
  for (const trait of traits) {
    for (const effect of trait.effects) {
      if (effect.kind === 'startingMoney') money += effect.amount;
    }
  }
  return Math.max(0, money);
}

function bestOutfit(items: readonly WardrobeItemId[]): WardrobeItemId | null {
  let best: WardrobeItemId | null = null;
  for (const item of items) {
    if (best === null || WARDROBE[item].styleBonus > WARDROBE[best].styleBonus) best = item;
  }
  return best;
}

export function createPlayer(choices: CreationChoices): PlayerState {
  const hobbies = Object.fromEntries(
    HOBBY_IDS.map((hobby) => [
      hobby,
      hobby === choices.startingHobby ? { level: 1, xp: 0 } : { level: 0, xp: 0 },
    ]),
  ) as PlayerState['hobbies'];

  const flags: Record<string, boolean> = {};
  for (const item of STARTING_WARDROBE) flags[`owns_${item}`] = true;

  const player: PlayerState = {
    name: choices.name.trim(),
    gender: choices.gender,
    appearance: choices.appearance,
    perks: [...choices.perks],
    flaw: choices.flaw,
    stats: startingStats(choices.perks, choices.flaw),
    hobbies,
    awareness: { level: 0, xp: 0 },
    money: startingMoney(choices.perks, choices.flaw),
    energy: 0,
    career: { jobId: STARTING_JOB, xp: 0, shiftsThisWeek: 0 },
    apartmentId: STARTING_APARTMENT,
    wardrobe: [...STARTING_WARDROBE],
    outfitId: bestOutfit(STARTING_WARDROBE),
    confidence: { successes: 0, failures: 0 },
    temporaryEffects: [],
    venueReputation: {},
    flags,
  };

  return { ...player, energy: maxEnergy(player) };
}

export function createNewGame(choices: CreationChoices, seed: number): GameState {
  const player = createPlayer(choices);
  return {
    clock: { week: 1, dayIndex: 0, slotIndex: 0 },
    player,
    characters: {},
    phone: { threads: {}, tipsGiven: [], lastTipDay: null },
    dates: [],
    log: [
      {
        id: 'intro-0',
        week: 1,
        dayIndex: 0,
        slotIndex: 0,
        text: `Monday. ${player.name}, one room, one job, and a city that has not noticed you yet.`,
        tone: 'milestone',
      },
    ],
    week: emptyWeekSummary(1),
    lastWeek: null,
    settings: {
      contentRating: CONTENT_RATING,
      reducedMotion: false,
      alwaysShowMeters: false,
      sound: true,
      showTips: true,
      dialogueMode: 'scripted',
      aiModel: 'claude-opus-5',
    },
    rngSeed: seed,
    rngCursor: 0,
    lastActivity: null,
    startedAt: Date.now(),
  };
}
