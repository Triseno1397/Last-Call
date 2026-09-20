import type { ActivityCategory } from '@/types/activities';
import type { GameState } from '@/types/game';
import type { StatId } from '@/content/ids';
import type { ActivityPreview } from '@/engine/activities';
import { listActivities } from '@/engine/activities';
import { effectiveStat } from '@/engine/progression';
import { maxEnergy } from '@/engine/traits';
import { JOBS } from '@/content/lifestyle';
import { STAT_IDS } from '@/content/ids';

export const CATEGORY_ORDER: readonly ActivityCategory[] = [
  'career',
  'self',
  'social',
  'lifestyle',
  'rest',
];

export const CATEGORY_LABELS: Readonly<Record<ActivityCategory, string>> = {
  career: 'Work',
  self: 'Yourself',
  social: 'Out there',
  lifestyle: 'Lifestyle',
  rest: 'Rest',
};

export function activitiesByCategory(
  state: GameState,
): readonly { category: ActivityCategory; items: readonly ActivityPreview[] }[] {
  const all = listActivities(state);
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: all
      .filter((preview) => preview.activity.category === category)
      .sort((a, b) => Number(b.availability.ok) - Number(a.availability.ok)),
  })).filter((group) => group.items.length > 0);
}

export interface StatReadout {
  id: StatId;
  base: number;
  effective: number;
  xp: number;
}

export function statReadouts(state: GameState): readonly StatReadout[] {
  return STAT_IDS.map((id) => ({
    id,
    base: state.player.stats[id].value,
    effective: effectiveStat(state.player, id),
    xp: state.player.stats[id].xp,
  }));
}

export function energyReadout(state: GameState): { current: number; max: number } {
  return { current: state.player.energy, max: maxEnergy(state.player) };
}

export function careerReadout(state: GameState): {
  title: string;
  tier: number;
  xp: number;
  xpToPromote: number;
} {
  const job = JOBS[state.player.career.jobId];
  return {
    title: job.title,
    tier: job.tier,
    xp: state.player.career.xp,
    xpToPromote: job.xpToPromote,
  };
}
