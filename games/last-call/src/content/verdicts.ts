import type { WeekSummary } from '@/types/game';

/**
 * End-of-week one-liners. The first matching verdict (highest priority) wins,
 * so keep specific ones above general ones. Add as many as you like: this is
 * pure content, the recap screen just reads it.
 */
export interface WeekVerdict {
  id: string;
  text: string;
  priority: number;
  applies: (summary: WeekSummary) => boolean;
}

const statPoints = (summary: WeekSummary): number =>
  Object.values(summary.statGains).reduce((total, points) => total + (points ?? 0), 0);

export const WEEK_VERDICTS: readonly WeekVerdict[] = [
  {
    id: 'ghost',
    text: 'Nobody in this city could pick you out of a line-up. A quiet week, then.',
    priority: 90,
    applies: (summary) => summary.activitiesDone <= 3,
  },
  {
    id: 'horizontal',
    text: 'You spent most of the week horizontal and thinking about it.',
    priority: 80,
    applies: (summary) => summary.slotsWasted >= 6,
  },
  {
    id: 'rich_and_unknown',
    text: 'Rich, rested, and completely unknown to everyone outside your building.',
    priority: 70,
    applies: (summary) => summary.moneyEarned >= 400 && summary.venuesVisited.length === 0,
  },
  {
    id: 'out_every_night',
    text: 'You were out more nights than in. Your liver has filed a complaint.',
    priority: 65,
    applies: (summary) => summary.venuesVisited.length >= 4,
  },
  {
    id: 'self_improvement_arc',
    text: 'A genuine self-improvement arc. Insufferable on you, but it is working.',
    priority: 60,
    applies: (summary) => statPoints(summary) >= 6,
  },
  {
    id: 'broke',
    text: 'You are running on fumes and optimism. Mostly fumes.',
    priority: 55,
    applies: (summary) => summary.moneySpent > summary.moneyEarned,
  },
  {
    id: 'balanced',
    text: 'Work, a bit of effort, a night out. Suspiciously well adjusted.',
    priority: 20,
    applies: (summary) => summary.venuesVisited.length > 0 && summary.moneyEarned > 0,
  },
  {
    id: 'default',
    text: 'The week happened. The city kept moving. So did you, slightly.',
    priority: 0,
    applies: () => true,
  },
];

export function verdictFor(summary: WeekSummary): string {
  const match = [...WEEK_VERDICTS]
    .sort((a, b) => b.priority - a.priority)
    .find((verdict) => verdict.applies(summary));
  return match?.text ?? '';
}
