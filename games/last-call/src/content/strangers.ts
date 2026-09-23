/**
 * The people who are not the story.
 *
 * Everyone on the block is someone, so everyone can be spoken to. These are
 * not romanceable characters and they keep no memory: they have a name, a job,
 * a mood and an opinion, and they will talk to you about whatever you bring up.
 * The point is that the street is populated rather than decorated, and that
 * every shop has someone behind the counter and someone browsing.
 *
 * `role` says where a person belongs. Street walkers pace the block; staff are
 * always at their post; visitors turn up in a place some of the time, so a
 * room is never the same crowd twice.
 */
export type StrangerRole = 'walker' | 'staff' | 'visitor';

export interface StrangerDef {
  id: string;
  name: string;
  role: StrangerRole;
  /** One line of who they are, handed to the model as their whole brief. */
  persona: string;
  /** Openers for when there is no model to ask. */
  opens: readonly string[];
  /** Generic replies for scripted mode, when the player says something. */
  replies: readonly string[];
  /** How they sign off. */
  exits: readonly string[];
  /** Sprite look, so the person you talk to is the person you saw. */
  look: {
    hairStyle: string;
    hair: string;
    skin: string;
    top: string;
    bottom: string;
    accent: string;
    build: 'lean' | 'athletic' | 'broad' | 'soft';
    gender: 'man' | 'woman';
  };
}

export const STRANGERS: readonly StrangerDef[] = [
  // --- Out on the street -------------------------------------------------
  {
    id: 'courier',
    name: 'Bike courier',
    role: 'walker',
    persona:
      'Priya, a bike courier in her thirties, four deliveries behind, permanently mid-sprint. Talks fast, swears at traffic, secretly loves this city. Will give directions nobody asked for.',
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
    look: { hairStyle: 'long_tie_up', hair: '#1a1424', skin: '#8d5a3c', top: '#ffce6b', bottom: '#1b1622', accent: '#111', build: 'lean', gender: 'woman' },
  },
  {
    id: 'busker',
    name: 'Busker',
    role: 'walker',
    persona:
      'Dev, a man in his late twenties with a battered guitar and a very specific set list. Cheerful, a bit of a philosopher, takes requests badly. Believes the acoustics on this corner are the best in the city.',
    opens: [
      'Acoustics on this corner are unreal. That is not an opinion, that is the wall behind me.',
      "You've got the face of someone about to request something I don't know.",
      'Two pounds is two pounds, but honestly, an opinion is worth more right now.',
    ],
    replies: ['See, that I can work with.', "I'm going to think about that during the slow one.", 'You are the third person to say that today and the first to mean it.'],
    exits: ['He nods, retunes something that did not need retuning, and starts playing again.'],
    look: { hairStyle: 'messy_waves', hair: '#2a1a12', skin: '#c99a78', top: '#2d3320', bottom: '#191c14', accent: '#e2a03f', build: 'lean', gender: 'man' },
  },
  {
    id: 'regular',
    name: 'The regular',
    role: 'walker',
    persona:
      'Maureen, a woman in her fifties who has lived on this street for thirty years and watched every business on it fail twice. Dry, unhurried, knows everyone. Treats gossip as a civic duty.',
    opens: [
      'That place was a florist. Then a phone shop. Then a florist again. Give it a year.',
      "You're new. I'd say I'm being friendly but mostly I'm being nosy.",
      'Whatever you are looking for, it closed in 2019.',
    ],
    replies: ['Hm. Well. You would think that, and you would be half right.', 'Now that is the first interesting thing anyone has said to me today.', "I'll allow it."],
    exits: ['She gives you a look that files you somewhere, and carries on.'],
    look: { hairStyle: 'buzz', hair: '#b9c2d6', skin: '#e8c4a8', top: '#3a2a3a', bottom: '#2a2030', accent: '#ffe0b5', build: 'soft', gender: 'woman' },
  },
  {
    id: 'night_shift',
    name: 'Night shift',
    role: 'walker',
    persona:
      'Tomasz, a man in his forties finishing a hospital shift, still in scrubs under a coat, running on the specific calm of someone who has been awake too long. Kind, blunt, unimpressed by small problems.',
    opens: [
      'Do not ask me how my night was. Ask me about literally anything else.',
      'I am eleven hours in and everything is funny now, so this should go well.',
      'You look like a man with a normal problem. Please, tell me a normal problem.',
    ],
    replies: ['That is genuinely the most reasonable thing I have heard since Tuesday.', 'Right. Yeah. I do not have the energy to disagree, so you win.', "Hold that thought — actually no, don't, I won't remember it."],
    exits: ['He raises a hand, already walking, already half asleep.'],
    look: { hairStyle: 'slicked_back', hair: '#3b2a1c', skin: '#e8c4a8', top: '#1e3a4a', bottom: '#14323a', accent: '#8fa3bd', build: 'broad', gender: 'man' },
  },
  {
    id: 'student',
    name: 'Film student',
    role: 'walker',
    persona:
      'Ines, a film student in her early twenties with a camera she is not currently using. Talks in references, opinions eighty per cent formed, genuinely delightful. Thinks this street is very cinematic at this hour.',
    opens: [
      'The light on this street right now is doing something I cannot afford to recreate.',
      'Do not move, actually — no, sorry, that was weird. Hi.',
      'I am supposed to be shooting a two-minute short and I have four seconds.',
    ],
    replies: ['Okay but that is basically the whole third act of a film I love.', 'I am stealing that. I am telling you I am stealing it, so it is fine.', 'See, this is why I do not shoot on a schedule.'],
    exits: ['She lifts the camera, decides against it, and wanders off composing the shot anyway.'],
    look: { hairStyle: 'curtains', hair: '#5a3a24', skin: '#efd2bb', top: '#2b2440', bottom: '#15122a', accent: '#e4d9ff', build: 'lean', gender: 'woman' },
  },
  {
    id: 'dog_walker',
    name: 'Dog walker',
    role: 'walker',
    persona:
      'Kwame, a retired teacher in his sixties walking a greyhound called Biscuit who is smarter than most people. Gentle, curious, asks better questions than he answers. Has read everything.',
    opens: [
      'Biscuit has decided you are fine. She is rarely wrong about people, and never about sausages.',
      'I taught chemistry for thirty years. Now I walk a dog and I have never known so much.',
      'Beautiful evening. I say that every evening; one of these days it will not be, and then I will stop.',
    ],
    replies: ['Now that is a proper answer. Most people give me the weather.', 'Biscuit agrees, and she is a harsh critic.', 'I shall be thinking about that on the way home.'],
    exits: ['Biscuit decides the conversation is over, and Kwame agrees with her.'],
    look: { hairStyle: 'buzz', hair: '#b9c2d6', skin: '#6a3f28', top: '#3a3040', bottom: '#2a2030', accent: '#ffce6b', build: 'soft', gender: 'man' },
  },
  {
    id: 'runner',
    name: 'Runner',
    role: 'walker',
    persona:
      'Yara, a woman in her late twenties mid-run, jogging on the spot while she talks. Competitive, sunny, slightly terrifying. Training for something she will not name.',
    opens: [
      'Talk fast, my heart rate is dropping and I take that personally.',
      'You look like you could run. Do you run? Everyone could run. Nobody does.',
      'Six kilometres in and I have opinions about all of them.',
    ],
    replies: ['Good. Good answer. Keep up.', 'That is what my coach says, except she says it louder.', 'Right, I like you, but I have a split to hit.'],
    exits: ['She is already forty metres away before you have finished nodding.'],
    look: { hairStyle: 'long_tie_up', hair: '#141326', skin: '#c99a78', top: '#96e07a', bottom: '#101c22', accent: '#111', build: 'athletic', gender: 'woman' },
  },

  // --- Behind the counter -----------------------------------------------
  {
    id: 'barback',
    name: 'Jonah',
    role: 'staff',
    persona:
      "Jonah, the barback at Last Call, twenty-three, collecting glasses and eavesdropping professionally. Sable's protégé; he knows everything that happens in this bar and pretends he does not. Friendly, a little starstruck by the regulars, terrible at poker face.",
    opens: [
      "I'm not the bartender. I'm the one who knows where the bartender hides the good tonic.",
      'If you are here for Sable, she is behind the bar and she has seen you already.',
      'Glass? No — I am collecting them, not giving them out. Different job. Same pay.',
    ],
    replies: ['Ha. Do not tell her I said that.', 'Yeah, that happens about twice a night in here.', "I would agree but I'm technically working."],
    exits: ['He scoops three glasses in one hand and disappears into the kitchen.'],
    look: { hairStyle: 'messy_waves', hair: '#2a1a12', skin: '#e8c4a8', top: '#1b1a2e', bottom: '#14121f', accent: '#ff5fa8', build: 'lean', gender: 'man' },
  },
  {
    id: 'owner_books',
    name: 'Mr Adeyemi',
    role: 'staff',
    persona:
      'Mr Adeyemi, who owns Margin Notes, sixty-eight, has read every book in the shop and disagrees with most of them. Courtly, sharp, delighted by anyone who asks for a recommendation and merciless with anyone who does not take it.',
    opens: [
      'Browse. Please. But if you ask me what is good, I will tell you, and it will not be what you expected.',
      'Someone has shelved the poetry under travel again. I suspect it was me.',
      'The armchair is for reading. Sitting in it without a book is a kind of theft.',
    ],
    replies: ['Yes. And there is a book about exactly that, which nobody buys.', 'A reasonable view. I held it myself, for a week, in 1987.', 'Hm. Second shelf, left of the ladder.'],
    exits: ['He returns to a book he was clearly only pretending to have finished.'],
    look: { hairStyle: 'buzz', hair: '#b9c2d6', skin: '#6a3f28', top: '#3a2a3a', bottom: '#1d2233', accent: '#ffce6b', build: 'lean', gender: 'man' },
  },
  {
    id: 'gym_desk',
    name: 'Rae',
    role: 'staff',
    persona:
      'Rae, on the front desk at Ironhaus, thirty, ex-competitive swimmer, deadpan and enormously kind. Signs people in, spots people who ask, and has a towel for every crisis.',
    opens: [
      'Sign in, grab a towel, and do not use the rowing machine as a coat rack. It is a machine.',
      'First time? Everyone in here was a first time once. Some of them last week.',
      'If Nadia offers to spot you, say yes. If she offers to correct your form, also say yes, faster.',
    ],
    replies: ['Yep. That is exactly what everyone says right before they hurt their back.', 'Good. Hydrate. I say that to everyone; it is the whole job.', 'Okay. I respect that. Towel?'],
    exits: ['She slides a towel across the desk without looking up from the sign-in sheet.'],
    look: { hairStyle: 'undercut', hair: '#243a8f', skin: '#efd2bb', top: '#14323a', bottom: '#101c22', accent: '#4fd6ff', build: 'athletic', gender: 'woman' },
  },
  {
    id: 'barista',
    name: 'Milo',
    role: 'staff',
    persona:
      'Milo, the barista at Copper Kettle, twenty-six, talks to the espresso machine like a difficult horse. Warm, nerdy about coffee, refuses to judge your order out loud. Judges it a little.',
    opens: [
      'Give me one second, she is being temperamental. The machine. Not a person. Well.',
      'What can I get you? And before you say oat, we have oat. We have everything except peace.',
      'The window seat just came free. That is not nothing, in here.',
    ],
    replies: ['See, I love that. Most people just want it hot.', 'That is a bold take for a Tuesday, and I am here for it.', "Right — I've got a queue, but hold that thought."],
    exits: ['The machine hisses and he turns back to it with the face of a man returning to a negotiation.'],
    look: { hairStyle: 'curtains', hair: '#5a3a24', skin: '#e8c4a8', top: '#c96a3f', bottom: '#191c14', accent: '#ffe0b5', build: 'lean', gender: 'man' },
  },
  {
    id: 'record_clerk',
    name: 'Bea',
    role: 'staff',
    persona:
      'Bea, behind the counter at Static, thirty-four, encyclopaedic and allergic to enthusiasm she has not verified. Wears the same band shirt in four colours. Will fight you about a B-side, warmly.',
    opens: [
      'The staff pick is up there. You will not agree with it. That is the point of a staff pick.',
      'The listening post works if you do not touch the arm. Everyone touches the arm.',
      'Looking for something, or looking for the thing you did not know you were looking for?',
    ],
    replies: ['Hm. Defensible. Wrong, but defensible.', 'Okay, now we are talking. Third crate, the one that says LOCAL.', 'I am not going to admit that out loud, but yes.'],
    exits: ['She drops the needle on something you have never heard and pretends you are not there.'],
    look: { hairStyle: 'curls', hair: '#2a2338', skin: '#8d5a3c', top: '#1f1f2e', bottom: '#15122a', accent: '#9a6bff', build: 'soft', gender: 'woman' },
  },
  {
    id: 'arcade_attendant',
    name: 'Zed',
    role: 'staff',
    persona:
      'Zed, who runs the floor at Pixel Palace, nineteen, holds three high scores under three different names. Hyper, generous with tokens, refuses to believe anyone is bad at games — only under-practised.',
    opens: [
      'Two tokens a pound, high scores on the wall, and yes, ZED, ZZZ and DEZ are all me.',
      'The claw machine is rigged. Everyone knows. People still play. That is the human condition.',
      'You want the dance game or the fighting game? Your shoes say dance game.',
    ],
    replies: ['No way. Okay, you have to prove that on the cabinet.', 'Respect. Nobody says that. Everyone thinks it.', 'Tokens are on me for that one. Do not tell my manager, who is also me.'],
    exits: ['A machine starts screaming for attention and he vaults the counter to deal with it.'],
    look: { hairStyle: 'messy_waves', hair: '#b5273f', skin: '#c99a78', top: '#1a1d22', bottom: '#243038', accent: '#7fe0ff', build: 'lean', gender: 'man' },
  },
  {
    id: 'comics_clerk',
    name: 'Halle',
    role: 'staff',
    persona:
      "Halle, behind the counter at Panels, twenty-eight, draws her own comic on the till roll between customers. Sardonic, precise, secretly thrilled when someone asks about anything that is not the big two. Will not spoil an ending, will absolutely spoil a twist she thinks is bad.",
    opens: [
      'New issues Wednesday, back issues in the long boxes, and my opinions are free but not cheap.',
      'If you are here for a film tie-in I will help you, but I want you to know I have feelings about it.',
      'The reading nook is for reading. It is also, apparently, for one man to nap in. Not you. Yet.',
    ],
    replies: ['Oh, okay, you actually read. Different conversation, then.', 'That run is underrated and I will die on that beanbag.', 'Hm. I would have gone a different way, but I respect the commitment.'],
    exits: ['She goes back to the till roll and draws something that is probably you.'],
    look: { hairStyle: 'half_up', hair: '#7a1f3a', skin: '#efd2bb', top: '#2b2a44', bottom: '#15122a', accent: '#ffce6b', build: 'lean', gender: 'woman' },
  },
  {
    id: 'mixologist',
    name: 'Lucian',
    role: 'staff',
    persona:
      'Lucian, head bartender at Nightjar, thirty-nine, precise, unhurried, speaks in complete sentences. Treats a cocktail as a conversation with the customer. Has seen every kind of date go every kind of way and keeps a poker face about all of them.',
    opens: [
      'Good evening. Sit anywhere except the end seat; the end seat is spoken for, by tradition.',
      'Tell me what you like and I will make you something you did not know you liked more.',
      'No menu tonight. Trust me, or order a gin and tonic, and I will respect both choices.',
    ],
    replies: ['A considered answer. Rarer than you would think in a bar.', 'I have heard that argument before, from a man who was, in the end, correct.', 'Then allow me to suggest something.'],
    exits: ['He polishes a glass that was already clean and turns to the next customer.'],
    look: { hairStyle: 'slicked_back', hair: '#141326', skin: '#c99a78', top: '#123a32', bottom: '#0f1d1a', accent: '#ffce6b', build: 'athletic', gender: 'man' },
  },
  {
    id: 'waiter',
    name: 'Sora',
    role: 'staff',
    persona:
      "Sora, who runs the floor at Akai, thirty-one, the owner's daughter, moves between the red velvet chairs under the blossom ceiling like she is dancing and never once looks hurried. Warm, exact, and quietly running your whole evening for you. Will not let you order badly.",
    opens: ['Table for one, or are we waiting for someone? Either answer is fine, but one of them gets the better table.', 'You are looking at the menu like it is a test. Put it down. Tell me what you feel like and I will do the rest.'],
    replies: ['Good. That is the right answer, and I would have told you if it was not.', 'Ha. My father says the same thing and he is wrong about it too.', 'Then you will love the second course. Do not ask me what it is.'],
    exits: ['She catches a look from the kitchen, touches your shoulder once, and is gone across the room.'],
    look: { hairStyle: 'long_tie_up', hair: '#141326', skin: '#e8c4a8', top: '#2a0d10', bottom: '#14121f', accent: '#ff3b4a', build: 'lean', gender: 'woman' },
  },
  {
    id: 'cook',
    name: 'Tam',
    role: 'staff',
    persona:
      'Tam, behind the counter at Slurp, fifty-two, has run the noodle counter since before the neon went up outside. Ladles with one hand, argues with the radio with the other, remembers what everyone had last time. Gruff, generous, a bowl is his whole philosophy.',
    opens: ['Sit. The broth is at the good stage. Ten more minutes and it will be even better and you will have missed it.', 'You look like the spicy one. Do not argue with me, I am never wrong about this.'],
    replies: ['Mm. Eat, then talk. In that order.', 'Ha! You sound like my daughter. She is also wrong.', 'Fine. Fine. But you are having the egg.'],
    exits: ['A bell rings from the back and he is gone, shouting at a pot.'],
    look: { hairStyle: 'buzz', hair: '#b9c2d6', skin: '#c99a78', top: '#f0e6d8', bottom: '#1c2a24', accent: '#e0362e', build: 'broad', gender: 'man' },
  },
  {
    id: 'gallery_guide',
    name: 'Anselm',
    role: 'staff',
    persona:
      'Anselm, the invigilator at the Meridian Gallery, forty-four, a painter who does not talk about his own painting. Quiet, dry, sees straight through anyone pretending to understand a piece, and warmly helps anyone honest enough to say they do not.',
    opens: [
      'Take your time. The big one on the left rewards it; the one by the door does not, between us.',
      'You can say you do not get it. Most people do not. The ones who say so are the ones who eventually will.',
      'The bench is the best seat in the building. Artists hate that. I love that.',
    ],
    replies: ['That is a more honest response than the catalogue essay.', 'Interesting. I had not seen it that way, and now I cannot unsee it.', 'Yes. Exactly that. Do not tell the curator.'],
    exits: ['He drifts back to the doorway, hands behind his back, looking at nothing in particular.'],
    look: { hairStyle: 'buzz', hair: '#3b2a1c', skin: '#e8c4a8', top: '#1b1a2e', bottom: '#14121f', accent: '#e4d9ff', build: 'lean', gender: 'man' },
  },
  {
    id: 'checkout',
    name: 'Dee',
    role: 'staff',
    persona:
      'Dee, on the late till at Fresh Market, twenty-two, studying nursing by day, watching the whole street come through her lane by night. Bright, blunt, funny, has seen what everyone buys at 2 a.m. and has opinions about it.',
    opens: [
      'Basket or bag? And I am not judging what is in it. I am absolutely judging what is in it.',
      'The self-checkout is broken. It has been broken since it was installed. That is me. I am the self-checkout.',
      "You've got the look of someone buying ingredients for a plan. Good luck with the plan.",
    ],
    replies: ['Okay, that is the most normal thing anyone has said in this lane all night.', 'Ha! I am telling my flatmate that one.', 'Right, well, that is 4.20, and a piece of advice for free.'],
    exits: ['The next customer plonks down a single lemon and she raises an eyebrow at you as if to say: see?'],
    look: { hairStyle: 'curtains', hair: '#ff7a59', skin: '#f0cdae', top: '#1b1a2e', bottom: '#2a2838', accent: '#c9cede', build: 'lean', gender: 'woman' },
  },

  // --- People who turn up ---------------------------------------------------
  {
    id: 'reader',
    name: 'Reader',
    role: 'visitor',
    persona:
      'Owen, a man in his thirties who reads standing up in shops and never buys anything, which he feels bad about. Gentle, apologetic, surprisingly funny once he stops apologising.',
    opens: ["Sorry, am I in your way? I'm always in the way. I'll — sorry.", 'I have read forty pages of this and I am going to put it back. Do not tell him.'],
    replies: ['Oh. That is kind. Nobody says that.', 'Ha — yes, that is exactly it, actually.'],
    exits: ['He puts the book back, exactly where it was, and picks up another one.'],
    look: { hairStyle: 'curtains', hair: '#3b2a1c', skin: '#e8c4a8', top: '#2f3a52', bottom: '#1d2233', accent: '#8fa3bd', build: 'lean', gender: 'man' },
  },
  {
    id: 'lifter',
    name: 'Big Sam',
    role: 'visitor',
    persona:
      'Sam, a woman in her forties who deadlifts twice her bodyweight and talks about her allotment between sets. Enormous, gentle, thinks everyone should lift and grow tomatoes, in that order.',
    opens: ['You can work in. I have got two sets left and a lot to say about compost.', 'Do not apologise for the bar. Chalk it, lift it, thank it.'],
    replies: ['Now you are getting it.', 'My tomatoes would disagree, but they are tomatoes.'],
    exits: ['She chalks up, pulls, and the whole rack seems to nod.'],
    look: { hairStyle: 'buzz', hair: '#b5273f', skin: '#efd2bb', top: '#1a1d22', bottom: '#243038', accent: '#a8e05a', build: 'broad', gender: 'woman' },
  },
  {
    id: 'laptop',
    name: 'Laptop guy',
    role: 'visitor',
    persona:
      'Felix, a freelance something in his late twenties who has occupied the same café table since nine a.m. on one flat white. Anxious, articulate, absolutely will tell you about his startup if you let him. Do not let him.',
    opens: ['Is this seat — no, it is fine, I have got cables everywhere, sorry.', 'I have been here four hours. I know. They know. We do not discuss it.'],
    replies: ['Yes! Exactly. That is basically the pitch.', 'Hm. Okay. That is fair, actually. Ouch, but fair.'],
    exits: ['His laptop chimes and he vanishes back into it.'],
    look: { hairStyle: 'messy_waves', hair: '#5a3a24', skin: '#e8c4a8', top: '#2b2440', bottom: '#15122a', accent: '#4fd6ff', build: 'lean', gender: 'man' },
  },
  {
    id: 'digger',
    name: 'Crate digger',
    role: 'visitor',
    persona:
      'Marguerite, a woman in her fifties in a leather jacket, flipping through crates with the speed of forty years of practice. Curt, funny, encyclopaedic, only impressed by things that are actually good.',
    opens: ['You are flicking too fast. You will miss it. Everyone misses it.', 'Do not buy that. I am serious. I have it, and it is a lie.'],
    replies: ['Hm. Fine. That one, you can have.', 'Now that is a real answer. Rare, in here.'],
    exits: ['She pulls a sleeve out of the crate like a card trick and heads for the counter.'],
    look: { hairStyle: 'slicked_back', hair: '#b9c2d6', skin: '#e8bd9a', top: '#14121f', bottom: '#1b1622', accent: '#9a6bff', build: 'lean', gender: 'woman' },
  },
  {
    id: 'gamer',
    name: 'Kid at the cabinet',
    role: 'visitor',
    persona:
      'Ash, twenty-one, has been on the same fighting game cabinet for two hours and would like a challenger. Cocky, quick, secretly sweet, will teach you the combo if you lose gracefully.',
    opens: ['You play? No pressure. Some pressure. Winner stays on.', 'Do not pick the big guy. Everyone picks the big guy. He is slow and so is everyone.'],
    replies: ['Okay, okay. Talk is cheap. Insert coin.', 'Ha! Fine. You get one lesson, and it is free.'],
    exits: ['The round starts and the rest of the world stops existing for them.'],
    look: { hairStyle: 'undercut', hair: '#243a8f', skin: '#c99a78', top: '#1a1d22', bottom: '#101c22', accent: '#ff5fa8', build: 'lean', gender: 'man' },
  },
  {
    id: 'date_night',
    name: 'Woman waiting',
    role: 'visitor',
    persona:
      'Camille, thirty-five, sitting alone at a table set for two, forty minutes past when he said. Composed, wry, not remotely fooled, and starting to enjoy the wine on her own. Talks to strangers because it beats looking at the door.',
    opens: ['He is not coming. I knew at twenty past. The wine is good, though, so I am winning.', 'If you are about to ask whether this seat is taken, it is, in theory.'],
    replies: ['Oh, that is a much better answer than the one I was expecting.', 'Ha. You might be right. Do not be right, though; I am busy being wronged.'],
    exits: ['She raises her glass a quarter-inch to you and goes back to not looking at the door.'],
    look: { hairStyle: 'half_up', hair: '#2a1a12', skin: '#8d5a3c', top: '#3a1f3a', bottom: '#14121f', accent: '#ffce6b', build: 'lean', gender: 'woman' },
  },
  {
    id: 'critic',
    name: 'Man with the catalogue',
    role: 'visitor',
    persona:
      'Rupert, sixty, reads the wall text out loud to nobody and has a theory about every piece. Pompous on the surface, genuinely moved underneath, and grateful, secretly, for anyone who argues.',
    opens: ['Ah — you are looking at it wrong. From here. No — here. Yes. There.', 'The catalogue says "interrogates space". Everything interrogates space. I interrogate space.'],
    replies: ['Well! That is — hm. That is not nothing.', 'Do go on. I so rarely get to be disagreed with.'],
    exits: ['He moves to the next painting and begins explaining it to the wall.'],
    look: { hairStyle: 'buzz', hair: '#b9c2d6', skin: '#e8c4a8', top: '#33243a', bottom: '#1d2233', accent: '#e4d9ff', build: 'soft', gender: 'man' },
  },
  {
    id: 'darts_regular',
    name: 'Man at the dartboard',
    role: 'visitor',
    persona:
      'Piotr, forty-four, plays darts alone with unsettling accuracy and a pint that never seems to go down. Dry, kind underneath, has been coming here since before the neon. Will let you win exactly once.',
    opens: ['Board is free if you want it. I should warn you I have nothing else going on tonight.', 'Treble twenty. Nobody saw it, so it did not happen. You saw it. Good.'],
    replies: ['Ha. Sable said something like that once and I have not recovered.', 'Fair. Throw one. No, properly, from the line.'],
    exits: ['He hits a double without looking, collects his darts, and buys the next round for nobody in particular.'],
    look: { hairStyle: 'buzz', hair: '#3b2a1c', skin: '#e8c4a8', top: '#2c3440', bottom: '#191c24', accent: '#ff5fa8', build: 'broad', gender: 'man' },
  },
  {
    id: 'birthday',
    name: 'Woman in the sash',
    role: 'visitor',
    persona:
      "Jess, twenty-six, out for her birthday, three cocktails in, wearing a sash that says BIRTHDAY QUEEN. Loud, generous, funny, adopts strangers into her night and means it. Her friends are at the bar arguing with Lucian.",
    opens: ["It's my BIRTHDAY. You have to be nice to me, it is the law. Sit. No — sit.", 'Do you know what is in this? Neither do I. It is blue and I love it.'],
    replies: ['Oh my god. Girls. GIRLS. Come and hear what he just said.', 'That is the nicest thing anyone has said to me since about nine o\u2019clock.'],
    exits: ['Her friends arrive with a sparkler in a drink and she is carried off, waving at you over her shoulder.'],
    look: { hairStyle: 'half_up', hair: '#b5273f', skin: '#c99a78', top: '#4fd6ff', bottom: '#1a1c33', accent: '#ffce6b', build: 'soft', gender: 'woman' },
  },
  {
    id: 'collector',
    name: 'Man in the back issues',
    role: 'visitor',
    persona:
      'Marcus, thirty-eight, in the longboxes with actual white gloves on, hunting one issue he has been hunting for a decade. Intense, encyclopaedic, weirdly charming once he gets going, and very aware of how this looks.',
    opens: ['Before you say anything about the gloves: 1987, first printing, the paper is like tissue. The gloves are correct.', 'Volume nineteen. If you find volume nineteen anywhere in this city I will buy you dinner. I am not joking.'],
    replies: ['Okay, that is actually a good point and I hate that it came from someone without gloves on.', 'Right? RIGHT. Nobody gets that.'],
    exits: ['He goes very still, holds a bagged issue up to the light, and forgets you exist entirely.'],
    look: { hairStyle: 'undercut', hair: '#141326', skin: '#8d5a3c', top: '#1e2a3a', bottom: '#12161f', accent: '#e2a03f', build: 'lean', gender: 'man' },
  },
  {
    id: 'night_owl',
    name: 'Woman on the end stool',
    role: 'visitor',
    persona:
      'Rin, twenty-nine, on the last stool at Slurp at whatever hour it is, laptop open, headphones round her neck, eating with one hand and shipping code with the other. Dry, quick, allergic to small talk until it turns out to be interesting.',
    opens: ['If you are about to ask what I am working on, the answer is "a bug", and it has been the answer since Tuesday.', 'The egg. Get the egg. I am not going to say it twice.'],
    replies: ['Huh. Okay. That is a more interesting answer than I was braced for.', 'Ha. No. But keep going, I want to see where this ends up.'],
    exits: ['Her laptop pings, she says "finally" to nobody, and the headphones go back on.'],
    look: { hairStyle: 'undercut', hair: '#243a8f', skin: '#e8c4a8', top: '#1b1622', bottom: '#12161f', accent: '#ffd36b', build: 'lean', gender: 'woman' },
  },
  {
    id: 'shopper',
    name: 'Late shopper',
    role: 'visitor',
    persona:
      'Nour, thirty, in the supermarket at the wrong hour holding a basket with one avocado and a bottle of wine. Tired, funny, entirely aware of what the basket says about her evening.',
    opens: ['Do not look at my basket. I know. It is a whole story and none of it is good.', 'Is there a queue or is this just where people stand and think about their lives?'],
    replies: ['See, that is a healthier attitude than mine, and I resent it.', 'Okay, that made me laugh, which was not on the schedule.'],
    exits: ['She adds a second avocado, decisively, as if it settles something.'],
    look: { hairStyle: 'curls', hair: '#141326', skin: '#c99a78', top: '#1e2a3a', bottom: '#12161f', accent: '#3fbf85', build: 'soft', gender: 'woman' },
  },
];

const BY_ID: ReadonlyMap<string, StrangerDef> = new Map(STRANGERS.map((s) => [s.id, s]));

export function getStranger(id: string): StrangerDef | undefined {
  return BY_ID.get(id);
}

const WALKERS: readonly StrangerDef[] = STRANGERS.filter((s) => s.role === 'walker');

/** The passer-by bound to a walker route, by index. */
export function strangerFor(index: number): StrangerDef {
  return WALKERS[index % WALKERS.length]!;
}
