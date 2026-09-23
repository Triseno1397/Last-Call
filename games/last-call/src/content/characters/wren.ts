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

/** Her date tree: she has overthought this and is determined not to show it. */
const dateDialogue: DialogueTree = {
  openings: {
    stranger: 'arrive',
    acquaintance: 'arrive',
    interested: 'arrive',
    dating: 'arrive_again',
  },
  nodes: {
    arrive: {
      id: 'arrive',
      lines: [
        {
          text: "I changed four times. I'm telling you that immediately so it stops being a secret I'm carrying around all evening.",
          expression: 'blushing',
          cue: 'No book. No bag, even. She looks slightly unarmed.',
        },
      ],
      options: [
        {
          id: 'arrive_match',
          type: 'sincere',
          text: "I changed twice and practised a sentence in the mirror. We're even.",
          tags: ['vulnerable', 'direct'],
          interest: 8,
          comfort: 6,
          next: 'scene_one',
        },
        {
          id: 'arrive_joke',
          type: 'joke',
          text: "Four times. So this outfit is the winner of a tournament. It should get a small trophy.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'scene_one',
        },
        {
          id: 'arrive_compliment',
          type: 'compliment',
          text: "Well it worked. You look amazing.",
          tags: ['flattery'],
          interest: -2,
          comfort: 1,
          next: 'scene_one',
        },
      ],
    },

    arrive_again: {
      id: 'arrive_again',
      lines: [
        {
          text: "I didn't change at all this time. That's growth. Document it.",
          expression: 'amused',
          cue: 'She is already sitting down, already mid-thought, already easier with you.',
        },
      ],
      options: [
        {
          id: 'again_note',
          type: 'tease',
          text: "Documented. Filed under 'Wren, improvements to'.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'scene_one',
        },
        {
          id: 'again_warm',
          type: 'sincere',
          text: "You seem easier tonight. I like it.",
          tags: ['direct'],
          interest: 8,
          comfort: 6,
          next: 'scene_one',
        },
      ],
    },

    scene_one: {
      id: 'scene_one',
      lines: [
        {
          mood: 'bad',
          text: "Fair warning: four hours of sleep and a supervisor email. I am running on the worst possible fuel.",
          expression: 'bored',
          cue: 'She came anyway, on four hours, after that email.',
        },
        {
          text: "Right. I've got three conversational openers and they're all about the shelving system, which tells you everything.",
          expression: 'interested',
          cue: 'She is talking with her hands already. Good sign, if an early one.',
        },
      ],
      options: [
        {
          id: 'one_shelving',
          type: 'joke',
          text: "Lead with the shelving. I want the whole thing, unabridged, with diagrams.",
          tags: ['banter', 'books'],
          interest: 7,
          comfort: 5,
          next: 'the_bit',
        },
        {
          id: 'one_real',
          type: 'question',
          text: "Skip the openers. What's the thing you actually want to talk about tonight?",
          tags: ['curiosity', 'direct'],
          interest: 8,
          comfort: 4,
          next: 'the_real_thing',
        },
        {
          id: 'one_email',
          type: 'sincere',
          text: "Forget the email for two hours. It'll still be insufferable later.",
          tags: ['direct'],
          interest: 7,
          comfort: 7,
          next: 'the_bit',
        },
      ],
    },

    the_bit: {
      id: 'the_bit',
      lines: [
        {
          text: "The shelving is a moral position and I will die on this hill. Poetry under travel. Cookbooks in fantasy. The self-help section, which should simply be a mirror.",
          expression: 'laughing',
          cue: 'She is fully going now. This is the version of her nobody at the shop gets.',
        },
      ],
      topics: ['books', 'banter'],
      options: [
        {
          id: 'bit_build',
          type: 'joke',
          text: "And true crime goes under local history, depending on the town.",
          tags: ['banter'],
          interest: 8,
          comfort: 6,
          next: 'the_real_thing',
        },
        {
          id: 'bit_watch',
          type: 'sincere',
          text: "You're properly happy right now. I'd like to see that more often.",
          tags: ['direct', 'vulnerable'],
          interest: 9,
          comfort: 7,
          next: 'the_real_thing',
        },
      ],
    },

    the_real_thing: {
      id: 'the_real_thing',
      lines: [
        {
          minInterest: 65,
          text: "Fine. The real thing: I've been two years late on this thesis because finishing it means deciding what I am, and I'd rather stay a person who's about to be something.",
          expression: 'uncomfortable',
          cue: 'She said it fast and then looked at the table, and then made herself look back up.',
        },
        {
          text: "The real thing is that I talk a lot when I'm nervous and I have been talking for nineteen minutes. Your turn. Say something true.",
          expression: 'interested',
          cue: 'She physically sits on her hands.',
        },
      ],
      topics: ['vulnerable', 'work'],
      options: [
        {
          id: 'real_sit',
          type: 'sincere',
          text: "Then stay one a bit longer. There's no prize for finishing early and you're not late to anything that matters.",
          tags: ['direct', 'vulnerable'],
          interest: 11,
          comfort: 9,
          learn: ['wren_thesis'],
          next: 'scene_two',
        },
        {
          id: 'real_mine',
          type: 'story',
          text: "True thing: I go out on nights like this so I don't have to be in my flat being quietly twenty-nine.",
          tags: ['vulnerable'],
          interest: 9,
          comfort: 7,
          tell: ['player_lonely'],
          next: 'scene_two',
        },
        {
          id: 'real_fix',
          type: 'story',
          text: "You just need a deadline and a spreadsheet. Honestly, three weeks and it's done.",
          tags: ['pushy', 'bragging'],
          interest: -10,
          comfort: -8,
          next: 'date_sours',
        },
      ],
    },

    scene_two: {
      id: 'scene_two',
      lines: [
        {
          minInterest: 72,
          text: "I'm going to say this while I have the nerve: I've been looking forward to this since Tuesday, in a way I would describe as undignified.",
          expression: 'blushing',
          cue: 'Somewhere in the last hour she stopped performing at all.',
        },
        {
          text: "This has been better than the version of it I rehearsed, which is rare, because the rehearsed ones are usually excellent.",
          expression: 'interested',
          cue: 'She has finished her drink without once checking her phone.',
        },
      ],
      options: [
        {
          id: 'two_match',
          type: 'sincere',
          text: "Undignified is the good part. I've been counting days like a teenager.",
          tags: ['direct', 'vulnerable'],
          interest: 9,
          comfort: 7,
          next: 'walk_home',
        },
        {
          id: 'two_tease',
          type: 'tease',
          text: "So I beat a rehearsal. I'd like that in writing, in pencil, in the margin.",
          tags: ['banter'],
          interest: 8,
          comfort: 6,
          next: 'walk_home',
        },
      ],
    },

    walk_home: {
      id: 'walk_home',
      lines: [
        {
          minInterest: 75,
          text: "Walk me to the corner. Not the door, the corner — I need eleven minutes to stop being embarrassed before my flatmate sees my face.",
          expression: 'blushing',
          cue: 'She takes your arm on the second street without making a thing of it.',
        },
        {
          text: "Right. This was good. I'd like to do it again before I've had time to overthink it, please.",
          expression: 'interested',
          cue: 'The pause goes on slightly too long, in the best way.',
        },
      ],
      options: [
        {
          id: 'home_kiss',
          type: 'bold',
          text: "Eleven minutes. I'll use one of them.",
          tags: ['direct', 'innuendo'],
          requires: [
            { kind: 'interest', min: 66 },
            { kind: 'comfort', min: 62 },
          ],
          interest: 8,
          comfort: 2,
          next: 'end_great',
        },
        {
          id: 'home_soon',
          type: 'sincere',
          text: "Saturday. Before either of us overthinks anything.",
          tags: ['direct'],
          interest: 6,
          comfort: 6,
          next: 'end_good',
        },
        {
          id: 'home_push',
          type: 'bold',
          text: "Or we skip the corner and I come up.",
          tags: ['pushy'],
          interest: -6,
          comfort: -10,
          next: 'end_cold',
        },
      ],
    },

    date_sours: {
      id: 'date_sours',
      lines: [
        {
          text: "Right. A spreadsheet. Yes. Sorry — can we talk about literally anything else, I've gone a bit flat.",
          expression: 'bored',
          cue: 'She has picked her phone up off the table. That is the end of the good part.',
        },
      ],
      outcome: 'friendly',
      topics: ['pushy'],
    },

    end_great: {
      id: 'end_great',
      lines: [
        {
          text: "Oh — good. Yes. Good.",
          expression: 'blushing',
          cue: 'She kisses you on a corner under a broken streetlight and laughs halfway through, and the rest of the night is nobody else’s business.',
        },
      ],
      outcome: 'date_planned',
    },

    end_good: {
      id: 'end_good',
      lines: [
        {
          text: "Saturday. Yes. I'm going to go inside now and be extremely normal about this.",
          expression: 'amused',
          cue: 'She walks backwards for six steps, then gives up and turns round grinning.',
        },
      ],
      outcome: 'date_planned',
    },

    end_cold: {
      id: 'end_cold',
      lines: [
        {
          text: "No — sorry, no. That turned a corner faster than I wanted and I'd rather be honest than polite.",
          expression: 'uncomfortable',
          cue: 'She steps back to a normal distance and stays there.',
        },
      ],
      outcome: 'rejected',
      topics: ['pushy'],
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
  voice: [
    'She talks in tangents that land somewhere useful.',
    'She deflects compliments with facts. Flattery confuses her, then bores her.',
    'She asks what you think and actually waits for the answer.',
    'Excitable about ideas, precise about words, embarrassed about both.',
    'She will catch a lie instantly, because she has read the book.',
  ],
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
    { id: 'wren_marginalia', text: 'She annotates library books in pencil and considers this a public service.', unlocks: ['books'] , callback: 'Found a pencil note in a library book today and thought of you, criminal.' },
    { id: 'wren_thesis', text: "Her thesis is on urban loneliness and is two years late. She is enjoying it." , callback: 'How is urban loneliness coming along? The thesis, not the condition.' },
    { id: 'wren_film', text: 'She shoots film. Thirty-six pictures, three weeks of not knowing.', unlocks: ['art'] , callback: 'Has the roll come back yet or are you still in the three weeks of not knowing?' },
    { id: 'wren_climbs', text: 'She climbs at Ironhaus on Sundays, where nobody asks about the thesis.', unlocks: ['fitness'] , callback: 'How were the Sunday problems? Did anybody shout encouragement at a stranger?' },
    { id: 'wren_insomnia', text: 'Four hours a night. She calls it a routine to avoid calling it a problem.' , callback: 'Four hours again, or did you manage an outrageous five?' },
    { id: 'wren_coffee', text: 'She orders the second-cheapest coffee out of principle. Avoid the americano.' , callback: 'Ordered the second-cheapest coffee today. Out of principle. Yours.' },
  ],
  outfits: [
    {
      id: 'shop_afternoon',
      name: 'Afternoon layers',
      worn: ['margin_notes'],
      palette: { primary: '#8a4a28', secondary: '#1f4a4a', accent: '#3fbf85' },
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
  /** Her generated key-art portrait, loaded straight from the render host. */
  portrait: 'https://d8j0ntlcm91z4.cloudfront.net/user_37NVjOty0iqni6aBd5Kpn88QUhU/hf_20260923_183030_9467da64-2709-4ffa-a2f6-18dfced590b0.png',
  palette: {
    hair: '#2a2338',
    hairShadow: '#150f1e',
    skin: '#7d4a2c',
    eyes: '#3fbf85',
    accent: '#3fbf85',
    background: '#1a2233',
  },
  knows: ['nadia'],
  texts: {
    replies: {
      playful: {
        good: [
          "Ha! Right, I'm stealing that and using it on my supervisor.",
          "That's the second-best thing anyone has sent me today and the first was a photo of a dog.",
        ],
        bad: ["Ha. Sorry — deep in a chapter, brain is elsewhere."],
      },
      warm: {
        good: [
          "That's very kind and I'm going to sit with it for a minute like a cat in a sunbeam.",
          "You are surprisingly good at saying things directly. I'm taking notes.",
        ],
        bad: ["Thank you! Sorry. Bad sleep, low battery, both mine and the phone's."],
      },
      direct: {
        good: [
          "Yes. Ask properly and I'll say yes properly.",
          "Efficient. I respect it. Also yes.",
        ],
        bad: ["That's a lot of certainty for a Tuesday. Let me have a think."],
      },
      callback: {
        good: [
          "YOU REMEMBERED THE FOOTNOTE. Sorry. Caps. But you did.",
          "See, that's the thing — nobody remembers the bit I actually cared about. You did.",
        ],
        bad: ["Not quite, but I'm charmed that you tried."],
      },
    },
    opens: [
      "Found a 2011 marginal note that says 'this is nonsense' and I have never agreed with a stranger more. Anyway. Hello.",
      "I have been awake since four and I have a theory about bus stops. Are you free or are you busy",
      "Second-cheapest coffee, corner table, no thoughts. Come and interrupt me.",
    ],
    acceptsDate: [
      "Yes. And I'm going to overthink what to wear for four days, which is its own hobby.",
      "Alright. On the condition that we are allowed to leave if it's boring, both of us, no hard feelings.",
    ],
    declinesDate: [
      "Not yet — I like this and I don't want to rush it into being something I have to manage.",
      "I'm going to say no. I'd rather say no now than be weird about it later.",
    ],
    stoodUp: [
      "I brought a book, which was lucky, because I read most of it. Don't do that again.",
    ],
  },
  dialogue,
  dateDialogue,
};
