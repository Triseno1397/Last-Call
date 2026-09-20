import type { TextTone } from '@/content/ids';

/** What the player's texts actually say, by tone. */
export const PLAYER_TEXTS: Readonly<Record<TextTone, readonly string[]>> = {
  playful: [
    "Serious question: is the jukebox rigged or are you just very confident?",
    "I have been told my texting is 'a lot'. This is your warning shot.",
    "Currently losing an argument with a kettle. Thought of you. Unclear why.",
  ],
  warm: [
    "That was a good night. I was still thinking about it on the walk home.",
    "Hope today has been kind to you. If not, I'm around.",
    "No agenda, just wanted to say I liked talking to you.",
  ],
  direct: [
    "I'd like to see you again. Properly, not in passing.",
    "Straight version: I'm interested, and I'd rather say it than orbit it.",
    "Tell me when you're free and I'll work around it.",
  ],
  callback: [
    "Still thinking about what you said.",
    "Right, I've been turning this over since:",
    "Follow-up question, three days late:",
  ],
};

export const TONE_LABELS: Readonly<Record<TextTone, string>> = {
  playful: 'Playful',
  warm: 'Warm',
  direct: 'Direct',
  callback: 'Callback',
};

export const TONE_HINTS: Readonly<Record<TextTone, string>> = {
  playful: 'Keep it light. Low risk, low reward.',
  warm: 'Say the nice thing plainly.',
  direct: 'Say what you want. Lands hard either way.',
  callback: 'Bring up something she told you. Needs something learned.',
};

export const CADENCE_NOTES = {
  doubleText: 'You have already texted today. She will notice.',
  tripleText: 'Three texts in a day is a monologue, not a conversation.',
  tooSoon: 'You got her number an hour ago. Let it breathe.',
  goodCadence: 'Good timing — long enough to want it, short enough to matter.',
  gone_quiet: 'It has been a while. That is a cold open.',
} as const;

export const ASK_OUT_LOCKED = {
  noNumber: 'You do not have her number yet.',
  notInterested: 'She is not there yet, and asking now would cost you.',
  alreadyPlanned: 'You already have plans with her.',
} as const;
