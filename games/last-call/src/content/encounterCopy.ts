import type { EncounterOutcome } from '@/content/ids';

/**
 * Copy the engine needs regardless of which dialogue provider is running: the
 * forced endings (she ran out of patience, comfort hit the floor) and the
 * summary lines for the day log.
 */
export const FORCED_ENDINGS: Readonly<Record<'she_left' | 'wind_down', readonly string[]>> = {
  she_left: [
    'She gives you the smile she gives everyone, and finds something to do at the other end of the bar.',
    'She nods, turns, and does not turn back. That is the whole answer.',
    'Someone else needs serving. Suddenly, urgently, permanently.',
  ],
  wind_down: [
    'She glances down the bar. The night is asking for her back.',
    'The conversation reaches its natural end and you both feel it arrive.',
    'She taps the bar twice. Closing the file, politely.',
  ],
};

/** When the player chooses to end it himself, rather than being let go. */
export const PLAYER_EXITS: readonly string[] = [
  'You make your excuses while it is still going well, which is its own kind of skill.',
  'You say goodnight, mean it, and leave before the conversation can sag.',
  'You take the exit. Sometimes the move is knowing when the scene is over.',
];

export const OUTCOME_LINES: Readonly<Record<EncounterOutcome, string>> = {
  number: 'You have her number.',
  date_planned: 'You have plans. Actual plans, with a time attached.',
  friendly: 'A good conversation that ended before it should have to.',
  rejected: 'That is a no, and it was a clear one.',
  she_left: 'She left. You know exactly which line did it.',
  you_left: 'You left first, which is at least a choice.',
};

export const OUTCOME_TONE: Readonly<Record<EncounterOutcome, 'good' | 'bad' | 'neutral'>> = {
  number: 'good',
  date_planned: 'good',
  friendly: 'neutral',
  rejected: 'bad',
  she_left: 'bad',
  you_left: 'neutral',
};
