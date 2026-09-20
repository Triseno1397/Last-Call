/**
 * Sound hooks.
 *
 * No audio ships with the prototype, but every moment that should make a noise
 * already calls `playCue`. Dropping real sound in means registering a player
 * once at startup — no call sites change.
 *
 *   registerAudioPlayer((cue) => howler.play(cue));
 */
export const AUDIO_CUES = [
  'ui_tap',
  'ui_back',
  'slot_spent',
  'day_end',
  'week_end',
  'stat_up',
  'money_in',
  'venue_enter',
  'line_her',
  'line_you',
  'interest_up',
  'interest_down',
  'comfort_down',
  'outcome_number',
  'outcome_reject',
  'text_sent',
  'text_received',
  'date_start',
  'darts_hit',
  'darts_miss',
] as const;

export type AudioCue = (typeof AUDIO_CUES)[number];

type AudioPlayer = (cue: AudioCue) => void;

let player: AudioPlayer | null = null;
let muted = false;

export function registerAudioPlayer(next: AudioPlayer | null): void {
  player = next;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/** Fire a cue. Silent until a player is registered; never throws. */
export function playCue(cue: AudioCue): void {
  if (muted || !player) return;
  try {
    player(cue);
  } catch {
    // A broken sound must never break a conversation.
  }
}
