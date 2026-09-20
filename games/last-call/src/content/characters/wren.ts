import type { CharacterDef } from '@/types/character';
import type { DialogueTree } from '@/types/dialogue';

/**
 * Wren Adeyemi — the grad student with opinions.
 *
 * Voice rules:
 *  - She talks in tangents that land somewhere useful.
 *  - She deflects compliments with facts. Flattery confuses her, then bores her.
 *  - She asks you what you think and she is actually listening to the answer.
 *  - She will catch a lie instantly, because she has read the book.
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
          text: "Sorry — you're in my light. Not complaining, just narrating.",
          expression: 'amused',
          cue: 'She has a library book open and a pencil in her hand. A pencil.',
        },
        {
          mood: 'okay',
          text: 'Hm? Sorry. I was three pages away from a thought.',
          expression: 'neutral',
          cue: 'She surfaces from the book like someone coming up for air.',
        },
        {
          mood: 'bad',
          text: "If you're going to ask whether this seat is taken: it is, by my coat, which has had a worse week than me.",
          expression: 'annoyed',
          cue: 'Her coat is on the chair like a barricade. That is on purpose.',
        },
      ],
      options: [
        {
          id: 'open_pencil',
          type: 'tease',
          text: "Is that a library book? And a pencil? In the same hand?",
          tags: ['banter', 'books'],
          interest: 5,
          comfort: 2,
          learn: ['wren_marginalia'],
          next: 'pencil_caught',
        },
        {
          id: 'open_question',
          type: 'question',
          text: "What was the thought? Three pages is a long way to come back from.",
          tags: ['curiosity'],
          interest: 5,
          comfort: 3,
          next: 'the_thought',
        },
        {
          id: 'open_sincere',
          type: 'sincere',
          text: "I'll move. I only came over because you looked like you were enjoying something.",
          tags: ['direct'],
          interest: 4,
          comfort: 4,
          next: 'the_thought',
        },
        {
          id: 'open_flattery',
          type: 'compliment',
          text: "You're the best thing in this shop and it's full of first editions.",
          tags: ['flattery'],
          interest: -4,
          comfort: -2,
          next: 'flattery_confuses',
        },
        {
          id: 'open_exit',
          type: 'exit',
          text: "I'll leave you to it. Enjoy the book.",
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
          text: "You. Good. I have been carrying an opinion around for four days with nowhere to put it.",
          expression: 'interested',
          cue: 'She closes the book on her finger. Committed.',
        },
        {
          mood: 'okay',
          text: "Oh, hello. Sit. Mind the coat, it is load-bearing.",
          expression: 'amused',
          cue: 'She moves the coat herself, which she would not do for everyone.',
        },
        {
          mood: 'bad',
          text: "Hi. I am in a mood and it is not about you, so do not take it personally for at least ten minutes.",
          expression: 'bored',
          cue: 'She has written the same note twice and crossed it out both times.',
        },
      ],
      options: [
        {
          id: 'ack_opinion',
          type: 'question',
          text: 'Put it here. What is the opinion?',
          tags: ['curiosity'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'ack_mood',
          type: 'sincere',
          text: "Ten minutes is generous. I'll take five and get you a coffee.",
          tags: ['direct'],
          interest: 6,
          comfort: 6,
          learn: ['wren_coffee'],
          next: 'hub',
        },
        {
          id: 'ack_joke',
          type: 'joke',
          text: "Load-bearing coat. Is that peer reviewed?",
          tags: ['banter'],
          interest: 5,
          comfort: 3,
          next: 'hub',
        },
      ],
    },

    open_interested: {
      id: 'open_interested',
      lines: [
        {
          minInterest: 55,
          text: "I saved you the good chair. I want it noted that I did that, and then I want it never mentioned again.",
          expression: 'blushing',
          cue: 'The good chair is free. The good chair is never free.',
        },
        {
          text: "There you are. I have been arguing with a footnote all morning and losing.",
          expression: 'interested',
          cue: 'She was facing the door. She will deny that.',
        },
      ],
      options: [
        {
          id: 'int_tease',
          type: 'tease',
          text: "Noted, never mentioned again. Starting now. Starting after this.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'int_number',
          type: 'bold',
          text: "Come and lose to a footnote somewhere that isn't work. Friday. Give me your number.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 55 },
            { kind: 'comfort', min: 55 },
          ],
          interest: 6,
          comfort: -1,
          next: 'number_yes',
        },
      ],
    },

    open_cold: {
      id: 'open_cold',
      lines: [
        {
          text: "Hi. I'm mid-chapter, and I am going to stay mid-chapter.",
          expression: 'neutral',
          cue: 'She does not move the coat.',
        },
      ],
      options: [
        {
          id: 'cold_leave',
          type: 'exit',
          text: 'Of course. Sorry to interrupt.',
          tags: ['direct'],
          comfort: 1,
          next: 'exit_polite',
        },
      ],
    },

    // --- Opening branches -------------------------------------------------
    pencil_caught: {
      id: 'pencil_caught',
      lines: [
        {
          text: "It's pencil. Pencil is reversible. I am a criminal but I am a considerate one.",
          expression: 'amused',
          cue: 'She does not put the pencil down. She holds it like evidence she is proud of.',
        },
      ],
      topics: ['books', 'banter'],
      options: [
        {
          id: 'pencil_build',
          type: 'joke',
          text: "Considerate criminal. That's what they all write. In pencil.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'pencil_question',
          type: 'question',
          text: 'What do you write in them? Arguments, or agreements?',
          tags: ['curiosity', 'books'],
          interest: 6,
          comfort: 3,
          learn: ['wren_marginalia'],
          next: 'marginalia',
        },
      ],
    },

    marginalia: {
      id: 'marginalia',
      lines: [
        {
          text: "Arguments, obviously. Agreeing in the margin is just clapping quietly at a book. Someone in 2011 wrote 'NO' next to a paragraph in this one and honestly? Correct. Whoever you are, correct.",
          expression: 'laughing',
          cue: 'She turns the book round so you can see it. That is a door opening.',
        },
      ],
      topics: ['books'],
      options: [
        {
          id: 'marginalia_join',
          type: 'tease',
          text: "So somewhere out there is a person you've been arguing with for a decade and they don't know.",
          tags: ['banter', 'books'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'marginalia_brag',
          type: 'story',
          text: "I've read everything on that shelf, actually. Twice, most of them.",
          tags: ['bragging', 'lying'],
          interest: -8,
          comfort: -6,
          next: 'caught_lying',
        },
      ],
    },

    the_thought: {
      id: 'the_thought',
      lines: [
        {
          mood: 'bad',
          text: "Gone now. That's how thoughts work, they're cowards.",
          expression: 'bored',
          cue: 'She puts the pencil down. That is not a good sign.',
        },
        {
          text: "That people keep writing about loneliness as if it's quiet. It isn't. It's extremely loud and it has opinions about your posture.",
          expression: 'interested',
          cue: 'She says it fast, like she has been waiting for somebody to say it to.',
        },
      ],
      topics: ['curiosity', 'vulnerable'],
      options: [
        {
          id: 'thought_agree',
          type: 'sincere',
          text: "Loud and full of admin. Nobody writes about the admin.",
          tags: ['vulnerable', 'banter'],
          interest: 7,
          comfort: 5,
          tell: ['player_gets_it'],
          next: 'hub',
        },
        {
          id: 'thought_joke',
          type: 'joke',
          text: "My loneliness mostly complains that I stand like a question mark.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'thought_deflect',
          type: 'compliment',
          text: "You're very clever, aren't you.",
          tags: ['flattery'],
          interest: -3,
          comfort: -2,
          next: 'flattery_confuses',
        },
      ],
    },

    flattery_confuses: {
      id: 'flattery_confuses',
      lines: [
        {
          text: "Thank you. That's — yes. Anyway, the espresso machine here is calibrated by a man who hates joy, so avoid the americano.",
          expression: 'uncomfortable',
          cue: 'She changed the subject so fast you can still hear the tyres.',
        },
      ],
      topics: ['flattery'],
      options: [
        {
          id: 'flattery_recover',
          type: 'question',
          text: "Noted. What does the man who hates joy make well?",
          tags: ['curiosity', 'banter'],
          interest: 5,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'flattery_double',
          type: 'compliment',
          text: "I mean it though. You're stunning, you must get told constantly.",
          tags: ['flattery', 'pushy'],
          interest: -6,
          comfort: -8,
          next: 'wren_leaves',
        },
      ],
    },

    caught_lying: {
      id: 'caught_lying',
      lines: [
        {
          text: "Twice. Right. Which one's the green one with the awful cover, then — the one you've read twice?",
          expression: 'annoyed',
          cue: 'She is not angry. She is worse than angry: she is disappointed and curious about how you will handle it.',
        },
      ],
      topics: ['lying'],
      options: [
        {
          id: 'lying_own_it',
          type: 'sincere',
          text: "I haven't read any of them. I said it to sound like someone you'd want to talk to.",
          tags: ['direct', 'vulnerable'],
          interest: 5,
          comfort: 6,
          next: 'honesty_saves',
        },
        {
          id: 'lying_double',
          type: 'story',
          text: "The green one — it's a classic, obviously. Bit overrated, honestly.",
          tags: ['lying', 'bragging'],
          interest: -12,
          comfort: -12,
          next: 'wren_done',
        },
      ],
    },

    honesty_saves: {
      id: 'honesty_saves',
      lines: [
        {
          text: "Right. Well. That was a better sentence than any of the books would have got you, so. Sit down.",
          expression: 'amused',
          cue: 'She moves the coat. The coat has been moved.',
        },
      ],
      topics: ['direct', 'vulnerable'],
      options: [
        {
          id: 'honesty_sit',
          type: 'tease',
          text: "The coat has moved. I'd like that entered into the record.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    // --- Hub --------------------------------------------------------------
    hub: {
      id: 'hub',
      lines: [
        {
          mood: 'bad',
          text: "Right. Distract me, then. Badly is fine.",
          expression: 'neutral',
          cue: 'She has stopped pretending to read, which is progress of a kind.',
        },
        {
          minInterest: 60,
          text: "Go on. You clearly have a thing you want to ask.",
          expression: 'interested',
          cue: 'She has turned her whole chair towards you.',
        },
        {
          text: "Anyway. What else.",
          expression: 'neutral',
          cue: 'The pencil is tapping. She is thinking, not bored.',
        },
      ],
      options: [
        {
          id: 'hub_thesis',
          type: 'question',
          text: "What is it you're actually studying, under all the marginalia?",
          tags: ['work', 'curiosity'],
          interest: 4,
          comfort: 2,
          learn: ['wren_thesis'],
          next: 'topic_thesis',
        },
        {
          id: 'hub_shop',
          type: 'tease',
          text: "Someone has shelved the poetry under travel. Is that you? Is that your work?",
          tags: ['banter', 'books'],
          interest: 5,
          comfort: 4,
          next: 'topic_shop',
        },
        {
          id: 'hub_film',
          type: 'question',
          text: "Is that a film camera in your bag or am I about to be very wrong?",
          tags: ['curiosity', 'art'],
          interest: 5,
          comfort: 2,
          learn: ['wren_film'],
          next: 'topic_film',
        },
        {
          id: 'hub_photography',
          type: 'story',
          text: "I shoot film too. Mostly badly, expensively, and at things that do not move.",
          tags: ['art', 'curiosity'],
          requires: [{ kind: 'hobby', hobby: 'photography', minLevel: 1 }],
          interest: 8,
          comfort: 5,
          tell: ['player_shoots_film'],
          learn: ['wren_film'],
          next: 'topic_film_shared',
        },
        {
          id: 'hub_climbing',
          type: 'question',
          text: "Those are climbing hands. You've got chalk in the creases of that book.",
          tags: ['fitness', 'curiosity'],
          requires: [{ kind: 'stat', stat: 'fitness', min: 38 }],
          interest: 6,
          comfort: 3,
          learn: ['wren_climbs'],
          next: 'topic_climbing',
        },
        {
          id: 'hub_insomnia',
          type: 'sincere',
          text: "You're here at three on a Tuesday looking like you were also here at three in the morning.",
          tags: ['curiosity', 'vulnerable'],
          requires: [{ kind: 'comfort', min: 58 }],
          interest: 6,
          comfort: -1,
          learn: ['wren_insomnia'],
          next: 'topic_insomnia',
        },
        {
          id: 'hub_number',
          type: 'bold',
          text: "I'm going to run out of shop to ask you about. Give me your number and we can argue somewhere with better coffee.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 56 },
            { kind: 'comfort', min: 54 },
          ],
          interest: 5,
          comfort: -1,
          next: 'number_yes',
        },
        {
          id: 'hub_number_early',
          type: 'bold',
          text: "Let me take you to dinner. Tonight, ideally.",
          tags: ['pushy'],
          interest: -2,
          comfort: -8,
          next: 'number_early',
        },
        {
          id: 'hub_exit',
          type: 'exit',
          text: "You've got three pages to get back to. Go on.",
          tags: ['direct'],
          comfort: 3,
          next: 'exit_friendly',
        },
      ],
    },

    topic_thesis: {
      id: 'topic_thesis',
      lines: [
        {
          text: "Urban loneliness in post-war fiction. It's two years late, my supervisor has started using the word 'concerned' in emails, and I am having the time of my life.",
          expression: 'amused',
          cue: 'She says "two years late" without flinching. She has made peace with it.',
        },
      ],
      topics: ['work'],
      options: [
        {
          id: 'thesis_good',
          type: 'sincere',
          text: "Two years late and having a great time is the correct way to do a thesis.",
          tags: ['direct'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'thesis_advice',
          type: 'story',
          text: "You just need a system. I could help you plan it out, honestly, I'm good at that.",
          tags: ['bragging', 'pushy'],
          interest: -6,
          comfort: -4,
          next: 'unsolicited_advice',
        },
        {
          id: 'thesis_joke',
          type: 'joke',
          text: "'Concerned' is the academic version of a text that just says 'ok'.",
          tags: ['banter'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    unsolicited_advice: {
      id: 'unsolicited_advice',
      lines: [
        {
          text: "Mm. I'll add you to the list of people with a system. It's a long list and everyone on it is finished and miserable.",
          expression: 'annoyed',
          cue: 'She has picked the pencil back up. The window is closing.',
        },
      ],
      topics: ['pushy'],
      options: [
        {
          id: 'advice_retreat',
          type: 'sincere',
          text: "You didn't ask, and I did it anyway. Sorry. Tell me the good part instead.",
          tags: ['direct', 'vulnerable'],
          interest: 5,
          comfort: 6,
          next: 'hub',
        },
        {
          id: 'advice_push',
          type: 'bold',
          text: "I'm just saying, two years is a long time to be stuck.",
          tags: ['pushy', 'negging'],
          interest: -8,
          comfort: -10,
          next: 'wren_leaves',
        },
      ],
    },

    topic_shop: {
      id: 'topic_shop',
      lines: [
        {
          text: "That was me and I'd do it again. Half of that poetry is about leaving places. It's travel writing with better line breaks.",
          expression: 'laughing',
          cue: 'She is delighted to have been caught. This is clearly a bit she has been saving.',
        },
      ],
      topics: ['books', 'banter'],
      options: [
        {
          id: 'shop_yes_and',
          type: 'joke',
          text: "Then the cookbooks belong in fantasy and we both know it.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'shop_question',
          type: 'question',
          text: "What else have you quietly reorganised in here?",
          tags: ['curiosity', 'banter'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_film: {
      id: 'topic_film',
      lines: [
        {
          text: "It's film. Thirty-six pictures, no screen, and I do not find out whether I wasted the afternoon until three weeks later. It is the healthiest relationship in my life.",
          expression: 'interested',
          cue: 'She puts the camera on the table between you. That is trust, in an object.',
        },
      ],
      topics: ['art'],
      options: [
        {
          id: 'film_ask',
          type: 'question',
          text: "What do you point it at?",
          tags: ['curiosity', 'art'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'film_tease',
          type: 'tease',
          text: "Three weeks of not knowing. You'd hate a polaroid, wouldn't you.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    topic_film_shared: {
      id: 'topic_film_shared',
      lines: [
        {
          text: "Badly, expensively, at things that do not move. That's — yes. That's the whole hobby. Nobody says the expensive part out loud.",
          expression: 'blushing',
          cue: 'She has stopped doing three things at once, which for her is a declaration.',
        },
      ],
      topics: ['art'],
      options: [
        {
          id: 'film_shared_plan',
          type: 'bold',
          text: "There's an hour before sunset on Saturday where this city is unbearable. Come and waste film with me.",
          tags: ['direct', 'art'],
          requires: [{ kind: 'comfort', min: 52 }],
          interest: 10,
          comfort: 1,
          next: 'number_yes',
        },
        {
          id: 'film_shared_talk',
          type: 'story',
          text: "I shot a whole roll of the same bus stop once. Twelve of them were the same picture. Two were good.",
          tags: ['art', 'vulnerable'],
          interest: 7,
          comfort: 6,
          next: 'hub',
        },
      ],
    },

    topic_climbing: {
      id: 'topic_climbing',
      lines: [
        {
          text: "Sundays, at Ironhaus, where everyone is very kind and very loud. It's the only place nobody asks how the thesis is going.",
          expression: 'amused',
          cue: 'She flexes her fingers without noticing she is doing it.',
        },
      ],
      topics: ['fitness'],
      options: [
        {
          id: 'climb_shared',
          type: 'story',
          text: "I climb. Badly, and with a lot of unnecessary commentary from the floor.",
          tags: ['fitness', 'banter'],
          requires: [{ kind: 'hobby', hobby: 'climbing', minLevel: 1 }],
          interest: 8,
          comfort: 5,
          tell: ['player_climbs'],
          next: 'hub',
        },
        {
          id: 'climb_question',
          type: 'question',
          text: "Is it the problem-solving or the not-being-asked-about-the-thesis?",
          tags: ['curiosity'],
          interest: 6,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_insomnia: {
      id: 'topic_insomnia',
      lines: [
        {
          text: "I was, yes. I get about four hours and then my brain files a complaint. It's fine. It's a bad habit I've decided to call a routine.",
          expression: 'uncomfortable',
          cue: 'She is watching to see whether you make it a problem to be solved.',
        },
      ],
      topics: ['vulnerable'],
      options: [
        {
          id: 'insomnia_sit_with_it',
          type: 'sincere',
          text: "Four hours and you still came out and argued with a footnote. That's not nothing.",
          tags: ['direct', 'vulnerable'],
          interest: 9,
          comfort: 8,
          next: 'hub',
        },
        {
          id: 'insomnia_fix_it',
          type: 'story',
          text: "You should try magnesium. And no screens after ten. Changed my life.",
          tags: ['pushy', 'bragging'],
          interest: -6,
          comfort: -5,
          next: 'unsolicited_advice',
        },
      ],
    },

    // --- Endings ----------------------------------------------------------
    number_yes: {
      id: 'number_yes',
      lines: [
        {
          minInterest: 60,
          text: "Yes. Obviously yes, I've been waiting for you to get there for about forty minutes.",
          expression: 'blushing',
          cue: 'She writes it inside the cover of a receipt, in pencil. Of course in pencil.',
        },
        {
          text: "Alright. Text me the worst thing you have ever underlined in a book and I'll decide from there.",
          expression: 'amused',
          cue: 'She spells her name out. She has been spelling it out her whole life.',
        },
      ],
      outcome: 'number',
      topics: ['direct'],
    },

    number_early: {
      id: 'number_early',
      lines: [
        {
          text: "Tonight. Wow. No — I've known you for about nine minutes and four of them were about a coat.",
          expression: 'uncomfortable',
          cue: 'The book comes back up like a drawbridge.',
        },
      ],
      outcome: 'rejected',
      topics: ['pushy'],
    },

    wren_leaves: {
      id: 'wren_leaves',
      lines: [
        {
          text: "I'm going to go and be somewhere else. Enjoy the shop, genuinely, it's a good shop.",
          expression: 'annoyed',
          cue: 'Coat, bag, book, gone. In that order, quickly.',
        },
      ],
      outcome: 'she_left',
      topics: ['pushy'],
    },

    wren_done: {
      id: 'wren_done',
      lines: [
        {
          text: "It's blue. And you have not read it. Right — I'm going to stop you there, because I do this for a living and you are not good at it.",
          expression: 'annoyed',
          cue: 'She closes the book properly, with the pencil inside it. That is final.',
        },
      ],
      outcome: 'she_left',
      topics: ['lying'],
    },

    exit_friendly: {
      id: 'exit_friendly',
      lines: [
        {
          minInterest: 45,
          text: "I do. Thank you for the interruption — it was a good interruption. I'm here Saturdays too, as a fact about the world.",
          expression: 'interested',
          cue: 'She tells you a day. People do not do that by accident.',
        },
        {
          text: "I do, actually. Nice to meet you. Mind the poetry section, it's a war zone.",
          expression: 'neutral',
          cue: 'She is back in the book before you are out of the chair.',
        },
      ],
      outcome: 'friendly',
    },

    exit_polite: {
      id: 'exit_polite',
      lines: [
        {
          text: "Thanks. I will.",
          expression: 'neutral',
          cue: 'A small smile, entirely for the book.',
        },
      ],
      outcome: 'you_left',
    },
  },
};

export const WREN: CharacterDef = {
  id: 'wren',
  name: 'Wren',
  age: 26,
  gender: 'woman',
  archetype: 'The grad student with opinions',
  tagline: 'annotates library books in pencil like a considerate criminal',
  bio: "Two years late on a thesis about urban loneliness, four hours of sleep a night, and a film camera she refuses to justify. Argues with footnotes, strangers and the shelving system. Cannot be flattered, can absolutely be interested.",
  personality: ['curious', 'tangential', 'precise', 'allergic to being handled', 'delighted by being caught'],
  likes: ['curiosity', 'books', 'banter', 'direct', 'art'],
  dislikes: ['bragging', 'flattery', 'small_talk', 'pushy'],
  dealbreaker: {
    tag: 'lying',
    line: 'You made something up to impress her, and she had read the book. She does this for a living.',
  },
  interests: ['photography', 'climbing'],
  preferences: {
    question: 1.25,
    joke: 1.15,
    sincere: 1.15,
    story: 1.05,
    tease: 1.05,
    bold: 0.9,
    compliment: 0.6,
    exit: 1,
  },
  statWeights: { culture: 1.35, humor: 1.15, charm: 1.05, confidence: 0.9, style: 0.85, fitness: 0.85 },
  homeVenue: 'margin_notes',
  baseInterest: 15,
  baseComfort: 62,
  patience: 8,
  facts: [
    { id: 'wren_marginalia', text: 'She annotates library books in pencil and considers this a public service.', unlocks: ['books'] },
    { id: 'wren_thesis', text: "Her thesis is on urban loneliness and is two years late. She is enjoying it." },
    { id: 'wren_film', text: 'She shoots film. Thirty-six pictures, three weeks of not knowing.', unlocks: ['art'] },
    { id: 'wren_climbs', text: 'She climbs at Ironhaus on Sundays, where nobody asks about the thesis.', unlocks: ['fitness'] },
    { id: 'wren_insomnia', text: 'Four hours a night. She calls it a routine to avoid calling it a problem.' },
    { id: 'wren_coffee', text: 'She orders the second-cheapest coffee out of principle. Avoid the americano.' },
  ],
  outfits: [
    {
      id: 'shop_afternoon',
      name: 'Afternoon layers',
      worn: ['margin_notes'],
      palette: { primary: '#2b2a3f', secondary: '#4a4560', accent: '#7fd6bd' },
    },
    {
      id: 'gym_sunday',
      name: 'Sunday climbing kit',
      worn: ['ironhaus'],
      unlockHint: 'Find her on a Sunday, somewhere with chalk.',
      palette: { primary: '#1f3a3a', secondary: '#2f5b53', accent: '#ffce6b' },
    },
    {
      id: 'date_rust',
      name: 'The rust-coloured coat',
      worn: [],
      unlockHint: 'Get her somewhere with better coffee.',
      palette: { primary: '#5a2c20', secondary: '#7d4430', accent: '#ffe0b5' },
    },
    {
      id: 'late_night',
      name: 'Four hours of sleep',
      worn: [],
      unlockHint: 'Still be talking when the shop closes.',
      palette: { primary: '#1b1a2e', secondary: '#2f2b4a', accent: '#9a6bff' },
    },
  ],
  palette: {
    hair: '#2d2a3f',
    hairShadow: '#17152a',
    skin: '#8d5a3c',
    eyes: '#5fa37f',
    accent: '#7fd6bd',
    background: '#1a2233',
  },
  knows: ['nadia'],
  dialogue,
};
