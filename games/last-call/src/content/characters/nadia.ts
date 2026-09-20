import type { CharacterDef } from '@/types/character';
import type { DialogueTree } from '@/types/dialogue';

/**
 * Nadia Volkov — the competitive one.
 *
 * Voice rules:
 *  - Blunt, fast, and a bit mean in the way friends are mean.
 *  - She turns everything into a bet, a rep count, or a dare.
 *  - Small talk bores her visibly and she does not hide it.
 *  - She likes being met head on. She has no interest in being handled.
 */
const dialogue: DialogueTree = {
  openings: {
    stranger: 'open_stranger',
    acquaintance: 'open_acquaintance',
    interested: 'open_interested',
    friend: 'open_acquaintance',
    not_interested: 'open_cold',
  },

  nodes: {
    open_stranger: {
      id: 'open_stranger',
      lines: [
        {
          mood: 'good',
          text: "You've been circling this rack for two sets. Either use it or commit to the circling, both are valid.",
          expression: 'amused',
          cue: 'She is sitting on the bench with her forearms on her knees, grinning at you.',
        },
        {
          mood: 'okay',
          text: "You want in? I've got two sets left and I do not rest long.",
          expression: 'neutral',
          cue: 'She is already chalking up. The conversation is happening at her pace.',
        },
        {
          mood: 'bad',
          text: "Headphones are in for a reason, but go on. Quickly.",
          expression: 'annoyed',
          cue: 'One earbud out. One. You are on a timer and you can feel it.',
        },
      ],
      options: [
        {
          id: 'open_direct',
          type: 'bold',
          text: "I'll work in. I'll also be slower than you and I've made peace with it.",
          tags: ['direct', 'fitness'],
          interest: 6,
          comfort: 3,
          next: 'work_in',
        },
        {
          id: 'open_joke',
          type: 'joke',
          text: "I'm committing to the circling. It's my main lift.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'circling_joke',
        },
        {
          id: 'open_question',
          type: 'question',
          text: "What are you training for? Nobody moves like that for general health.",
          tags: ['curiosity', 'fitness'],
          interest: 5,
          comfort: 2,
          learn: ['nadia_competes'],
          next: 'topic_meet',
        },
        {
          id: 'open_neg',
          type: 'compliment',
          text: "You're seriously strong. For a girl, I mean — that's impressive.",
          tags: ['negging'],
          interest: -10,
          comfort: -8,
          next: 'nadia_done',
        },
        {
          id: 'open_smalltalk',
          type: 'story',
          text: "Busy in here today, isn't it. Always is on a Monday.",
          tags: ['small_talk'],
          interest: -5,
          comfort: -1,
          next: 'bored_fast',
        },
        {
          id: 'open_exit',
          type: 'exit',
          text: "You're mid-set. I'll get out of your way.",
          tags: ['direct'],
          comfort: 2,
          next: 'exit_polite',
        },
      ],
    },

    open_acquaintance: {
      id: 'open_acquaintance',
      lines: [
        {
          mood: 'good',
          minEncounters: 2,
          text: "Look who it is. I've been telling people about the circling. They enjoyed it.",
          expression: 'laughing',
          cue: 'She has told people. She has definitely told people.',
        },
        {
          mood: 'okay',
          text: "You're back. Good. Hold this — I need someone to count and lie to me about my form.",
          expression: 'interested',
          cue: 'She hands you her water bottle like you already work here.',
        },
        {
          mood: 'bad',
          text: "Bad session. Everything felt heavy and my knee is being dramatic. Say something that isn't advice.",
          expression: 'annoyed',
          cue: 'She is stretching the same hamstring for the fourth time.',
        },
      ],
      options: [
        {
          id: 'ack_not_advice',
          type: 'joke',
          text: "Your knee is attention-seeking and everyone can tell.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'ack_count',
          type: 'tease',
          text: "I'll count. I'll count generously, like a proud parent.",
          tags: ['banter', 'fitness'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'ack_advice',
          type: 'story',
          text: "Sounds like a mobility thing. You should look into hip flexor work.",
          tags: ['pushy', 'bragging'],
          interest: -7,
          comfort: -4,
          next: 'she_is_the_physio',
        },
      ],
    },

    open_interested: {
      id: 'open_interested',
      lines: [
        {
          minInterest: 55,
          text: "Right, I've been thinking about you at inconvenient times, which is annoying. What are we doing about it?",
          expression: 'blushing',
          cue: 'She says it like a challenge, because that is the only way she knows how to say it.',
        },
        {
          text: "There you are. I saved you the rack. Do not make me regret it publicly.",
          expression: 'interested',
          cue: 'She moved her bag off it when she saw you come in.',
        },
      ],
      options: [
        {
          id: 'int_match',
          type: 'bold',
          text: "Dinner. Thursday. You pick the place and I'll pretend I'm not intimidated.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 52 },
            { kind: 'comfort', min: 48 },
          ],
          interest: 8,
          comfort: 2,
          next: 'number_yes',
        },
        {
          id: 'int_tease',
          type: 'tease',
          text: "Inconvenient times. Mid-set? During the big lift? That's a liability.",
          tags: ['banter', 'innuendo'],
          interest: 7,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    open_cold: {
      id: 'open_cold',
      lines: [
        {
          text: "Nope. We're not doing this. Have a good session.",
          expression: 'annoyed',
          cue: 'Both earbuds back in. That is the entire conversation.',
        },
      ],
      options: [
        {
          id: 'cold_leave',
          type: 'exit',
          text: 'Fair enough.',
          tags: ['direct'],
          comfort: 1,
          next: 'exit_polite',
        },
      ],
    },

    // --- Opening branches -------------------------------------------------
    work_in: {
      id: 'work_in',
      lines: [
        {
          text: "Honest. I like honest. Strip it down, don't hurt yourself, and do not chat between my sets.",
          expression: 'amused',
          cue: 'She moves her bag off the bench. That is the whole invitation.',
        },
      ],
      topics: ['direct', 'fitness'],
      options: [
        {
          id: 'work_in_banter',
          type: 'tease',
          text: "No chatting between sets. What about during? Is during allowed?",
          tags: ['banter'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'work_in_serious',
          type: 'sincere',
          text: "Deal. Tell me if I'm doing something stupid — I'd rather know than be polite about it.",
          tags: ['direct', 'fitness'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    circling_joke: {
      id: 'circling_joke',
      lines: [
        {
          text: "Great range of motion on it. Terrible load. You'll never grow.",
          expression: 'laughing',
          cue: 'She laughs once, loud, and does not care who looked.',
        },
      ],
      topics: ['banter'],
      options: [
        {
          id: 'circling_build',
          type: 'joke',
          text: "I'm doing a deload week. On the circling.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'circling_turn',
          type: 'bold',
          text: "Coach me then. One set, be honest, be brutal.",
          tags: ['direct', 'fitness'],
          interest: 7,
          comfort: 2,
          next: 'hub',
        },
      ],
    },

    bored_fast: {
      id: 'bored_fast',
      lines: [
        {
          text: "It is. It's a gym on a Monday. Was there a second part to that?",
          expression: 'bored',
          cue: 'She reaches for her earbud. You have about one sentence left.',
        },
      ],
      topics: ['small_talk'],
      options: [
        {
          id: 'bored_recover',
          type: 'bold',
          text: "There is: I came over here to talk to you and opened with the weather. Let me start again.",
          tags: ['direct', 'vulnerable'],
          interest: 8,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'bored_more',
          type: 'story',
          text: "Just saying, parking was a nightmare as well.",
          tags: ['small_talk'],
          interest: -6,
          comfort: -4,
          next: 'nadia_leaves',
        },
      ],
    },

    she_is_the_physio: {
      id: 'she_is_the_physio',
      lines: [
        {
          text: "Hip flexor work. Right. I'm a physiotherapist. It is literally my job. But please, continue.",
          expression: 'annoyed',
          cue: 'She is smiling. It is not a friendly smile. It is a professional one.',
        },
      ],
      topics: ['pushy'],
      options: [
        {
          id: 'physio_own_it',
          type: 'joke',
          text: "And here I am, explaining legs to a leg professional. I'll see myself out of this sentence.",
          tags: ['banter', 'direct'],
          interest: 7,
          comfort: 6,
          learn: ['nadia_physio'],
          next: 'hub',
        },
        {
          id: 'physio_push',
          type: 'story',
          text: "Well, a lot of physios miss it, honestly.",
          tags: ['bragging', 'pushy'],
          interest: -9,
          comfort: -9,
          next: 'nadia_leaves',
        },
      ],
    },

    // --- Hub --------------------------------------------------------------
    hub: {
      id: 'hub',
      lines: [
        {
          mood: 'bad',
          text: "Go on then, entertain me. Quietly, I'm counting.",
          expression: 'neutral',
          cue: 'She is between sets and the clock on the wall is doing the talking.',
        },
        {
          minInterest: 58,
          text: "Right. You've got my attention and I don't hand that out. Use it.",
          expression: 'interested',
          cue: 'She sits down properly. Rest period extended, unofficially.',
        },
        {
          text: 'What else have you got.',
          expression: 'neutral',
          cue: 'She rolls her shoulder, watching you, waiting.',
        },
      ],
      options: [
        {
          id: 'hub_meet',
          type: 'question',
          text: "So what's the actual goal? There's a number in your head, I can tell.",
          tags: ['curiosity', 'fitness'],
          interest: 5,
          comfort: 3,
          learn: ['nadia_competes'],
          next: 'topic_meet',
        },
        {
          id: 'hub_rower',
          type: 'tease',
          text: "Nobody in this building has touched that rowing machine since it was installed.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'topic_rower',
        },
        {
          id: 'hub_bet',
          type: 'bold',
          text: "Bet you a coffee I can hold a plank longer than you.",
          tags: ['banter', 'fitness'],
          requires: [{ kind: 'stat', stat: 'confidence', min: 42 }],
          interest: 7,
          comfort: 2,
          next: 'topic_bet',
        },
        {
          id: 'hub_salsa',
          type: 'question',
          text: "You move like someone who dances. That's not a line, it's an accusation.",
          tags: ['curiosity', 'banter'],
          requires: [{ kind: 'stat', stat: 'charm', min: 40 }],
          interest: 6,
          comfort: 3,
          learn: ['nadia_salsa'],
          next: 'topic_salsa',
        },
        {
          id: 'hub_salsa_shared',
          type: 'story',
          text: "I do salsa on Wednesdays. I'm improving at roughly the speed of continental drift.",
          tags: ['banter', 'music'],
          requires: [{ kind: 'hobby', hobby: 'salsa', minLevel: 1 }],
          interest: 9,
          comfort: 5,
          tell: ['player_dances'],
          learn: ['nadia_salsa'],
          next: 'topic_salsa_shared',
        },
        {
          id: 'hub_climb',
          type: 'question',
          text: "Do you climb too, or is that a different set of hands?",
          tags: ['fitness', 'curiosity'],
          requires: [{ kind: 'hobby', hobby: 'climbing', minLevel: 1 }],
          interest: 6,
          comfort: 4,
          next: 'topic_climb',
        },
        {
          id: 'hub_bar',
          type: 'question',
          text: "You drink at Last Call on Fridays. I've seen you talking to the bartender like you're related.",
          tags: ['nightlife', 'curiosity'],
          requires: [{ kind: 'comfort', min: 50 }],
          interest: 5,
          comfort: 2,
          learn: ['nadia_knows_sable'],
          next: 'topic_sable',
        },
        {
          id: 'hub_number',
          type: 'bold',
          text: "I'm going to stop pretending this is about the rack. Number. Now, before I lose my nerve.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 52 },
            { kind: 'comfort', min: 48 },
          ],
          interest: 6,
          comfort: -1,
          next: 'number_yes',
        },
        {
          id: 'hub_number_early',
          type: 'bold',
          text: "You should let me take you out. You'd have a great time.",
          tags: ['pushy'],
          interest: -3,
          comfort: -7,
          next: 'number_early',
        },
        {
          id: 'hub_exit',
          type: 'exit',
          text: "Right, I've got a set to fail at. Good to meet you.",
          tags: ['direct'],
          comfort: 3,
          next: 'exit_friendly',
        },
      ],
    },

    topic_meet: {
      id: 'topic_meet',
      lines: [
        {
          text: "There's always a number. Meet in eleven weeks, and a total I said out loud in front of witnesses, which was tactically stupid of me.",
          expression: 'interested',
          cue: 'She says the number like it owes her money.',
        },
      ],
      topics: ['fitness', 'work'],
      options: [
        {
          id: 'meet_respect',
          type: 'sincere',
          text: "Saying it out loud in front of people is the whole trick. Now you can't quietly not do it.",
          tags: ['direct'],
          interest: 8,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'meet_joke',
          type: 'joke',
          text: "Witnesses. So it's less a goal and more a hostage situation.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'meet_doubt',
          type: 'tease',
          text: "Eleven weeks is ambitious. Is it realistic, though?",
          tags: ['negging'],
          interest: -10,
          comfort: -6,
          next: 'nadia_done',
        },
      ],
    },

    topic_rower: {
      id: 'topic_rower',
      lines: [
        {
          text: "I use it. Once a month, for eight minutes, and I hate every second. It's there so I can point at it and feel superior.",
          expression: 'laughing',
          cue: 'She points at it. She is, right now, feeling superior.',
        },
      ],
      topics: ['banter'],
      options: [
        {
          id: 'rower_challenge',
          type: 'bold',
          text: "Eight minutes. Both of us. Right now. Loser buys the protein shake they don't want.",
          tags: ['banter', 'fitness'],
          interest: 8,
          comfort: 3,
          next: 'topic_bet',
        },
        {
          id: 'rower_joke',
          type: 'joke',
          text: "Every gym has one machine that exists purely so people can have a favourite enemy.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    topic_bet: {
      id: 'topic_bet',
      lines: [
        {
          minInterest: 40,
          text: "A bet. Finally, a man who understands how to talk to me. Terms?",
          expression: 'interested',
          cue: 'She is already on the floor. The bet is happening whether you meant it or not.',
        },
        {
          text: "You're on. And when you lose, you take it like an adult.",
          expression: 'amused',
          cue: 'She checks her watch. This is a real timer now.',
        },
      ],
      topics: ['banter', 'fitness'],
      options: [
        {
          id: 'bet_win',
          type: 'tease',
          text: "Terms: I win, you tell me one true thing nobody here knows about you.",
          tags: ['banter', 'direct'],
          requires: [{ kind: 'stat', stat: 'fitness', min: 45 }],
          interest: 9,
          comfort: 4,
          next: 'bet_result',
        },
        {
          id: 'bet_humble',
          type: 'joke',
          text: "Terms: I lose in about forty seconds and you get to enjoy it.",
          tags: ['banter', 'vulnerable'],
          interest: 7,
          comfort: 6,
          next: 'bet_result',
        },
      ],
    },

    bet_result: {
      id: 'bet_result',
      lines: [
        {
          minInterest: 55,
          text: "Fine. One true thing: I moved here after a divorce at twenty-nine and I have not been bored since. That's the whole thing, don't make a face.",
          expression: 'uncomfortable',
          cue: 'She said it fast, then looked away, then looked straight back at you.',
        },
        {
          text: "Good effort. Genuinely. Most people quit before it starts hurting and you quit slightly after, which is the right order.",
          expression: 'amused',
          cue: 'She offers a hand up. She does not need to, and she does it anyway.',
        },
      ],
      topics: ['banter', 'vulnerable'],
      options: [
        {
          id: 'bet_no_face',
          type: 'sincere',
          text: "No face. Not bored since sounds like the best possible outcome.",
          tags: ['direct'],
          interest: 9,
          comfort: 7,
          learn: ['nadia_divorce'],
          next: 'hub',
        },
        {
          id: 'bet_banter',
          type: 'tease',
          text: "Quitting in the right order is the only athletic gift I have.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    topic_salsa: {
      id: 'topic_salsa',
      lines: [
        {
          text: "Guilty. Wednesdays, and I'm the worst one there by a distance, which I find genuinely relaxing.",
          expression: 'amused',
          cue: 'She does a tiny step, half a metre, just to prove it.',
        },
      ],
      topics: ['banter', 'music'],
      options: [
        {
          id: 'salsa_curious',
          type: 'question',
          text: "You like being the worst one at something?",
          tags: ['curiosity'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'salsa_tease',
          type: 'tease',
          text: "The worst one there, and you've still told me within ten minutes of meeting me.",
          tags: ['banter'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_salsa_shared: {
      id: 'topic_salsa_shared',
      lines: [
        {
          text: "Wednesdays? That's my class. That is literally my class, I would have seen — oh. You're the one who counts out loud.",
          expression: 'laughing',
          cue: 'She has grabbed your forearm. She has not noticed she has grabbed your forearm.',
        },
      ],
      topics: ['music'],
      options: [
        {
          id: 'salsa_shared_plan',
          type: 'bold',
          text: "Then next Wednesday you're my partner, and afterwards I'm buying you the bad wine from the place next door.",
          tags: ['direct'],
          requires: [{ kind: 'comfort', min: 48 }],
          interest: 10,
          comfort: 2,
          next: 'number_yes',
        },
        {
          id: 'salsa_shared_joke',
          type: 'joke',
          text: "I count out loud because if I stop counting I start improvising, and nobody wants that.",
          tags: ['banter'],
          interest: 7,
          comfort: 6,
          next: 'hub',
        },
      ],
    },

    topic_climb: {
      id: 'topic_climb',
      lines: [
        {
          text: "Sundays, upstairs. Me and a grad student who shouts encouragement at strangers and means it. You'd like her. Probably.",
          expression: 'neutral',
          cue: 'Something protective flickers across her face when she says it.',
        },
      ],
      topics: ['fitness'],
      options: [
        {
          id: 'climb_join',
          type: 'sincere',
          text: "I'd come. I'd be bad at it loudly, which is apparently the house style.",
          tags: ['fitness', 'banter'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'climb_ask',
          type: 'question',
          text: "Shouting encouragement at strangers is a real skill. Where did she learn that?",
          tags: ['curiosity'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_sable: {
      id: 'topic_sable',
      lines: [
        {
          text: "Sable? She's been pouring my drinks for six years and telling me the truth for five of them. Careful with her. And be careful with me about her, if you follow.",
          expression: 'interested',
          cue: 'That was a warning wrapped in a joke wrapped in a warning.',
        },
      ],
      topics: ['nightlife', 'direct'],
      options: [
        {
          id: 'sable_honest',
          type: 'sincere',
          text: "I follow. I'm not doing that.",
          tags: ['direct'],
          interest: 7,
          comfort: 6,
          next: 'hub',
        },
        {
          id: 'sable_joke',
          type: 'joke',
          text: "Six years of drinks and five of truth. What happened in year one?",
          tags: ['banter'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    // --- Endings ----------------------------------------------------------
    number_yes: {
      id: 'number_yes',
      lines: [
        {
          minInterest: 58,
          text: "About time. I was going to give you until Friday and then do it myself.",
          expression: 'blushing',
          cue: 'She takes your phone, types it in, and names herself something you will have to explain later.',
        },
        {
          text: "Alright. But you text first, and not tonight — tonight would look keen and I want to feel superior for one more day.",
          expression: 'amused',
          cue: 'She is already walking back to the rack, grinning.',
        },
      ],
      outcome: 'number',
      topics: ['direct'],
    },

    number_early: {
      id: 'number_early',
      lines: [
        {
          text: "I'd have a great time. You've decided that on my behalf already, which is the problem.",
          expression: 'annoyed',
          cue: 'She puts the earbud back in. One. Still one. But it is in.',
        },
      ],
      outcome: 'rejected',
      topics: ['pushy'],
    },

    nadia_leaves: {
      id: 'nadia_leaves',
      lines: [
        {
          text: "Right. I'm going to go and lift heavy things instead of this.",
          expression: 'annoyed',
          cue: 'Both earbuds. Back to the rack. You have been filed.',
        },
      ],
      outcome: 'she_left',
      topics: ['pushy'],
    },

    nadia_done: {
      id: 'nadia_done',
      lines: [
        {
          text: "For a girl. Eleven weeks is ambitious. Pick one and stand behind it, but not near me.",
          expression: 'annoyed',
          cue: 'She has gone from warm to gone in under a second, and she is not coming back.',
        },
      ],
      outcome: 'she_left',
      topics: ['negging'],
    },

    exit_friendly: {
      id: 'exit_friendly',
      lines: [
        {
          minInterest: 45,
          text: "Good to meet you too. I'm in Mondays, Wednesdays, Fridays, and I notice who turns up.",
          expression: 'interested',
          cue: 'She lists the days like a dare.',
        },
        {
          text: "Go on then. Don't die on the leg press, it's beneath you.",
          expression: 'amused',
          cue: 'She is already under the bar.',
        },
      ],
      outcome: 'friendly',
    },

    exit_polite: {
      id: 'exit_polite',
      lines: [
        {
          text: "Appreciated. Go on.",
          expression: 'neutral',
          cue: 'A nod, and she is gone into the set.',
        },
      ],
      outcome: 'you_left',
    },
  },
};

export const NADIA: CharacterDef = {
  id: 'nadia',
  name: 'Nadia',
  age: 31,
  gender: 'woman',
  archetype: 'The competitive one',
  tagline: 'physiotherapist, powerlifter, worst salsa dancer in her class',
  bio: "Moved here after a divorce at twenty-nine and has not been bored since. Turns conversations into bets and bets into a good evening. Fixes people's backs for a living, which means she has heard your theory about your knee before.",
  personality: ['blunt', 'competitive', 'playful', 'bored by nonsense', 'warmer than the volume suggests'],
  likes: ['direct', 'banter', 'fitness', 'curiosity', 'innuendo'],
  dislikes: ['small_talk', 'flattery', 'pushy', 'bragging'],
  dealbreaker: {
    tag: 'negging',
    line: 'You took a swing at her to make yourself taller. She has met that man and she is not doing it again.',
  },
  interests: ['climbing', 'salsa'],
  preferences: {
    tease: 1.3,
    bold: 1.2,
    joke: 1.1,
    sincere: 1.05,
    question: 0.95,
    story: 0.85,
    compliment: 0.65,
    exit: 1,
  },
  statWeights: { confidence: 1.35, fitness: 1.3, humor: 1.1, charm: 1, style: 0.9, culture: 0.7 },
  homeVenue: 'ironhaus',
  baseInterest: 22,
  baseComfort: 50,
  patience: 7,
  facts: [
    { id: 'nadia_competes', text: 'She has a meet in eleven weeks and a total she announced in front of witnesses.', unlocks: ['fitness'] },
    { id: 'nadia_physio', text: 'She is a physiotherapist. Do not explain legs to her.' },
    { id: 'nadia_salsa', text: 'Salsa on Wednesdays. She is the worst one in the class and finds that relaxing.', unlocks: ['music'] },
    { id: 'nadia_divorce', text: 'Divorced at twenty-nine, moved here, has not been bored since.' },
    { id: 'nadia_knows_sable', text: 'She has been drinking at Last Call for six years. Sable is hers, and she said so.', unlocks: ['nightlife'] },
  ],
  outfits: [
    {
      id: 'training',
      name: 'Training kit',
      worn: ['ironhaus'],
      palette: { primary: '#1e2a3a', secondary: '#2f4560', accent: '#96e07a' },
    },
    {
      id: 'friday_bar',
      name: 'Friday at the bar',
      worn: ['neon_last_call'],
      unlockHint: 'Catch her on a Friday night, off the gym floor.',
      palette: { primary: '#3a1b2a', secondary: '#5c2c3f', accent: '#ff5fa8' },
    },
    {
      id: 'salsa_red',
      name: 'Wednesday red',
      worn: [],
      unlockHint: 'Be her partner on a Wednesday.',
      palette: { primary: '#5c1620', secondary: '#8a2432', accent: '#ffce6b' },
    },
    {
      id: 'meet_day',
      name: 'Meet day singlet',
      worn: [],
      unlockHint: 'Be there when she hits the number she announced.',
      palette: { primary: '#14212e', secondary: '#1f3547', accent: '#4fd6ff' },
    },
  ],
  palette: {
    hair: '#c9a227',
    hairShadow: '#8a6b14',
    skin: '#f0cdae',
    eyes: '#4a90c2',
    accent: '#96e07a',
    background: '#16242f',
  },
  knows: ['sable', 'wren'],
  dialogue,
};
