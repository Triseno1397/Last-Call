/**
 * First-run coaching. Each tip fires once, is stored as a player flag, and can
 * be turned off wholesale in settings. Written to be read in two seconds.
 */
export interface OnboardingTip {
  id: string;
  title: string;
  body: string;
}

export const TIPS: Readonly<Record<string, OnboardingTip>> = {
  city: {
    id: 'city',
    title: 'Three slots a day',
    body: "Tap one of the cards below to spend this slot — that is how the day moves. Morning, afternoon, evening, then the next day. Greyed-out cards still tap: they tell you what you would need, or what night that place opens.",
  },
  venue: {
    id: 'venue',
    title: 'Who is out tonight',
    body: 'People keep schedules. If she is not here, she is somewhere else on a different night. The dartboard is worth your time before you say hello.',
  },
  encounter: {
    id: 'encounter',
    title: 'You cannot read her yet',
    body: "No meters at first — just her face and what she does with her hands. Social awareness grows every time you talk to someone, and the meters fade in as it does. Pushing too fast drains her comfort, and comfort ends conversations.",
  },
  rejection: {
    id: 'rejection',
    title: 'That one did not work',
    body: 'Good. Rejection pays experience, and surviving one raises confidence. Only a run of bad nights knocks you back.',
  },
  phone: {
    id: 'phone',
    title: 'Timing counts',
    body: 'Texting twice in a day reads as need. Going quiet for a week reads as indifference. Bring up something she told you and she will notice you were listening.',
  },
  date: {
    id: 'date',
    title: 'Turn up',
    body: 'A date costs money and energy up front and takes the whole slot. Miss it and she will tell you about it. Miss two and she is gone.',
  },
};

export const TIP_ORDER: readonly string[] = ['city', 'venue', 'encounter', 'rejection', 'phone', 'date'];
