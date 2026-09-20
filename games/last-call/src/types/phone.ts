import type { CharacterId, DateIdeaId, HobbyId, StatId, TextTone, VenueId } from '@/content/ids';

export interface TextMessage {
  id: string;
  from: 'you' | 'her' | 'wingman';
  text: string;
  /** Absolute day it was sent, for cadence rules. */
  day: number;
  tone?: TextTone;
  /** Interest change this message caused, for the awareness readout. */
  delta?: number;
}

export interface PhoneThread {
  messages: readonly TextMessage[];
  lastSentDay: number | null;
  lastReceivedDay: number | null;
  /** Texts the player sent on `lastSentDay`, for double-texting rules. */
  sentToday: number;
  unread: boolean;
}

export interface PhoneState {
  threads: Readonly<Partial<Record<string, PhoneThread>>>;
  /** Tips already given, so the wingman does not repeat himself. */
  tipsGiven: readonly string[];
  lastTipDay: number | null;
}

export interface ScheduledDate {
  characterId: CharacterId;
  ideaId: DateIdeaId;
  week: number;
  dayIndex: number;
  slotIndex: number;
  /** Set once the date has been played or missed. */
  resolved: boolean;
}

export interface DateIdeaDef {
  id: DateIdeaId;
  name: string;
  /** Where it happens, in words. */
  where: string;
  blurb: string;
  cost: number;
  energy: number;
  /** Hobbies that unlock this idea for the player. */
  requiresHobby?: HobbyId;
  requiresStat?: { stat: StatId; min: number };
  /** Characters who love this idea get a bonus; it is read from her interests. */
  appealsTo: readonly HobbyId[];
  /** Venue the date is set at, when it is one of the city's venues. */
  venue?: VenueId;
  /** Opening interest bonus when the idea matches her. */
  matchBonus: number;
}
