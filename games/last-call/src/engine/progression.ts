import type { HobbyId, StatId } from '@/content/ids';
import type { AwarenessProgress, HobbyProgress, StatValue } from '@/types/core';
import type { PlayerState } from '@/types/player';
import { BALANCE } from '@/config/gameConfig';
import { WARDROBE } from '@/content/lifestyle';
import {
  awarenessXpMultiplier,
  confidenceLossMultiplier,
  hobbyXpMultiplier,
  rejectionConfidenceBonus,
  statGainMultiplier,
} from '@/engine/traits';

export function clampStat(value: number): number {
  return Math.min(BALANCE.stats.max, Math.max(BALANCE.stats.min, Math.round(value)));
}

/** XP needed for the next point. Rises with the stat, so 80 -> 81 is a grind. */
export function xpForNextStatPoint(value: number): number {
  return Math.round(BALANCE.stats.xpBase + value * BALANCE.stats.xpSlope);
}

export function addStatXp(stat: StatValue, xp: number): { stat: StatValue; pointsGained: number } {
  if (xp <= 0) return { stat, pointsGained: 0 };
  let { value, xp: banked } = stat;
  banked += xp;
  let pointsGained = 0;
  while (value < BALANCE.stats.max && banked >= xpForNextStatPoint(value)) {
    banked -= xpForNextStatPoint(value);
    value += 1;
    pointsGained += 1;
  }
  if (value >= BALANCE.stats.max) {
    value = BALANCE.stats.max;
    banked = 0;
  }
  return { stat: { value, xp: banked }, pointsGained };
}

export function xpForNextHobbyLevel(level: number): number {
  return Math.round(BALANCE.hobbies.xpBase * Math.pow(level + 1, BALANCE.hobbies.xpCurve));
}

export function addHobbyXp(
  hobby: HobbyProgress,
  xp: number,
): { hobby: HobbyProgress; levelsGained: number } {
  if (xp <= 0) return { hobby, levelsGained: 0 };
  let { level, xp: banked } = hobby;
  banked += xp;
  let levelsGained = 0;
  while (level < BALANCE.hobbies.maxLevel && banked >= xpForNextHobbyLevel(level)) {
    banked -= xpForNextHobbyLevel(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= BALANCE.hobbies.maxLevel) {
    level = BALANCE.hobbies.maxLevel;
    banked = 0;
  }
  return { hobby: { level, xp: banked }, levelsGained };
}

export function xpForNextAwarenessLevel(level: number): number {
  return Math.round(BALANCE.awareness.xpBase * Math.pow(level + 1, BALANCE.awareness.xpCurve));
}

export function addAwarenessXp(
  awareness: AwarenessProgress,
  xp: number,
): { awareness: AwarenessProgress; levelsGained: number } {
  if (xp <= 0) return { awareness, levelsGained: 0 };
  let { level, xp: banked } = awareness;
  banked += xp;
  let levelsGained = 0;
  while (level < BALANCE.awareness.maxLevel && banked >= xpForNextAwarenessLevel(level)) {
    banked -= xpForNextAwarenessLevel(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= BALANCE.awareness.maxLevel) {
    level = BALANCE.awareness.maxLevel;
    banked = 0;
  }
  return { awareness: { level, xp: banked }, levelsGained };
}

/** Grant stat XP through the player's trait multipliers. */
export function grantStatXp(
  player: PlayerState,
  stat: StatId,
  rawXp: number,
): { player: PlayerState; pointsGained: number } {
  const xp = Math.round(rawXp * statGainMultiplier(player, stat));
  const { stat: next, pointsGained } = addStatXp(player.stats[stat], xp);
  return { player: { ...player, stats: { ...player.stats, [stat]: next } }, pointsGained };
}

export function grantHobbyXp(
  player: PlayerState,
  hobby: HobbyId,
  rawXp: number,
): { player: PlayerState; levelsGained: number } {
  const xp = Math.round(rawXp * hobbyXpMultiplier(player));
  const { hobby: next, levelsGained } = addHobbyXp(player.hobbies[hobby], xp);
  return { player: { ...player, hobbies: { ...player.hobbies, [hobby]: next } }, levelsGained };
}

export function grantAwarenessXp(
  player: PlayerState,
  rawXp: number,
): { player: PlayerState; levelsGained: number } {
  const xp = Math.round(rawXp * awarenessXpMultiplier(player));
  const { awareness, levelsGained } = addAwarenessXp(player.awareness, xp);
  return { player: { ...player, awareness }, levelsGained };
}

/** Directly nudge a stat value (used for confidence swings), respecting bounds. */
export function adjustStat(player: PlayerState, stat: StatId, delta: number): PlayerState {
  const current = player.stats[stat];
  const value = clampStat(current.value + delta);
  const xp = value === current.value ? current.xp : 0;
  return { ...player, stats: { ...player.stats, [stat]: { value, xp } } };
}

/**
 * The effective value of a stat right now: the base value plus any temporary
 * bonuses, plus the style bonus of the outfit being worn.
 */
export function effectiveStat(player: PlayerState, stat: StatId): number {
  const temporary = player.temporaryEffects
    .filter((effect) => effect.stat === stat)
    .reduce((total, effect) => total + effect.amount, 0);
  const outfit =
    stat === 'style' && player.outfitId ? WARDROBE[player.outfitId].styleBonus : 0;
  return clampStat(player.stats[stat].value + temporary + outfit);
}

export type SocialOutcome = 'success' | 'rejection' | 'failure';

export interface SocialOutcomeResult {
  player: PlayerState;
  confidenceDelta: number;
  notes: readonly string[];
}

/**
 * Confidence is dynamic. Wins raise it, surviving a rejection raises it a little
 * and always pays XP, and only a *streak* of failures knocks it back.
 * Phase 2 calls this at the end of every encounter.
 */
export function registerSocialOutcome(
  player: PlayerState,
  outcome: SocialOutcome,
): SocialOutcomeResult {
  const notes: string[] = [];
  const before = player.stats.confidence.value;
  let next = player;

  if (outcome === 'success') {
    next = adjustStat(next, 'confidence', BALANCE.confidence.successGain);
    next = { ...next, confidence: { successes: next.confidence.successes + 1, failures: 0 } };
    notes.push('That went well, and you know it.');
  } else {
    const failures = next.confidence.failures + 1;
    if (outcome === 'rejection') {
      const gain = BALANCE.confidence.rejectionGain + rejectionConfidenceBonus(next);
      next = adjustStat(next, 'confidence', gain);
      notes.push('She said no. You are still standing, which counts for something.');
    } else {
      notes.push('That did not land. You will replay it later, at length.');
    }

    const xp = outcome === 'rejection' ? BALANCE.confidence.rejectionXp : BALANCE.confidence.rejectionXp / 2;
    const granted = grantAwarenessXp(next, xp);
    next = granted.player;
    if (granted.levelsGained > 0) notes.push('You are reading rooms better than you were.');

    if (failures >= BALANCE.confidence.failureStreakThreshold) {
      const loss = Math.round(BALANCE.confidence.failureStreakLoss * confidenceLossMultiplier(next));
      next = adjustStat(next, 'confidence', -loss);
      next = { ...next, confidence: { successes: 0, failures: 0 } };
      notes.push('A rough run. It is showing in how you walk into rooms.');
    } else {
      next = { ...next, confidence: { successes: 0, failures } };
    }
  }

  return { player: next, confidenceDelta: next.stats.confidence.value - before, notes };
}
