import type { CharacterId, StatId, VenueId } from '@/content/ids';
import type { DayId, SlotId } from '@/types/core';

/** A venue nudges which stats matter during encounters there (Phase 2). */
export type VenuePace = 'fast' | 'medium' | 'slow';

export interface VenueScheduleEntry {
  character: CharacterId;
  days: readonly DayId[];
  slots: readonly SlotId[];
}

export interface VenueDef {
  id: VenueId;
  name: string;
  /** Short subtitle, e.g. "dive bar, sticky floors, perfect jukebox". */
  tagline: string;
  blurb: string;
  pace: VenuePace;
  /** Multipliers applied to how much each stat counts in conversation scoring. */
  statWeights: Partial<Record<StatId, number>>;
  entryCost: number;
  energyCost: number;
  openDays: readonly DayId[];
  openSlots: readonly SlotId[];
  /** Who is around, and when. Phase 2 draws the crowd from this. */
  regulars: readonly VenueScheduleEntry[];
  /** Ambient lines shown when the player walks in. */
  atmosphere: readonly string[];
  /** The venue's one mini-game, if it has one. Winning helps the next chat. */
  miniGame?: 'darts';
}
