import type { ActivityTag } from '@/types/activities';
import type { FlawId, PerkId, StatId, TraitId } from '@/content/ids';

/**
 * Tags a trait can contribute to conversations. The conversation engine
 * (Phase 2) reads these to unlock or colour dialogue options; the life-loop
 * engine ignores them.
 */
export type DialogueTag =
  | 'witty'
  | 'attentive'
  | 'grounded'
  | 'stylish'
  | 'bookish'
  | 'physical'
  | 'nervous'
  | 'overshare';

/**
 * Concrete, engine-readable modifications. Every perk and flaw is expressed
 * purely as a list of these, so adding a trait never means touching the engine.
 *
 * Effects marked "Phase 2+" are consumed by the conversation / phone systems.
 * They are declared now so trait content can be written once and stay valid.
 */
export type TraitEffect =
  // --- Life loop (Phase 1) ---
  | { kind: 'statStart'; stat: StatId; amount: number }
  | { kind: 'statGainMultiplier'; stat: StatId | 'all'; multiplier: number }
  | { kind: 'activityEnergyDelta'; tags: readonly ActivityTag[]; amount: number }
  | { kind: 'moneyMultiplier'; multiplier: number }
  | { kind: 'hobbyXpMultiplier'; multiplier: number }
  | { kind: 'maxEnergyDelta'; amount: number }
  | { kind: 'startingMoney'; amount: number }
  | { kind: 'restRecoveryMultiplier'; multiplier: number }
  | { kind: 'confidenceLossMultiplier'; multiplier: number }
  | { kind: 'confidenceOnRejection'; amount: number }
  | { kind: 'awarenessXpMultiplier'; multiplier: number }
  // --- Phase 2+ hooks (declared, not yet consumed) ---
  | { kind: 'dialogueTag'; tag: DialogueTag }
  | { kind: 'openerInterest'; amount: number }
  | { kind: 'comfortDecayMultiplier'; multiplier: number }
  | { kind: 'readCueClarity'; amount: number }
  | { kind: 'textingToneDelta'; amount: number };

export type TraitEffectKind = TraitEffect['kind'];

export type TraitEffectOf<K extends TraitEffectKind> = Extract<TraitEffect, { kind: K }>;

export interface TraitDef {
  id: TraitId;
  name: string;
  /** One line shown on the selection card. Should be funny and concrete. */
  blurb: string;
  /** Plain-language summary of the mechanical effect, shown under the blurb. */
  mechanics: string;
  effects: readonly TraitEffect[];
}

export interface PerkDef extends TraitDef {
  id: PerkId;
}

export interface FlawDef extends TraitDef {
  id: FlawId;
}
