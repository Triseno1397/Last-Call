import type { StatId } from '@/content/ids';
import type { ActivityTag } from '@/types/activities';
import type { DialogueTag, TraitDef, TraitEffectKind, TraitEffectOf } from '@/types/traits';
import type { PlayerState } from '@/types/player';
import { FLAWS, PERKS } from '@/content/traits';
import { APARTMENTS } from '@/content/lifestyle';
import { BALANCE } from '@/config/gameConfig';

export function traitsOf(player: PlayerState): readonly TraitDef[] {
  return [...player.perks.map((id) => PERKS[id]), FLAWS[player.flaw]];
}

/** Every trait effect of one kind the player currently has. */
export function collectEffects<K extends TraitEffectKind>(
  player: PlayerState,
  kind: K,
): readonly TraitEffectOf<K>[] {
  const found: TraitEffectOf<K>[] = [];
  for (const trait of traitsOf(player)) {
    for (const effect of trait.effects) {
      if (effect.kind === kind) found.push(effect as TraitEffectOf<K>);
    }
  }
  return found;
}

function product(multipliers: readonly number[]): number {
  return multipliers.reduce((total, value) => total * value, 1);
}

export function statGainMultiplier(player: PlayerState, stat: StatId): number {
  return product(
    collectEffects(player, 'statGainMultiplier')
      .filter((effect) => effect.stat === stat || effect.stat === 'all')
      .map((effect) => effect.multiplier),
  );
}

/** Energy adjustment (can be negative) for an activity carrying these tags. */
export function activityEnergyDelta(player: PlayerState, tags: readonly ActivityTag[]): number {
  return collectEffects(player, 'activityEnergyDelta')
    .filter((effect) => effect.tags.some((tag) => tags.includes(tag)))
    .reduce((total, effect) => total + effect.amount, 0);
}

export function moneyMultiplier(player: PlayerState): number {
  return product(collectEffects(player, 'moneyMultiplier').map((effect) => effect.multiplier));
}

export function hobbyXpMultiplier(player: PlayerState): number {
  return product(collectEffects(player, 'hobbyXpMultiplier').map((effect) => effect.multiplier));
}

export function awarenessXpMultiplier(player: PlayerState): number {
  return product(collectEffects(player, 'awarenessXpMultiplier').map((effect) => effect.multiplier));
}

export function restRecoveryMultiplier(player: PlayerState): number {
  return product(collectEffects(player, 'restRecoveryMultiplier').map((effect) => effect.multiplier));
}

export function confidenceLossMultiplier(player: PlayerState): number {
  return product(collectEffects(player, 'confidenceLossMultiplier').map((effect) => effect.multiplier));
}

export function rejectionConfidenceBonus(player: PlayerState): number {
  return collectEffects(player, 'confidenceOnRejection').reduce(
    (total, effect) => total + effect.amount,
    0,
  );
}

export function maxEnergy(player: PlayerState): number {
  const apartment = APARTMENTS[player.apartmentId];
  const traitDelta = collectEffects(player, 'maxEnergyDelta').reduce(
    (total, effect) => total + effect.amount,
    0,
  );
  return Math.max(40, BALANCE.energy.base + apartment.maxEnergyBonus + traitDelta);
}

/** Phase 2: the conversation engine reads these to unlock flavoured replies. */
export function dialogueTags(player: PlayerState): readonly DialogueTag[] {
  return collectEffects(player, 'dialogueTag').map((effect) => effect.tag);
}

/** Phase 2: how legible her body language is before meters unlock. */
export function readCueClarity(player: PlayerState): number {
  return collectEffects(player, 'readCueClarity').reduce((total, effect) => total + effect.amount, 0);
}
