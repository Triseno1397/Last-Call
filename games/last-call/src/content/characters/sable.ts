import type { CharacterDef } from '@/types/character';
import type { DialogueTree } from '@/types/dialogue';

/**
 * Sable Marchetti — the sharp-tongued bartender.
 *
 * Writing rules for her voice:
 *  - She talks in short sentences. She does not explain herself twice.
 *  - She has heard every line in this building. Flattery bounces off her.
 *  - She rewards directness, curiosity and being genuinely funny, in that order.
 *  - Underneath it she is warm, and she hates that it shows.
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
    // --- Openings ---------------------------------------------------------
    open_stranger: {
      id: 'open_stranger',
      lines: [
        {
          mood: 'good',
          text: "You've got the face of a man about to order something complicated.",
          expression: 'amused',
          cue: 'She sets a glass down and actually looks at you.',
        },
        {
          mood: 'okay',
          text: "What'll it be.",
          expression: 'neutral',
          cue: 'She is already reaching for a glass. You have about four seconds.',
        },
        {
          mood: 'bad',
          text: "If you're about to ask me what's good, the answer is water.",
          expression: 'bored',
          cue: "She doesn't look up from the ice well.",
        },
      ],
      options: [
        {
          id: 'open_joke',
          type: 'joke',
          text: "Something complicated. I'll nod like I know what's in it.",
          tags: ['banter'],
          interest: 3,
          comfort: 2,
          next: 'order_joke',
        },
        {
          id: 'open_direct',
          type: 'sincere',
          text: "Whatever you'd drink at the end of your shift.",
          tags: ['direct'],
          interest: 4,
          comfort: 3,
          next: 'order_direct',
        },
        {
          id: 'open_question',
          type: 'question',
          text: "What do people order when they don't know what they want?",
          tags: ['curiosity'],
          interest: 3,
          comfort: 3,
          next: 'order_question',
        },
        {
          id: 'open_flattery',
          type: 'compliment',
          text: "You're far too good-looking to be working a Wednesday.",
          tags: ['flattery'],
          interest: -4,
          comfort: -3,
          next: 'flattery_miss',
        },
        {
          id: 'open_exit',
          type: 'exit',
          text: "You're slammed. I'll get out of your way.",
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
          text: "Oh good, you're back. I had a whole thing prepared and nowhere to put it.",
          expression: 'amused',
          cue: 'She is smiling before she has decided to.',
        },
        {
          mood: 'okay',
          text: 'You again. Same as last time, or are we being adventurous.',
          expression: 'neutral',
          cue: 'She reaches for a glass without asking which one.',
        },
        {
          mood: 'bad',
          text: "It's been a night. Sit, don't ask me how it's going.",
          expression: 'annoyed',
          cue: 'Her jaw is tight. Something happened before you got here.',
        },
      ],
      options: [
        {
          id: 'ack_bad_day',
          type: 'sincere',
          text: "Then I won't ask. Same as last time.",
          tags: ['direct'],
          interest: 5,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'ack_joke',
          type: 'joke',
          text: "Adventurous. Within reason. I have work tomorrow and a fragile sense of self.",
          tags: ['banter'],
          interest: 4,
          comfort: 3,
          next: 'hub',
        },
        {
          id: 'ack_question',
          type: 'question',
          text: 'What was the thing you had prepared?',
          tags: ['curiosity'],
          interest: 4,
          comfort: 2,
          next: 'prepared_bit',
        },
        {
          id: 'ack_push',
          type: 'bold',
          text: "Rough night? Tell me about it, I'm a great listener.",
          tags: ['pushy'],
          interest: -3,
          comfort: -4,
          next: 'pushed_too_soon',
        },
      ],
    },

    open_interested: {
      id: 'open_interested',
      lines: [
        {
          text: "There he is. I was starting to think I'd have to talk to the regulars.",
          expression: 'interested',
          cue: 'She puts down what she was doing. That is new.',
          minInterest: 55,
        },
        {
          text: "You're early. The good ice isn't even out yet.",
          expression: 'amused',
          cue: 'She glances at the clock, then at you, and decides not to mind.',
        },
      ],
      options: [
        {
          id: 'int_tease',
          type: 'tease',
          text: "I'll wait for the good ice. I'm a man of standards now.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'int_sincere',
          type: 'sincere',
          text: 'I came early because I wanted to talk to you before it gets loud.',
          tags: ['direct', 'vulnerable'],
          interest: 7,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'int_number',
          type: 'bold',
          text: "Then let's skip the part where I pretend I'm here for the bourbon. Give me your number.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 55 },
            { kind: 'comfort', min: 50 },
          ],
          interest: 6,
          comfort: -2,
          next: 'number_yes',
        },
      ],
    },

    open_cold: {
      id: 'open_cold',
      lines: [
        {
          text: "We're good, you and I. Let's keep it that way.",
          expression: 'neutral',
          cue: 'Professional. Pleasant. A wall with a smile painted on it.',
        },
      ],
      options: [
        {
          id: 'cold_leave',
          type: 'exit',
          text: 'Understood. Good to see you anyway.',
          tags: ['direct'],
          comfort: 2,
          next: 'exit_polite',
        },
      ],
    },

    // --- Opening branches -------------------------------------------------
    order_joke: {
      id: 'order_joke',
      lines: [
        {
          text: "Three ingredients, one of them is a dare. If you make a face I'm telling everyone.",
          expression: 'amused',
          cue: 'She is already building it. She did not have to think about it.',
        },
      ],
      topics: ['banter'],
      options: [
        {
          id: 'joke_drink_good',
          type: 'tease',
          text: "That's genuinely good. Annoying. I wanted to hate it.",
          tags: ['banter'],
          interest: 4,
          comfort: 3,
          next: 'hub',
        },
        {
          id: 'joke_drink_brag',
          type: 'story',
          text: "Decent. I did a cocktail course in Barcelona, so, you know. Trained palate.",
          tags: ['bragging'],
          interest: -5,
          comfort: -2,
          next: 'brag_deflate',
        },
        {
          id: 'joke_drink_question',
          type: 'question',
          text: 'What was the dare ingredient?',
          tags: ['curiosity'],
          interest: 3,
          comfort: 2,
          learn: ['sable_bitters'],
          next: 'hub',
        },
      ],
    },

    order_direct: {
      id: 'order_direct',
      lines: [
        {
          text: "Huh. Nobody asks that.",
          expression: 'interested',
          cue: 'She stops for half a second. You have her attention, briefly.',
        },
        {
          minInterest: 40,
          text: "Nobody asks that. It's bourbon, one cube, and eleven minutes of silence.",
          expression: 'interested',
          cue: 'She pours two. One of them is hers.',
        },
      ],
      topics: ['direct'],
      options: [
        {
          id: 'direct_silence',
          type: 'sincere',
          text: "Then I'll take the bourbon and give you the eleven minutes.",
          tags: ['direct'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'direct_joke',
          type: 'joke',
          text: "Eleven minutes exactly? That's very specific for someone who's clearly fine.",
          tags: ['banter'],
          interest: 4,
          comfort: 2,
          next: 'hub',
        },
        {
          id: 'direct_push',
          type: 'bold',
          text: "Long shift? You should let someone buy you a drink for once.",
          tags: ['pushy', 'flattery'],
          interest: -2,
          comfort: -4,
          next: 'pushed_too_soon',
        },
      ],
    },

    order_question: {
      id: 'order_question',
      lines: [
        {
          text: "Vodka soda, and then they look at their phone for an hour. You want the honest version or the polite one?",
          expression: 'neutral',
          cue: 'She leans a hip against the back counter. She has time for this.',
        },
      ],
      topics: ['curiosity'],
      options: [
        {
          id: 'question_honest',
          type: 'question',
          text: 'Honest. Always honest.',
          tags: ['direct'],
          interest: 5,
          comfort: 3,
          learn: ['sable_reads_people'],
          next: 'hub',
        },
        {
          id: 'question_polite',
          type: 'joke',
          text: "Polite. I'm fragile and it's early.",
          tags: ['banter'],
          interest: 3,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    flattery_miss: {
      id: 'flattery_miss',
      lines: [
        {
          text: "Wednesday pays the same as Saturday. Do you want a drink or a compliment, because I only make one of those.",
          expression: 'bored',
          cue: 'Her smile arrives on schedule and leaves early.',
        },
      ],
      topics: ['flattery'],
      options: [
        {
          id: 'flattery_recover',
          type: 'sincere',
          text: "Fair. That was lazy. Start again: what should I actually drink?",
          tags: ['direct'],
          interest: 4,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'flattery_double',
          type: 'compliment',
          text: "I'm serious though, you've got incredible eyes.",
          tags: ['flattery', 'pushy'],
          interest: -6,
          comfort: -7,
          next: 'pushed_too_soon',
        },
        {
          id: 'flattery_joke',
          type: 'joke',
          text: "Drink. Definitely the drink. The compliment clearly has a queue.",
          tags: ['banter'],
          interest: 3,
          comfort: 3,
          next: 'hub',
        },
      ],
    },

    prepared_bit: {
      id: 'prepared_bit',
      lines: [
        {
          text: "A man tried to pay for a forty-dollar round in scratch cards. Two of them were winners. He is now my favourite person in the world and he doesn't know it.",
          expression: 'laughing',
          cue: 'She laughs properly. It takes ten years off her.',
        },
      ],
      topics: ['banter'],
      options: [
        {
          id: 'prepared_build',
          type: 'joke',
          text: "So what you're saying is the house accepts scratch cards now.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'prepared_warm',
          type: 'sincere',
          text: "You like this place. The way you tell it, I mean.",
          tags: ['curiosity', 'direct'],
          interest: 6,
          comfort: 5,
          learn: ['sable_loves_bar'],
          next: 'hub',
        },
      ],
    },

    brag_deflate: {
      id: 'brag_deflate',
      lines: [
        {
          text: "Barcelona. Wow. And here I am, self-taught, in a bar with one working tap.",
          expression: 'annoyed',
          cue: 'She turns to serve someone who has not mentioned Barcelona.',
        },
      ],
      topics: ['bragging'],
      options: [
        {
          id: 'brag_recover',
          type: 'sincere',
          text: "That came out like a CV. Sorry. It's a good drink and I couldn't make it.",
          tags: ['direct', 'vulnerable'],
          interest: 4,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'brag_worse',
          type: 'story',
          text: "Self-taught is great. I could show you a couple of techniques sometime.",
          tags: ['bragging', 'pushy'],
          interest: -7,
          comfort: -6,
          next: 'pushed_too_soon',
        },
      ],
    },

    // --- The hub ----------------------------------------------------------
    hub: {
      id: 'hub',
      lines: [
        {
          mood: 'bad',
          text: "So. Talk, or drink. Either's fine, I'm not great company tonight.",
          expression: 'neutral',
          cue: 'She wipes the same clean spot on the bar twice.',
        },
        {
          minInterest: 60,
          text: "Go on then. You've clearly got something.",
          expression: 'interested',
          cue: 'She has stopped finding things to do with her hands.',
        },
        {
          text: 'Right. Where were we.',
          expression: 'neutral',
          cue: 'She glances down the bar, then back at you. You still have the floor.',
        },
      ],
      options: [
        {
          id: 'hub_jukebox',
          type: 'question',
          text: "Who's in charge of this jukebox? It's suspiciously good.",
          tags: ['music', 'curiosity'],
          interest: 3,
          comfort: 2,
          next: 'topic_jukebox',
        },
        {
          id: 'hub_darts',
          type: 'tease',
          text: "There's a fresh hole in the wall by that dartboard. Someone's banned, aren't they.",
          tags: ['banter', 'nightlife'],
          interest: 4,
          comfort: 3,
          next: 'topic_darts',
        },
        {
          id: 'hub_why_here',
          type: 'question',
          text: 'How long have you been behind this bar?',
          tags: ['work', 'curiosity'],
          interest: 3,
          comfort: 2,
          next: 'topic_work',
        },
        {
          id: 'hub_tattoo',
          type: 'question',
          text: "That line on your forearm — is it from a song?",
          tags: ['curiosity', 'music'],
          requires: [{ kind: 'comfort', min: 55 }],
          interest: 5,
          comfort: -2,
          learn: ['sable_tattoo'],
          next: 'topic_tattoo',
        },
        {
          id: 'hub_food',
          type: 'question',
          text: "Where does someone eat at two in the morning around here?",
          tags: ['food', 'curiosity'],
          interest: 4,
          comfort: 3,
          learn: ['sable_cooks'],
          next: 'topic_food',
        },
        {
          id: 'hub_cook_together',
          type: 'story',
          text: "I'd cook. I get home late and end up making something stupid at 3am.",
          tags: ['food', 'vulnerable'],
          requires: [{ kind: 'hobby', hobby: 'cooking', minLevel: 1 }],
          interest: 8,
          comfort: 5,
          tell: ['player_cooks'],
          next: 'topic_food_shared',
        },
        {
          id: 'hub_read_room',
          type: 'sincere',
          text: "You've clocked something about me already, haven't you. Go on, say it.",
          tags: ['direct', 'banter'],
          requires: [{ kind: 'stat', stat: 'confidence', min: 45 }],
          interest: 7,
          comfort: 1,
          next: 'topic_read',
        },
        {
          id: 'hub_number',
          type: 'bold',
          text: "I'm going to run out of bar-related questions soon. Give me your number and I'll come up with better ones.",
          tags: ['direct'],
          requires: [
            { kind: 'interest', min: 58 },
            { kind: 'comfort', min: 52 },
          ],
          interest: 5,
          comfort: -2,
          next: 'number_yes',
        },
        {
          id: 'hub_number_early',
          type: 'bold',
          text: "Let me take you out. Properly. Not here.",
          tags: ['pushy'],
          interest: -2,
          comfort: -8,
          next: 'number_early',
        },
        {
          id: 'hub_exit',
          type: 'exit',
          text: "I'm going to leave while I'm ahead. Good to meet you.",
          tags: ['direct'],
          comfort: 3,
          next: 'exit_friendly',
        },
      ],
    },

    // --- Topics -----------------------------------------------------------
    topic_jukebox: {
      id: 'topic_jukebox',
      lines: [
        {
          text: "Me. There's a locked playlist and I'm not sorry about it. Somebody put on nine minutes of prog rock in March and I have not recovered.",
          expression: 'amused',
          cue: 'She says "locked playlist" the way other people say "my son".',
        },
      ],
      topics: ['music'],
      options: [
        {
          id: 'jukebox_guess',
          type: 'tease',
          text: "Nine minutes is a commitment. Honestly? Respect to him.",
          tags: ['banter', 'music'],
          interest: 4,
          comfort: 3,
          next: 'hub',
        },
        {
          id: 'jukebox_music_nerd',
          type: 'story',
          text: "I play a bit. Badly, and only after midnight, which is the correct way.",
          tags: ['music'],
          requires: [{ kind: 'hobby', hobby: 'guitar', minLevel: 1 }],
          interest: 7,
          comfort: 4,
          tell: ['player_plays_guitar'],
          learn: ['sable_records'],
          next: 'topic_music_shared',
        },
        {
          id: 'jukebox_culture',
          type: 'question',
          text: "What's the one song you put on when the place has emptied out?",
          tags: ['music', 'curiosity'],
          requires: [{ kind: 'stat', stat: 'culture', min: 40 }],
          interest: 6,
          comfort: 4,
          learn: ['sable_records'],
          next: 'hub',
        },
      ],
    },

    topic_music_shared: {
      id: 'topic_music_shared',
      lines: [
        {
          text: "After midnight is the only correct way. Alright. You've got one song to prove you're not a menace. Choose carefully.",
          expression: 'interested',
          cue: 'She has leaned in. Both elbows on the bar. This is a different conversation now.',
        },
      ],
      topics: ['music'],
      options: [
        {
          id: 'music_shared_answer',
          type: 'sincere',
          text: "Something slow and mean, with a voice that sounds like it's been up all night.",
          tags: ['music', 'direct'],
          interest: 8,
          comfort: 5,
          next: 'hub',
        },
        {
          id: 'music_shared_joke',
          type: 'joke',
          text: "Nine minutes of prog rock. Final answer.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'hub',
        },
      ],
    },

    topic_darts: {
      id: 'topic_darts',
      lines: [
        {
          text: "Gary. Gary is banned until he apologises to the wall. He has apologised to me, the dartboard and a stranger, but not the wall.",
          expression: 'laughing',
          cue: 'She points at the hole like it is a family member.',
        },
      ],
      topics: ['banter', 'nightlife'],
      options: [
        {
          id: 'darts_challenge',
          type: 'tease',
          text: "I'd like it on record that I would never do that to a wall.",
          tags: ['banter'],
          interest: 4,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'darts_play',
          type: 'bold',
          text: "Best of three. If I win, you tell me something true about you.",
          tags: ['banter', 'direct'],
          requires: [{ kind: 'stat', stat: 'confidence', min: 40 }],
          interest: 7,
          comfort: 2,
          next: 'darts_accepted',
        },
      ],
    },

    darts_accepted: {
      id: 'darts_accepted',
      lines: [
        {
          text: "I'm working, so you'll have to beat me in instalments. And if I win, you leave a tip that embarrasses you.",
          expression: 'amused',
          cue: 'She is already reaching under the bar for the darts. She keeps them close.',
        },
      ],
      options: [
        {
          id: 'darts_deal',
          type: 'tease',
          text: 'Deal. I hope you like disappointment.',
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_work: {
      id: 'topic_work',
      lines: [
        {
          mood: 'bad',
          text: "Long enough. Tonight it feels like longer.",
          expression: 'bored',
          cue: 'That was a door closing, politely.',
        },
        {
          text: "Six years. I was going to do it for six months while I figured out law school.",
          expression: 'neutral',
          cue: 'Something crosses her face and gets put away.',
        },
      ],
      topics: ['work'],
      options: [
        {
          id: 'work_law',
          type: 'question',
          text: 'Law school. Did you finish?',
          tags: ['curiosity'],
          interest: 2,
          comfort: -3,
          learn: ['sable_law_school'],
          next: 'topic_law',
        },
        {
          id: 'work_leave_it',
          type: 'sincere',
          text: "Six years and you still like it. That's rarer than finishing anything.",
          tags: ['direct'],
          interest: 7,
          comfort: 6,
          next: 'hub',
        },
        {
          id: 'work_joke',
          type: 'joke',
          text: "Six months is how everyone describes the last six years of their life.",
          tags: ['banter'],
          interest: 5,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_law: {
      id: 'topic_law',
      lines: [
        {
          text: "Two years in. Then my dad got sick and the bar needed someone and it turned out I'm better at this. That's the whole story and it's not a sad one, so don't do the face.",
          expression: 'uncomfortable',
          cue: 'She is watching to see whether you do the face.',
        },
      ],
      topics: ['work', 'family', 'vulnerable'],
      options: [
        {
          id: 'law_no_face',
          type: 'sincere',
          text: "No face. You're good at this, and you like it. That's two more than most people get.",
          tags: ['direct'],
          interest: 9,
          comfort: 8,
          learn: ['sable_dad'],
          next: 'hub',
        },
        {
          id: 'law_pity',
          type: 'compliment',
          text: "That's really brave of you. Seriously, giving all that up.",
          tags: ['flattery', 'pushy'],
          interest: -6,
          comfort: -6,
          next: 'pushed_too_soon',
        },
        {
          id: 'law_joke',
          type: 'joke',
          text: "So you can still technically object to things. That's an incredible bar skill.",
          tags: ['banter'],
          interest: 5,
          comfort: 3,
          next: 'hub',
        },
      ],
    },

    topic_tattoo: {
      id: 'topic_tattoo',
      lines: [
        {
          text: "It is. I'm not telling you which one. If you guess it, I'll tell you — but you get one guess per visit, and you've used tonight's already.",
          expression: 'amused',
          cue: 'She pulls her sleeve down, but slowly. That is an invitation to come back.',
        },
      ],
      topics: ['music', 'curiosity'],
      options: [
        {
          id: 'tattoo_play',
          type: 'tease',
          text: "One guess a visit. You've just given me a reason to keep coming back and you know it.",
          tags: ['banter', 'direct'],
          interest: 8,
          comfort: 4,
          next: 'hub',
        },
        {
          id: 'tattoo_push',
          type: 'bold',
          text: "Come on. Just tell me.",
          tags: ['pushy'],
          interest: -4,
          comfort: -6,
          next: 'pushed_too_soon',
        },
      ],
    },

    topic_food: {
      id: 'topic_food',
      lines: [
        {
          text: "Nowhere. Everything good shuts at midnight, which is why I cook when I get in. Three in the morning, one pan, whatever's left in the fridge.",
          expression: 'neutral',
          cue: "She says it lightly. It is the most personal thing she's said all night.",
        },
      ],
      topics: ['food'],
      options: [
        {
          id: 'food_curious',
          type: 'question',
          text: 'What was the last thing you made at 3am?',
          tags: ['curiosity', 'food'],
          interest: 6,
          comfort: 5,
          learn: ['sable_cooks'],
          next: 'hub',
        },
        {
          id: 'food_joke',
          type: 'joke',
          text: "One pan at 3am is either a hobby or a cry for help, and I refuse to decide which.",
          tags: ['banter'],
          interest: 4,
          comfort: 4,
          next: 'hub',
        },
      ],
    },

    topic_food_shared: {
      id: 'topic_food_shared',
      lines: [
        {
          text: "Wait. You actually cook? At 3am? In a pan, like a person?",
          expression: 'interested',
          cue: 'She has completely stopped working. Somebody down the bar is being ignored for you.',
        },
      ],
      topics: ['food'],
      options: [
        {
          id: 'food_shared_offer',
          type: 'bold',
          text: "I'd cook for you. After a shift, whenever that is. No agenda, just better than a pan of whatever's left.",
          tags: ['direct'],
          requires: [{ kind: 'comfort', min: 50 }],
          interest: 10,
          comfort: 2,
          next: 'number_yes',
        },
        {
          id: 'food_shared_banter',
          type: 'tease',
          text: "In a pan, like a person. Mostly eggs. It's not a personality, it's a coping mechanism.",
          tags: ['banter', 'vulnerable'],
          interest: 7,
          comfort: 6,
          next: 'hub',
        },
      ],
    },

    topic_read: {
      id: 'topic_read',
      lines: [
        {
          text: "Alright. You're not here for the bourbon, you're nervous about the right thing rather than the wrong thing, and you've looked at the door twice. Your turn.",
          expression: 'interested',
          cue: 'She has you dead to rights and is enjoying it enormously.',
        },
      ],
      topics: ['direct'],
      options: [
        {
          id: 'read_back',
          type: 'tease',
          text: "You reorganise the bottles when you're annoyed. You've done it twice since I sat down.",
          tags: ['banter', 'direct'],
          requires: [{ kind: 'stat', stat: 'charm', min: 42 }],
          interest: 9,
          comfort: 5,
          learn: ['sable_reads_people'],
          next: 'hub',
        },
        {
          id: 'read_honest',
          type: 'sincere',
          text: "I looked at the door because I wasn't sure I should come in. Then I did.",
          tags: ['vulnerable', 'direct'],
          interest: 8,
          comfort: 7,
          tell: ['player_honest'],
          next: 'hub',
        },
        {
          id: 'read_deflect',
          type: 'joke',
          text: "I'm nervous about the bourbon, actually. It's very expensive bourbon.",
          tags: ['banter'],
          interest: 4,
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
          minInterest: 62,
          text: "Finally. I was going to write it on a napkin and slide it over like it's 1997.",
          expression: 'blushing',
          cue: 'She writes it on a receipt and folds it once before handing it over.',
        },
        {
          text: "Alright. Text me something that isn't 'hey'. I mean it, I will not answer 'hey'.",
          expression: 'amused',
          cue: 'She taps her number into your phone faster than you could have.',
        },
      ],
      outcome: 'number',
      topics: ['direct'],
    },

    number_early: {
      id: 'number_early',
      lines: [
        {
          text: "We've known each other eleven minutes and four of those were about ice.",
          expression: 'uncomfortable',
          cue: 'She takes a step back to the till that she did not need to take.',
        },
      ],
      outcome: 'rejected',
      topics: ['pushy'],
    },

    pushed_too_soon: {
      id: 'pushed_too_soon',
      lines: [
        {
          text: "I'm going to go and check on a keg that is completely fine.",
          expression: 'annoyed',
          cue: 'She is gone before the sentence finishes landing.',
        },
      ],
      outcome: 'she_left',
      topics: ['pushy'],
    },

    exit_friendly: {
      id: 'exit_friendly',
      lines: [
        {
          minInterest: 45,
          text: "Leaving while you're ahead. Irritating. Come back Thursday, I'm on until close.",
          expression: 'interested',
          cue: 'She says the day out loud. That was not an accident.',
        },
        {
          text: "Good to meet you too. Mind the step on the way out, everyone forgets the step.",
          expression: 'neutral',
          cue: 'She is already looking at the next person. Fair enough.',
        },
      ],
      outcome: 'friendly',
    },

    exit_polite: {
      id: 'exit_polite',
      lines: [
        {
          text: "Appreciated. Genuinely.",
          expression: 'neutral',
          cue: 'A nod. Small, but real.',
        },
      ],
      outcome: 'you_left',
    },
  },
};

/** Her date tree: three scenes, longer leash, higher stakes. */
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
          text: "So this is me without the bar in the way. Weird, isn't it. No counter, nothing to do with my hands.",
          expression: 'interested',
          cue: 'No apron. Hair down. She keeps almost reaching for a glass that is not there.',
        },
      ],
      options: [
        {
          id: 'arrive_honest',
          type: 'sincere',
          text: "It is weird. Good weird. I've only ever seen you working.",
          tags: ['direct'],
          interest: 6,
          comfort: 5,
          next: 'scene_one',
        },
        {
          id: 'arrive_tease',
          type: 'tease',
          text: "Here. Hold my glass. Now you've got something to do with your hands and I've got nothing to drink.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'scene_one',
        },
        {
          id: 'arrive_flat',
          type: 'compliment',
          text: "You look incredible, by the way. Genuinely. Wow.",
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
          text: "Second one of these. I'm choosing not to be weird about what that means.",
          expression: 'blushing',
          cue: 'She got here first. She never gets anywhere first.',
        },
      ],
      options: [
        {
          id: 'again_warm',
          type: 'sincere',
          text: "Be weird about it. I'm being weird about it.",
          tags: ['direct', 'vulnerable'],
          interest: 8,
          comfort: 6,
          next: 'scene_one',
        },
        {
          id: 'again_joke',
          type: 'joke',
          text: "It means we've established a pattern. Two more and it's a tradition with a newsletter.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'scene_one',
        },
      ],
    },

    scene_one: {
      id: 'scene_one',
      lines: [
        {
          mood: 'bad',
          text: "Right. Full disclosure, today has been a day, so if I go quiet it is not you.",
          expression: 'uncomfortable',
          cue: 'She is here anyway. That is not nothing.',
        },
        {
          text: "Alright. We've got a whole evening and no last orders. I have no idea how to do this bit.",
          expression: 'interested',
          cue: 'She laughs at herself, which she does not do at work.',
        },
      ],
      options: [
        {
          id: 'one_ask',
          type: 'question',
          text: "Then let's do the bit nobody does. What were you like at nineteen?",
          tags: ['curiosity'],
          interest: 6,
          comfort: 4,
          next: 'nineteen',
        },
        {
          id: 'one_food',
          type: 'question',
          text: "You cook at 3am. Tonight somebody else is cooking. Is that better or worse?",
          tags: ['food', 'curiosity'],
          interest: 6,
          comfort: 5,
          next: 'food_talk',
        },
        {
          id: 'one_bold',
          type: 'bold',
          text: "Nobody knows how to do this bit. That's the bit. Ask me anything and I'll answer it properly.",
          tags: ['direct'],
          interest: 8,
          comfort: 3,
          next: 'her_question',
        },
      ],
    },

    nineteen: {
      id: 'nineteen',
      lines: [
        {
          text: "Unbearable. Certain about everything, wrong about most of it, and I had a fringe that deserved its own trial. You?",
          expression: 'laughing',
          cue: 'She has turned in her chair. Whole body, towards you.',
        },
      ],
      topics: ['vulnerable', 'banter'],
      options: [
        {
          id: 'nineteen_honest',
          type: 'story',
          text: "Quiet. Waiting to be picked for something. Took me years to work out nobody picks you.",
          tags: ['vulnerable', 'direct'],
          interest: 8,
          comfort: 6,
          tell: ['player_late_bloomer'],
          next: 'scene_two',
        },
        {
          id: 'nineteen_joke',
          type: 'joke',
          text: "I had a phase where I only wore one colour. I cannot tell you which colour. It's still a wound.",
          tags: ['banter'],
          interest: 6,
          comfort: 5,
          next: 'scene_two',
        },
      ],
    },

    food_talk: {
      id: 'food_talk',
      lines: [
        {
          text: "Worse. Obviously worse. There's no pan and I can't hide behind doing something. This is just talking, at you, with my face.",
          expression: 'amused',
          cue: 'She says it like a complaint and she is completely delighted.',
        },
      ],
      topics: ['food', 'banter'],
      options: [
        {
          id: 'food_reassure',
          type: 'sincere',
          text: "Your face is doing fine. Keep going.",
          tags: ['direct'],
          interest: 7,
          comfort: 6,
          next: 'scene_two',
        },
        {
          id: 'food_offer',
          type: 'bold',
          text: "Then next time, your kitchen, three in the morning, and I'll do the washing up.",
          tags: ['direct', 'food'],
          requires: [{ kind: 'comfort', min: 55 }],
          interest: 9,
          comfort: 3,
          next: 'scene_two',
        },
      ],
    },

    her_question: {
      id: 'her_question',
      lines: [
        {
          text: "Fine. Why me? And don't say the bourbon — everyone says the bourbon.",
          expression: 'interested',
          cue: 'This is a real question. She has put her glass down for it.',
        },
      ],
      topics: ['direct', 'vulnerable'],
      options: [
        {
          id: 'why_true',
          type: 'sincere',
          text: "Because you say the true thing before the polite thing, and I've spent my whole life doing it the other way round.",
          tags: ['direct', 'vulnerable'],
          interest: 11,
          comfort: 7,
          next: 'scene_two',
        },
        {
          id: 'why_funny',
          type: 'joke',
          text: "Because you're the only person who's ever insulted me into coming back four times.",
          tags: ['banter'],
          interest: 7,
          comfort: 5,
          next: 'scene_two',
        },
        {
          id: 'why_smooth',
          type: 'compliment',
          text: "Look at you. That's the whole answer.",
          tags: ['flattery'],
          interest: -5,
          comfort: -4,
          next: 'scene_two',
        },
      ],
    },

    scene_two: {
      id: 'scene_two',
      lines: [
        {
          minInterest: 70,
          text: "Okay. Here's the one I don't do. My dad's bar. That's why I'm there — he got sick, I stayed, and I stopped telling people because they do the face.",
          expression: 'uncomfortable',
          cue: 'She is watching your face very carefully. This is the whole date, right here.',
        },
        {
          text: "It's late and I've talked about myself for an hour, which I never do. Say something, quickly, before I notice.",
          expression: 'blushing',
          cue: 'Her hand is flat on the table, a few inches from yours, and she has not moved it.',
        },
      ],
      topics: ['vulnerable', 'family'],
      options: [
        {
          id: 'two_no_face',
          type: 'sincere',
          text: "No face. Just — thank you for telling me. That's all.",
          tags: ['direct', 'vulnerable'],
          interest: 10,
          comfort: 9,
          learn: ['sable_dad'],
          next: 'walk_home',
        },
        {
          id: 'two_tease',
          type: 'tease',
          text: "Noticed. Logged. I'll bring it up at the worst possible moment in about a month.",
          tags: ['banter'],
          interest: 7,
          comfort: 6,
          next: 'walk_home',
        },
        {
          id: 'two_advice',
          type: 'story',
          text: "You know you could still go back to law, right? You'd be great at it.",
          tags: ['pushy'],
          interest: -9,
          comfort: -8,
          next: 'date_sours',
        },
      ],
    },

    walk_home: {
      id: 'walk_home',
      lines: [
        {
          minInterest: 75,
          text: "Walk me back. And then — I'm going to stop talking now, which for me is basically a declaration.",
          expression: 'blushing',
          cue: 'She is standing closer than the pavement requires.',
        },
        {
          text: "Right. That's me. This was — yeah. This was good.",
          expression: 'interested',
          cue: 'Neither of you is walking away yet. Nobody is checking a phone.',
        },
      ],
      options: [
        {
          id: 'home_kiss',
          type: 'bold',
          text: "Stop talking, then.",
          tags: ['direct', 'innuendo'],
          requires: [
            { kind: 'interest', min: 68 },
            { kind: 'comfort', min: 62 },
          ],
          interest: 8,
          comfort: 2,
          next: 'end_great',
        },
        {
          id: 'home_again',
          type: 'sincere',
          text: "Let's do this again. Soon, and not at your bar.",
          tags: ['direct'],
          interest: 6,
          comfort: 5,
          next: 'end_good',
        },
        {
          id: 'home_push',
          type: 'bold',
          text: "Invite me up.",
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
          text: "There it is. The face, and then the plan. I'm going to get the bill and we're going to talk about literally anything else.",
          expression: 'annoyed',
          cue: 'The door has closed. It closed while you were still talking.',
        },
      ],
      outcome: 'friendly',
      topics: ['pushy'],
    },

    end_great: {
      id: 'end_great',
      lines: [
        {
          text: "Finally.",
          expression: 'blushing',
          cue: "She kisses you in a doorway on a wet street, and the rest of the night belongs to the two of you. The city keeps going without you.",
        },
      ],
      outcome: 'date_planned',
      topics: ['direct'],
    },

    end_good: {
      id: 'end_good',
      lines: [
        {
          text: "Not at my bar. Deal. Text me tomorrow, not tonight — tonight I'm going to sit with this for a bit.",
          expression: 'interested',
          cue: 'She squeezes your arm once and goes inside, and the light in the hallway stays on a long time.',
        },
      ],
      outcome: 'date_planned',
    },

    end_cold: {
      id: 'end_cold',
      lines: [
        {
          text: "And there's the ask. No. Goodnight — I mean that kindly, and I do mean goodnight.",
          expression: 'uncomfortable',
          cue: 'Door, lock, hallway light off. Efficiently.',
        },
      ],
      outcome: 'rejected',
      topics: ['pushy'],
    },
  },
};

export const SABLE: CharacterDef = {
  id: 'sable',
  name: 'Sable',
  age: 29,
  gender: 'woman',
  archetype: 'The bartender who has heard it all',
  tagline: 'runs the bar, the jukebox, and the room',
  bio: "Six years behind the bar at Last Call, two years of law school she does not discuss, and a locked jukebox playlist she absolutely does. Quick, dry, and kinder than she lets on. She has heard every line in this building twice.",
  personality: ['sharp', 'dry', 'observant', 'warmer than she admits', 'allergic to performance'],
  likes: ['direct', 'banter', 'curiosity', 'music', 'food'],
  dislikes: ['flattery', 'bragging', 'negging', 'small_talk', 'pushy'],
  dealbreaker: {
    tag: 'rude_to_staff',
    line: 'You were short with the barback. She saw the whole thing, and that is the end of that.',
  },
  interests: ['cooking', 'guitar'],
  preferences: {
    joke: 1.15,
    tease: 1.2,
    question: 1.15,
    sincere: 1.1,
    story: 0.95,
    compliment: 0.6,
    bold: 1,
    exit: 1,
  },
  statWeights: { confidence: 1.3, humor: 1.25, charm: 1.05, culture: 0.9, style: 1, fitness: 0.8 },
  homeVenue: 'neon_last_call',
  baseInterest: 18,
  baseComfort: 55,
  patience: 9,
  facts: [
    { id: 'sable_bitters', text: 'The dare ingredient was a bitters she makes herself. She was pleased you asked.' , callback: 'I want the bitters recipe. I will trade you something for it.' },
    { id: 'sable_records', text: 'She controls the jukebox. There is a locked playlist and she is not sorry.', unlocks: ['music'] , callback: 'I have been thinking about your locked playlist with real envy.' },
    { id: 'sable_cooks', text: 'She cooks at 3am when she gets home. One pan, whatever is in the fridge.', unlocks: ['food'] , callback: 'What did the 3am pan produce last night?' },
    { id: 'sable_tattoo', text: "The line on her forearm is from a song. One guess per visit." , callback: 'I am saving my guess. Building to it. Do not rush me.' },
    { id: 'sable_law_school', text: 'She was two years into law school before the bar needed her.' , callback: 'Two years of law school and you still let people order a vodka soda.' },
    { id: 'sable_dad', text: 'Her dad got sick; that is why she stayed. She does not want the sympathetic face.' , callback: 'Been thinking about what you told me about your dad. No face, just — thinking about it.' },
    { id: 'sable_loves_bar', text: 'She loves this place, and she would deny it under oath.' , callback: 'You love that place and you would deny it under oath.' },
    { id: 'sable_reads_people', text: 'She reads people for a living and is very good at it. Assume she has clocked you.' , callback: 'Still annoyed that you read me in about four seconds.' },
  ],
  outfits: [
    {
      id: 'bar_shift',
      name: 'Bar shift',
      worn: ['neon_last_call'],
      palette: { primary: '#1b1a2e', secondary: '#3b1d2e', accent: '#ff5fa8' },
    },
    {
      id: 'off_shift',
      name: 'Off shift',
      worn: ['margin_notes', 'ironhaus'],
      unlockHint: 'Run into her somewhere that is not work.',
      palette: { primary: '#2a2338', secondary: '#4a3350', accent: '#4fd6ff' },
    },
    {
      id: 'date_green',
      name: 'The green dress',
      worn: [],
      unlockHint: 'Take her somewhere she has to leave the apron behind.',
      palette: { primary: '#123a32', secondary: '#1d5c4a', accent: '#ffce6b' },
    },
    {
      id: 'after_hours',
      name: 'After hours',
      worn: [],
      unlockHint: 'Still be talking when the lights come up.',
      palette: { primary: '#14121f', secondary: '#2c2440', accent: '#f5348c' },
    },
  ],
  palette: {
    hair: '#7d1f3d',
    hairShadow: '#4a1226',
    skin: '#e8be9d',
    eyes: '#e2a03f',
    accent: '#ff5fa8',
    background: '#221230',
  },
  knows: ['nadia'],
  texts: {
    replies: {
      playful: {
        good: [
          "That is the correct amount of stupid for a Tuesday. Go on then.",
          "You're funnier by text than in person, which is either good news or a warning.",
        ],
        bad: [
          "Ha.",
          "Mm. Busy night, can't do the bit right now.",
        ],
      },
      warm: {
        good: [
          "That's a nice thing to say and I'm choosing to believe you meant it.",
          "Yeah. It was a good night. Don't make it weird by saying so again.",
        ],
        bad: ["Thanks. Long shift, sorry — will be better company later in the week."],
      },
      direct: {
        good: [
          "Straight in. Good. Yes to the first thing, no to the second, ask me about the third in person.",
          "I like that you just said it. Most people workshop it for four days.",
        ],
        bad: ["That's a lot of direct for nine in the morning."],
      },
      callback: {
        good: [
          "You remembered. Right, that is genuinely annoying of you.",
          "Ten points. You were listening. Dangerous habit, keep it up.",
        ],
        bad: ["Close. Wrong bit of the story, but close."],
      },
    },
    opens: [
      "Someone just ordered a pint of the house red. I had nobody to tell. This is your job now.",
      "Gary has apologised to the wall. I'm shaking. Thought you'd want to know first.",
      "Slow night. Say something, I'm reorganising the bottles again and it's getting out of hand.",
    ],
    acceptsDate: [
      "Yes. But if you pick somewhere with a set menu I will walk into the sea.",
      "Go on then. I'm off at nine, don't be early, I hate being watched while I close up.",
    ],
    declinesDate: [
      "Not yet. Ask me again when you've been in on a night I'm not working.",
      "I'm going to say no, and I'm going to be nice about it, which is your one warning.",
    ],
    stoodUp: [
      "I stood outside that place for twenty minutes doing the thing where you check your phone like it's a hobby. Don't.",
    ],
  },
  dialogue,
  dateDialogue,
};
