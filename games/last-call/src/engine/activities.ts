import type { ActivityId, StatId } from '@/content/ids';
import type { ActivityDef, ActivityEffect, Requirement } from '@/types/activities';
import type { Rng } from '@/types/core';
import type { GameState, LogEntry } from '@/types/game';
import type { PlayerState } from '@/types/player';
import { ACTIVITIES, getActivity } from '@/content/activities';
import { APARTMENTS, JOBS, WARDROBE } from '@/content/lifestyle';
import { HOBBIES } from '@/content/hobbies';
import { VENUES } from '@/content/venues';
import {
  absoluteDay,
  advanceSlots,
  appendLog,
  currentDay,
  currentSlot,
  makeLogEntry,
  slotsRemainingToday,
  DAY_LABELS,
  SLOT_LABELS,
} from '@/engine/calendar';
import { grantAwarenessXp, grantHobbyXp, grantStatXp } from '@/engine/progression';
import { activityEnergyDelta, maxEnergy, moneyMultiplier } from '@/engine/traits';

export const STAT_LABELS: Readonly<Record<StatId, string>> = {
  charm: 'Charm',
  humor: 'Humor',
  confidence: 'Confidence',
  fitness: 'Fitness',
  style: 'Style',
  culture: 'Culture',
};

export interface ResolvedCost {
  slots: number;
  energy: number;
  money: number;
  /** Money the activity pays out, after trait multipliers. */
  moneyGain: number;
}

/** Overtime pays a premium per slot. */
const MULTI_SLOT_PAY_BONUS = 1.2;

export function resolveCost(player: PlayerState, activity: ActivityDef): ResolvedCost {
  const job = JOBS[player.career.jobId];
  const jobEnergy = activity.usesJobPay ? job.energyPerSlot * activity.cost.slots : 0;
  const traitDelta = activityEnergyDelta(player, activity.tags);
  const energy = Math.max(0, activity.cost.energy + jobEnergy + traitDelta);
  const payBonus = activity.cost.slots > 1 ? MULTI_SLOT_PAY_BONUS : 1;
  const moneyGain = activity.usesJobPay
    ? Math.round(job.payPerSlot * activity.cost.slots * payBonus * moneyMultiplier(player))
    : 0;
  return { slots: activity.cost.slots, energy, money: activity.cost.money, moneyGain };
}

export function describeRequirement(requirement: Requirement): string {
  switch (requirement.kind) {
    case 'stat':
      return `Needs ${STAT_LABELS[requirement.stat]} ${requirement.min}`;
    case 'money':
      return `Needs $${requirement.min}`;
    case 'energy':
      return `Needs ${requirement.min} Energy`;
    case 'hobby':
      return `Needs ${HOBBIES[requirement.hobby].name} level ${requirement.minLevel}`;
    case 'jobTier':
      return `Needs a tier ${requirement.min} job`;
    case 'apartment':
      return `Needs ${APARTMENTS[requirement.apartment].name}`;
    case 'day':
      return `Only ${requirement.days.map((day) => DAY_LABELS[day]).join(', ')}`;
    case 'slot':
      return `Only in the ${requirement.slots.map((slot) => SLOT_LABELS[slot].toLowerCase()).join(' or ')}`;
    case 'flag':
      return requirement.value ? 'Not yet available' : 'Already done';
  }
}

function meetsRequirement(state: GameState, requirement: Requirement): boolean {
  const { player, clock } = state;
  switch (requirement.kind) {
    case 'stat':
      return player.stats[requirement.stat].value >= requirement.min;
    case 'money':
      return player.money >= requirement.min;
    case 'energy':
      return player.energy >= requirement.min;
    case 'hobby':
      return player.hobbies[requirement.hobby].level >= requirement.minLevel;
    case 'jobTier':
      return JOBS[player.career.jobId].tier >= requirement.min;
    case 'apartment':
      return player.apartmentId === requirement.apartment;
    case 'day':
      return requirement.days.includes(currentDay(clock));
    case 'slot':
      return requirement.slots.includes(currentSlot(clock));
    case 'flag':
      return (player.flags[requirement.flag] ?? false) === requirement.value;
  }
}

export interface Availability {
  ok: boolean;
  /** Human-readable reasons the activity is locked, shown on the card. */
  reasons: readonly string[];
}

export function checkAvailability(state: GameState, activity: ActivityDef): Availability {
  const reasons: string[] = [];
  const cost = resolveCost(state.player, activity);

  for (const requirement of activity.requirements) {
    if (!meetsRequirement(state, requirement)) reasons.push(describeRequirement(requirement));
  }
  if (cost.slots > slotsRemainingToday(state.clock)) {
    reasons.push(`Needs ${cost.slots} free slots today`);
  }
  if (state.player.energy < cost.energy) {
    reasons.push(`Needs ${cost.energy} Energy`);
  }
  if (state.player.money < cost.money) {
    reasons.push(`Needs $${cost.money}`);
  }

  const unique = [...new Set(reasons)];
  return { ok: unique.length === 0, reasons: unique };
}

/** Short "+Fitness", "+$66" style labels for the activity card. */
export function describeEffects(player: PlayerState, activity: ActivityDef): readonly string[] {
  const labels: string[] = [];
  const cost = resolveCost(player, activity);
  if (cost.moneyGain > 0) labels.push(`+$${cost.moneyGain}`);

  for (const effect of activity.effects) {
    switch (effect.kind) {
      case 'statXp':
        labels.push(`+${STAT_LABELS[effect.stat]}`);
        break;
      case 'hobbyXp':
        labels.push(`+${HOBBIES[effect.hobby].name}`);
        break;
      case 'awarenessXp':
        labels.push('+Awareness');
        break;
      case 'money':
        labels.push(effect.amount >= 0 ? `+$${effect.amount}` : `-$${Math.abs(effect.amount)}`);
        break;
      case 'energy':
        labels.push(`+${effect.amount} Energy`);
        break;
      case 'careerXp':
        labels.push('+Career');
        break;
      case 'temporaryStatBonus':
        labels.push(`${effect.label}: +${effect.amount} ${STAT_LABELS[effect.stat]}`);
        break;
      case 'unlockWardrobe':
        labels.push(WARDROBE[effect.item].name);
        break;
      case 'visitVenue':
        labels.push('Meet people');
        break;
      case 'setFlag':
        break;
    }
  }
  return labels;
}

export interface ActivityPreview {
  activity: ActivityDef;
  cost: ResolvedCost;
  effects: readonly string[];
  availability: Availability;
}

export function previewActivity(state: GameState, activity: ActivityDef): ActivityPreview {
  return {
    activity,
    cost: resolveCost(state.player, activity),
    effects: describeEffects(state.player, activity),
    availability: checkAvailability(state, activity),
  };
}

/** Everything the player could conceivably do, locked ones included. */
export function listActivities(state: GameState): readonly ActivityPreview[] {
  return Object.values(ACTIVITIES)
    .map((activity) => previewActivity(state, activity))
    .filter((preview) => {
      // Hide purchases the player already made; everything else stays visible
      // with its lock reason, so the player can see what to work towards.
      const alreadyOwned = preview.activity.effects.some(
        (effect) => effect.kind === 'unlockWardrobe' && state.player.wardrobe.includes(effect.item),
      );
      return !alreadyOwned;
    });
}

interface EffectApplication {
  state: GameState;
  entries: LogEntry[];
}

function trackStatGain(state: GameState, stat: StatId, points: number): GameState {
  if (points <= 0) return state;
  const previous = state.week.statGains[stat] ?? 0;
  return { ...state, week: { ...state.week, statGains: { ...state.week.statGains, [stat]: previous + points } } };
}

function applyEffect(state: GameState, effect: ActivityEffect, rng: Rng): EffectApplication {
  const entries: LogEntry[] = [];
  let next = state;

  switch (effect.kind) {
    case 'statXp': {
      const { player, pointsGained } = grantStatXp(next.player, effect.stat, effect.amount);
      next = trackStatGain({ ...next, player }, effect.stat, pointsGained);
      if (pointsGained > 0) {
        entries.push(
          makeLogEntry(
            next,
            `${STAT_LABELS[effect.stat]} is up to ${player.stats[effect.stat].value}.`,
            'good',
            rng,
          ),
        );
      }
      break;
    }
    case 'hobbyXp': {
      const { player, levelsGained } = grantHobbyXp(next.player, effect.hobby, effect.amount);
      next = { ...next, player };
      if (levelsGained > 0) {
        const hobby = HOBBIES[effect.hobby];
        const level = player.hobbies[effect.hobby].level;
        next = {
          ...next,
          week: { ...next.week, hobbyLevelUps: [...next.week.hobbyLevelUps, `${hobby.name} ${level}`] },
        };
        entries.push(
          makeLogEntry(next, `${hobby.name} is at level ${level}. People will notice.`, 'milestone', rng),
        );
      }
      break;
    }
    case 'awarenessXp': {
      const { player, levelsGained } = grantAwarenessXp(next.player, effect.amount);
      next = { ...next, player };
      if (levelsGained > 0) {
        entries.push(
          makeLogEntry(
            next,
            `Social awareness ${player.awareness.level}. You are picking up on more than you used to.`,
            'milestone',
            rng,
          ),
        );
      }
      break;
    }
    case 'money': {
      const amount =
        effect.amount > 0 ? Math.round(effect.amount * moneyMultiplier(next.player)) : effect.amount;
      next = { ...next, player: { ...next.player, money: Math.max(0, next.player.money + amount) } };
      next = {
        ...next,
        week:
          amount >= 0
            ? { ...next.week, moneyEarned: next.week.moneyEarned + amount }
            : { ...next.week, moneySpent: next.week.moneySpent + Math.abs(amount) },
      };
      break;
    }
    case 'energy': {
      next = { ...next, player: { ...next.player, energy: next.player.energy + effect.amount } };
      break;
    }
    case 'careerXp': {
      const career = { ...next.player.career, xp: next.player.career.xp + effect.amount };
      next = { ...next, player: { ...next.player, career } };
      break;
    }
    case 'temporaryStatBonus': {
      const temporary = {
        id: `${effect.label}-${absoluteDay(next.clock)}`,
        label: effect.label,
        stat: effect.stat,
        amount: effect.amount,
        expiresOnAbsoluteDay: absoluteDay(next.clock) + effect.days,
      };
      const withoutDuplicate = next.player.temporaryEffects.filter(
        (existing) => existing.label !== effect.label,
      );
      next = {
        ...next,
        player: { ...next.player, temporaryEffects: [...withoutDuplicate, temporary] },
      };
      entries.push(
        makeLogEntry(next, `${effect.label}: +${effect.amount} ${STAT_LABELS[effect.stat]} for ${effect.days} days.`, 'good', rng),
      );
      break;
    }
    case 'unlockWardrobe': {
      const item = WARDROBE[effect.item];
      const wardrobe = next.player.wardrobe.includes(effect.item)
        ? next.player.wardrobe
        : [...next.player.wardrobe, effect.item];
      const currentBonus = next.player.outfitId ? WARDROBE[next.player.outfitId].styleBonus : -1;
      const outfitId = item.styleBonus > currentBonus ? effect.item : next.player.outfitId;
      next = { ...next, player: { ...next.player, wardrobe, outfitId } };
      entries.push(makeLogEntry(next, `${item.name} is yours. You are wearing it out.`, 'good', rng));
      break;
    }
    case 'setFlag': {
      next = {
        ...next,
        player: { ...next.player, flags: { ...next.player.flags, [effect.flag]: effect.value } },
      };
      break;
    }
    case 'visitVenue': {
      const venue = VENUES[effect.venue];
      const reputation = (next.player.venueReputation[effect.venue] ?? 0) + 1;
      next = {
        ...next,
        player: { ...next.player, venueReputation: { ...next.player.venueReputation, [effect.venue]: reputation } },
        week: { ...next.week, venuesVisited: [...next.week.venuesVisited, effect.venue] },
      };
      entries.push(
        makeLogEntry(next, `${venue.name}: the staff are starting to recognise you.`, 'flavour', rng),
      );
      break;
    }
  }

  return { state: next, entries };
}

function checkPromotion(state: GameState, rng: Rng): EffectApplication {
  const job = JOBS[state.player.career.jobId];
  if (job.promotesTo === null || state.player.career.xp < job.xpToPromote) {
    return { state, entries: [] };
  }
  const nextJob = JOBS[job.promotesTo];
  const career = {
    ...state.player.career,
    jobId: nextJob.id,
    xp: state.player.career.xp - job.xpToPromote,
  };
  const next: GameState = { ...state, player: { ...state.player, career } };
  return {
    state: next,
    entries: [
      makeLogEntry(
        next,
        `Promoted: you are a ${nextJob.title} now. ${nextJob.blurb}`,
        'milestone',
        rng,
      ),
    ],
  };
}

export interface ActivityResult {
  ok: boolean;
  state: GameState;
  reasons: readonly string[];
  dayRolled: boolean;
  weekRolled: boolean;
}

/**
 * Resolve one activity: pay its costs, apply its effects, advance the clock.
 * Pure — hand it a state and an RNG, get a new state back.
 */
export function performActivity(state: GameState, activityId: ActivityId, rng: Rng): ActivityResult {
  const activity = getActivity(activityId);
  const availability = checkAvailability(state, activity);
  if (!availability.ok) {
    return { ok: false, state, reasons: availability.reasons, dayRolled: false, weekRolled: false };
  }

  const cost = resolveCost(state.player, activity);
  const entries: LogEntry[] = [];

  let next: GameState = {
    ...state,
    player: {
      ...state.player,
      energy: state.player.energy - cost.energy,
      money: state.player.money - cost.money + cost.moneyGain,
      career: activity.usesJobPay
        ? { ...state.player.career, shiftsThisWeek: state.player.career.shiftsThisWeek + cost.slots }
        : state.player.career,
    },
    week: {
      ...state.week,
      activitiesDone: state.week.activitiesDone + 1,
      moneyEarned: state.week.moneyEarned + cost.moneyGain,
      moneySpent: state.week.moneySpent + cost.money,
    },
    lastActivity: activityId,
  };

  entries.push(makeLogEntry(next, activity.name, 'neutral', rng));
  if (activity.flavour.length > 0) {
    entries.push(makeLogEntry(next, rng.pick(activity.flavour), 'flavour', rng));
  }

  for (const effect of activity.effects) {
    const applied = applyEffect(next, effect, rng);
    next = applied.state;
    entries.push(...applied.entries);
  }

  const promoted = checkPromotion(next, rng);
  next = promoted.state;
  entries.push(...promoted.entries);

  // Energy from effects (resting) must not exceed the player's ceiling.
  const ceiling = maxEnergy(next.player);
  next = { ...next, player: { ...next.player, energy: Math.max(0, Math.min(ceiling, next.player.energy)) } };

  const advanced = advanceSlots(next, cost.slots, rng);
  next = appendLog(advanced.state, [...entries, ...advanced.entries]);

  return {
    ok: true,
    state: next,
    reasons: [],
    dayRolled: advanced.dayRolled,
    weekRolled: advanced.weekRolled,
  };
}

/** Let the slot go by. Costs nothing but the slot itself. */
export function skipSlot(state: GameState, rng: Rng): ActivityResult {
  const idleLines = [
    'You scrolled for a while and the slot quietly left.',
    'You stood in the kitchen eating cereal over the sink, thinking about nothing.',
    'You meant to do something. The hours had other ideas.',
  ];
  const entry = makeLogEntry(state, rng.pick(idleLines), 'flavour', rng);
  const withCount: GameState = { ...state, week: { ...state.week, slotsWasted: state.week.slotsWasted + 1 } };
  const advanced = advanceSlots(withCount, 1, rng);
  return {
    ok: true,
    state: appendLog(advanced.state, [entry, ...advanced.entries]),
    reasons: [],
    dayRolled: advanced.dayRolled,
    weekRolled: advanced.weekRolled,
  };
}
