import type { ActivityId, StatId, VenueId } from '@/content/ids';
import type { ContentRating, GameClock } from '@/types/core';
import type { PlayerState } from '@/types/player';

/** Screens the UI can be on. 'title' and 'creation' exist before a game does. */
export type ScreenId = 'title' | 'creation' | 'city' | 'dayEnd' | 'weekEnd';

export type LogTone = 'neutral' | 'good' | 'bad' | 'flavour' | 'milestone';

export interface LogEntry {
  id: string;
  week: number;
  dayIndex: number;
  slotIndex: number;
  text: string;
  tone: LogTone;
}

/** Accumulators reset at the start of each week, used for the recap screen. */
export interface WeekSummary {
  week: number;
  moneyEarned: number;
  moneySpent: number;
  statGains: Partial<Record<StatId, number>>;
  hobbyLevelUps: readonly string[];
  venuesVisited: readonly VenueId[];
  activitiesDone: number;
  slotsWasted: number;
  highlights: readonly string[];
}

export interface GameSettings {
  contentRating: ContentRating;
  reducedMotion: boolean;
  /** Forces numeric meters on even at low awareness. Off by default. */
  alwaysShowMeters: boolean;
}

export interface GameState {
  clock: GameClock;
  player: PlayerState;
  log: readonly LogEntry[];
  week: WeekSummary;
  /** The week that just ended, shown on the recap screen. */
  lastWeek: WeekSummary | null;
  settings: GameSettings;
  /** Seed + cursor so a loaded save keeps rolling the same dice. */
  rngSeed: number;
  rngCursor: number;
  /** Last activity resolved, for the UI to highlight. */
  lastActivity: ActivityId | null;
  startedAt: number;
}
