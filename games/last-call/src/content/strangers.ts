/**
 * The people who are not the story.
 *
 * Everyone on the block is someone, so everyone can be spoken to. These are
 * not romanceable characters and they keep no memory: they have a name, a job,
 * a mood and an opinion, and they will talk to you about whatever you bring up.
 * The point is that the street is populated rather than decorated.
 *
 * Each one is bound to a walker by index, so the person you see pacing the
 * pavement is the person you get.
 */
export interface StrangerDef {
  id: string;
  name: string;
  /** One line of who they are, handed to the model as their whole brief. */
  persona: string;
  /** Openers for when there is no model to ask. */
  opens: readonly string[];
  /** Generic replies for scripted mode, when the player says something. */
  replies: readonly string[];
  /** How they sign off. */
  exits: readonly string[];
}

export const STRANGERS: readonly StrangerDef[] = [
  {
    id: 'courier',
    name: 'Bike courier',
    persona:
      'A bike courier in her thirties, four deliveries behind, permanently mid-sprint. Talks fast, swears at traffic, secretly loves this city. Will give directions nobody asked for.',
    opens: [
      "You're standing in the bike lane. I'm not moving you, I'm just telling you.",
      'Four drops behind and the lift at the tower is out again. Ask me how my day is.',
      "If you're looking for the bar, it's that way, and it's not open yet.",
    ],
    replies: [
      "Sure. Anyway, I've got eleven minutes to get across the river.",
      'You know what, fair. Most people just move out the way and say nothing.',
      "I'd love to keep going but the app is screaming at me.",
    ],
    exits: ['She clips back into her pedals and is gone before you finish the sentence.'],
  },
  {
    id: 'busker',
    name: 'Busker',
    persona:
      'A man in his late twenties with a battered guitar and a very specific set list. Cheerful, a bit of a philosopher, takes requests badly. Believes the acoustics on this corner are the best in the city.',
    opens: [
      'Acoustics on this corner are unreal. That is not an opinion, that is the wall behind me.',
      "You've got the face of someone about to request something I don't know.",
      'Two pounds is two pounds, but honestly, an opinion is worth more right now.',
    ],
    replies: [
      'See, that I can work with.',
      "I'm going to think about that during the slow one.",
      'You are the third person to say that today and the first to mean it.',
    ],
    exits: ['He nods, retunes something that did not need retuning, and starts playing again.'],
  },
  {
    id: 'regular',
    name: 'The regular',
    persona:
      'A woman in her fifties who has lived on this street for thirty years and watched every business on it fail twice. Dry, unhurried, knows everyone. Treats gossip as a civic duty.',
    opens: [
      'That place was a florist. Then a phone shop. Then a florist again. Give it a year.',
      "You're new. I'd say I'm being friendly but mostly I'm being nosy.",
      'Whatever you are looking for, it closed in 2019.',
    ],
    replies: [
      'Hm. Well. You would think that, and you would be half right.',
      'Now that is the first interesting thing anyone has said to me today.',
      "I'll allow it.",
    ],
    exits: ['She gives you a look that files you somewhere, and carries on.'],
  },
  {
    id: 'night_shift',
    name: 'Night shift',
    persona:
      'A man in his forties finishing a hospital shift, still in scrubs under a coat, running on the specific calm of someone who has been awake too long. Kind, blunt, unimpressed by small problems.',
    opens: [
      'Do not ask me how my night was. Ask me about literally anything else.',
      'I am eleven hours in and everything is funny now, so this should go well.',
      'You look like a man with a normal problem. Please, tell me a normal problem.',
    ],
    replies: [
      'That is genuinely the most reasonable thing I have heard since Tuesday.',
      'Right. Yeah. I do not have the energy to disagree, so you win.',
      "Hold that thought — actually no, don't, I won't remember it.",
    ],
    exits: ['He raises a hand, already walking, already half asleep.'],
  },
  {
    id: 'student',
    name: 'Film student',
    persona:
      'A film student in her early twenties with a camera she is not currently using. Talks in references, opinions eighty per cent formed, genuinely delightful. Thinks this street is very cinematic at this hour.',
    opens: [
      'The light on this street right now is doing something I cannot afford to recreate.',
      'Do not move, actually — no, sorry, that was weird. Hi.',
      'I am supposed to be shooting a two-minute short and I have four seconds.',
    ],
    replies: [
      'Okay but that is basically the whole third act of a film I love.',
      'I am stealing that. I am telling you I am stealing it, so it is fine.',
      'See, this is why I do not shoot on a schedule.',
    ],
    exits: ['She lifts the camera, decides against it, and wanders off composing the shot anyway.'],
  },
];

export function strangerFor(index: number): StrangerDef {
  return STRANGERS[index % STRANGERS.length]!;
}
