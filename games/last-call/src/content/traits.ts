import type { FlawId, PerkId } from '@/content/ids';
import type { FlawDef, PerkDef } from '@/types/traits';

/**
 * Perks and flaws are pure data. Every line in `effects` is read by the engine;
 * `mechanics` is the human-readable version shown on the selection card and must
 * be kept honest with the effects list.
 */
export const PERKS: Readonly<Record<PerkId, PerkDef>> = {
  quick_wit: {
    id: 'quick_wit',
    name: 'Quick Wit',
    blurb: "You have never met a silence you couldn't fill with something stupid and charming.",
    mechanics: '+5 Humor at creation. Humor improves 20% faster. Unlocks joke-heavy replies.',
    effects: [
      { kind: 'statStart', stat: 'humor', amount: 5 },
      { kind: 'statGainMultiplier', stat: 'humor', multiplier: 1.2 },
      { kind: 'dialogueTag', tag: 'witty' },
      { kind: 'openerInterest', amount: 2 },
    ],
  },
  good_listener: {
    id: 'good_listener',
    name: 'Good Listener',
    blurb: 'You remember what people said three drinks ago. It is unsettling and it works.',
    mechanics: '+5 Charm at creation. Social awareness levels 25% faster. Body-language cues read clearer.',
    effects: [
      { kind: 'statStart', stat: 'charm', amount: 5 },
      { kind: 'awarenessXpMultiplier', multiplier: 1.25 },
      { kind: 'readCueClarity', amount: 1 },
      { kind: 'dialogueTag', tag: 'attentive' },
    ],
  },
  gym_rat: {
    id: 'gym_rat',
    name: 'Gym Rat',
    blurb: 'Your relationship with the squat rack is the healthiest one you have.',
    mechanics: '+5 Fitness at creation. Physical activities cost 6 less Energy. Fitness improves 20% faster.',
    effects: [
      { kind: 'statStart', stat: 'fitness', amount: 5 },
      { kind: 'statGainMultiplier', stat: 'fitness', multiplier: 1.2 },
      { kind: 'activityEnergyDelta', tags: ['physical'], amount: -6 },
      { kind: 'dialogueTag', tag: 'physical' },
    ],
  },
  well_read: {
    id: 'well_read',
    name: 'Well Read',
    blurb: 'You are absolutely going to bring up that book. You cannot be stopped.',
    mechanics: '+5 Culture at creation. Culture improves 20% faster. Unlocks bookish replies.',
    effects: [
      { kind: 'statStart', stat: 'culture', amount: 5 },
      { kind: 'statGainMultiplier', stat: 'culture', multiplier: 1.2 },
      { kind: 'dialogueTag', tag: 'bookish' },
    ],
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    blurb: 'You come alive after ten like a very sociable vampire.',
    mechanics: 'Nightlife costs 8 less Energy and +8 max Energy, but mornings are rough on your wallet.',
    effects: [
      { kind: 'activityEnergyDelta', tags: ['nightlife'], amount: -8 },
      { kind: 'maxEnergyDelta', amount: 8 },
      { kind: 'restRecoveryMultiplier', multiplier: 0.92 },
    ],
  },
  dress_sense: {
    id: 'dress_sense',
    name: 'Dress Sense',
    blurb: 'You own exactly one outfit that works and you know precisely when to deploy it.',
    mechanics: '+5 Style at creation. Style improves 25% faster. Clothes cost you 10% less.',
    effects: [
      { kind: 'statStart', stat: 'style', amount: 5 },
      { kind: 'statGainMultiplier', stat: 'style', multiplier: 1.25 },
      { kind: 'dialogueTag', tag: 'stylish' },
    ],
  },
  thick_skin: {
    id: 'thick_skin',
    name: 'Thick Skin',
    blurb: 'Getting shot down stings for about nine seconds, then you want a snack.',
    mechanics: 'Confidence dips from failure streaks are halved, and rejections give +2 extra Confidence.',
    effects: [
      { kind: 'statStart', stat: 'confidence', amount: 3 },
      { kind: 'confidenceLossMultiplier', multiplier: 0.5 },
      { kind: 'confidenceOnRejection', amount: 2 },
      { kind: 'dialogueTag', tag: 'grounded' },
    ],
  },
  hustler: {
    id: 'hustler',
    name: 'Hustler',
    blurb: 'Three side gigs, none of which you can explain at a party without losing the room.',
    mechanics: 'All money earned is 20% higher. +80 starting money.',
    effects: [
      { kind: 'moneyMultiplier', multiplier: 1.2 },
      { kind: 'startingMoney', amount: 80 },
    ],
  },
};

export const FLAWS: Readonly<Record<FlawId, FlawDef>> = {
  awkward_texter: {
    id: 'awkward_texter',
    name: 'Awkward Texter',
    blurb: 'Your texts read like a hostage note written by a very polite robot.',
    mechanics: 'Texting lands worse (Phase 4). Charm improves 10% slower.',
    effects: [
      { kind: 'textingToneDelta', amount: -2 },
      { kind: 'statGainMultiplier', stat: 'charm', multiplier: 0.9 },
    ],
  },
  overthinker: {
    id: 'overthinker',
    name: 'Overthinker',
    blurb: 'You rehearse conversations in the shower and lose every single one.',
    mechanics: '-12 max Energy and her comfort drains faster, but you notice everything: awareness +30%.',
    effects: [
      { kind: 'maxEnergyDelta', amount: -12 },
      { kind: 'comfortDecayMultiplier', multiplier: 1.2 },
      { kind: 'awarenessXpMultiplier', multiplier: 1.3 },
    ],
  },
  lightweight: {
    id: 'lightweight',
    name: 'Lightweight',
    blurb: 'Two drinks in and you are telling the bartender about your father.',
    mechanics: 'Nightlife costs 12 more Energy and comfort slips faster when you are out.',
    effects: [
      { kind: 'activityEnergyDelta', tags: ['nightlife'], amount: 12 },
      { kind: 'comfortDecayMultiplier', multiplier: 1.15 },
    ],
  },
  workaholic: {
    id: 'workaholic',
    name: 'Workaholic',
    blurb: 'Work is easy. Work does not leave you on read for eleven hours.',
    mechanics: 'Money earned +15%, but social activities cost 8 more Energy and Charm improves 15% slower.',
    effects: [
      { kind: 'moneyMultiplier', multiplier: 1.15 },
      { kind: 'activityEnergyDelta', tags: ['social'], amount: 8 },
      { kind: 'statGainMultiplier', stat: 'charm', multiplier: 0.85 },
    ],
  },
  chronically_broke: {
    id: 'chronically_broke',
    name: 'Chronically Broke',
    blurb: 'Money is a concept that seems to happen to other people.',
    mechanics: '-110 starting money and Style improves 15% slower, because upkeep costs money.',
    effects: [
      { kind: 'startingMoney', amount: -110 },
      { kind: 'statGainMultiplier', stat: 'style', multiplier: 0.85 },
    ],
  },
  name_forgetter: {
    id: 'name_forgetter',
    name: 'Name Forgetter',
    blurb: "You have called four people 'man' this week. Two of them were named Beth.",
    mechanics: 'Body-language cues read vaguer and awareness levels 15% slower.',
    effects: [
      { kind: 'readCueClarity', amount: -1 },
      { kind: 'awarenessXpMultiplier', multiplier: 0.85 },
      { kind: 'dialogueTag', tag: 'nervous' },
    ],
  },
};

export const PERK_LIST: readonly PerkDef[] = Object.values(PERKS);
export const FLAW_LIST: readonly FlawDef[] = Object.values(FLAWS);
