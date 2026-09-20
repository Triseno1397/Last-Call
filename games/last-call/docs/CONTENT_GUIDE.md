# Content Guide

Everything in Last Call that a player can see, read, do, or flirt with is data.
The engine reads content; it never contains it. If you are adding a character, a
venue, an activity or a line of dialogue, you should not need to touch anything
under `src/engine` or `src/ui`.

```
src/content/    the game's content (this is where you work)
src/types/      the shapes content must satisfy
src/engine/     pure rules: progression, calendar, activity resolution, saves
src/state/      the Zustand store and UI selectors
src/ui/         screens and components
src/config/     CONTENT_RATING and the balance numbers
```

## The golden rules

1. **Ids live in `src/content/ids.ts`.** Every cross-referenceable thing (stat,
   hobby, perk, flaw, venue, job, apartment, wardrobe item, character) declares
   its id there. That is what makes a typo in a venue id a compile error rather
   than a bug report.
2. **Content is typed.** If the compiler is unhappy, the data is wrong. Run
   `npm run typecheck`.
3. **Content is tested.** `src/test/content.test.ts` checks integrity: real ids,
   costs that make sense, regulars scheduled only when their venue is open, every
   character findable somewhere. Add to it when you add a kind of content.
4. **Write the funny line.** Blurbs and flavour text are the product. A stat is
   just a number until something says "you played a divorced lighthouse".

---

## Adding an activity

Activities live in `src/content/activities.ts`.

```ts
pottery_class: {
  id: 'pottery_class',
  name: 'Pottery class',
  blurb: 'Six adults, one wheel, and a tutor who says "let the clay decide".',
  category: 'self',                       // career | self | social | lifestyle | rest
  tags: ['creative', 'social'],           // traits hook off tags (see below)
  cost: { slots: 1, energy: 18, money: 30 },
  requirements: [{ kind: 'slot', slots: ['evening'] }],
  effects: [
    { kind: 'statXp', stat: 'style', amount: 30 },
    { kind: 'awarenessXp', amount: 10 },
  ],
  flavour: ['You made a bowl. It is a bowl in the way a rumour is a fact.'],
},
```

Then add `'pottery_class'` to `BASE_ACTIVITY_IDS`. That is the whole job: the
city screen, the cost preview, the lock reasons and the week summary all pick it
up automatically.

**Requirement kinds** (`src/types/activities.ts`): `stat`, `money`, `energy`,
`hobby`, `jobTier`, `apartment`, `day`, `slot`, `flag`. Money, energy and "do you
have enough slots left today" are checked automatically from `cost`, so you do
not need to repeat them as requirements. Locked activities stay visible with
their reason — that is the point, it tells the player what to work towards.

**Effect kinds**: `statXp`, `hobbyXp`, `awarenessXp`, `money`, `energy`,
`careerXp`, `temporaryStatBonus`, `unlockWardrobe`, `setFlag`, `visitVenue`.

**Generated activities.** Practice, shopping and night-out activities are built
from other content, so:

- adding a **hobby** creates `practice_<hobby>`,
- adding a **wardrobe item** with a price creates `shop_<item>`,
- adding a **venue** creates `go_out_<venue>`.

Do not write those by hand.

## Adding a hobby

`src/content/hobbies.ts`, plus its id in `HOBBY_IDS`.

```ts
pottery: {
  id: 'pottery',
  name: 'Pottery',
  blurb: 'Wet clay, a wheel, and forty minutes where your phone does not exist.',
  affinity: 'style',                  // the stat that improves alongside it
  sharedInterestLine: 'throws pots badly and proudly',
},
```

`sharedInterestLine` is what the phone and dialogue systems use once a character
discovers you two share the interest.

## Adding a perk or flaw

`src/content/traits.ts`, plus the id in `PERK_IDS` / `FLAW_IDS`. A trait is a
name, a joke, an honest description of what it does, and a list of effects.

```ts
sleeps_anywhere: {
  id: 'sleeps_anywhere',
  name: 'Sleeps Anywhere',
  blurb: 'Buses, floors, one memorable bathtub. You wake up fine.',
  mechanics: 'Overnight recovery is 20% better.',
  effects: [{ kind: 'restRecoveryMultiplier', multiplier: 1.2 }],
},
```

Keep `mechanics` honest — it is the contract with the player, and the only thing
stopping perks from becoming vibes.

**Effect kinds the life loop reads today:** `statStart`, `statGainMultiplier`,
`activityEnergyDelta` (matched by activity tag), `moneyMultiplier`,
`hobbyXpMultiplier`, `awarenessXpMultiplier`, `maxEnergyDelta`, `startingMoney`,
`restRecoveryMultiplier`, `confidenceLossMultiplier`, `confidenceOnRejection`.

**Effect kinds reserved for Phase 2+:** `dialogueTag`, `openerInterest`,
`comfortDecayMultiplier`, `readCueClarity`, `textingToneDelta`. They are typed
and safe to author against now; the conversation engine will consume them.

## Adding a venue

`src/content/venues.ts`, plus the id in `VENUE_IDS`.

```ts
the_rooftop: {
  id: 'the_rooftop',
  name: 'The Rooftop',
  tagline: 'eight floors up, cash only, worth it',
  blurb: 'String lights, a queue, and a view that does half your work for you.',
  pace: 'medium',                                   // fast | medium | slow
  statWeights: { charm: 1.3, style: 1.25, culture: 1 },
  entryCost: 20,
  energyCost: 18,
  openDays: ['thu', 'fri', 'sat'],
  openSlots: ['evening'],
  regulars: [{ character: 'wren', days: ['fri'], slots: ['evening'] }],
  atmosphere: ['Someone is proposing two tables over. Badly.'],
},
```

`statWeights` decides which stats count for more in conversations there.
`regulars` is the crowd schedule — the content test enforces that a regular is
only scheduled when the venue is actually open.

## Adding a character

Two steps: add the id to `CHARACTER_IDS`, and write
`src/content/characters/<id>.ts` exporting a `CharacterDef`. Register it in
`src/content/characters/index.ts`. That is the whole job — no engine change.

```ts
export const WREN: CharacterDef = {
  id: 'wren',
  name: 'Wren',
  age: 26,                              // 21+, enforced by a test
  gender: 'woman',
  archetype: 'The grad student with opinions',
  tagline: 'annotates library books in pencil like a criminal',
  bio: '...',
  personality: ['curious', 'dry', 'impatient with bluffing'],
  likes: ['curiosity', 'books', 'banter'],
  dislikes: ['bragging', 'small_talk'],
  dealbreaker: { tag: 'lying', line: 'You made something up and she caught it.' },
  interests: ['photography'],
  preferences: { question: 1.25, joke: 1.1, compliment: 0.7 },  // per reply type
  statWeights: { culture: 1.3, humor: 1.1 },                    // stats she notices
  homeVenue: 'margin_notes',
  baseInterest: 15,
  baseComfort: 60,
  patience: 8,                          // turns before the conversation runs out
  facts: [{ id: 'wren_thesis', text: 'Her thesis is two years late and she is fine.' }],
  outfits: [...],                       // 3-4; see docs/ART_GUIDE.md
  palette: {...},                       // placeholder portrait colours
  knows: ['sable'],
  dialogue,                             // the tree, below
};
```

Then put her on a venue's `regulars` schedule so there is somewhere to find her.
The content test enforces that a character is findable and that she is only
scheduled when her venue is open.

### Dialogue trees

A tree is `openings` (which node to start on, by relationship stage) plus
`nodes`. A node is her line — or several variants — and the replies.

```ts
const dialogue: DialogueTree = {
  openings: { stranger: 'open_stranger', acquaintance: 'open_again' },
  nodes: {
    open_stranger: {
      id: 'open_stranger',
      lines: [
        { mood: 'bad', text: '...', expression: 'bored', cue: 'She does not look up.' },
        { text: '...', expression: 'neutral', cue: 'She marks her page with a receipt.' },
      ],
      options: [
        {
          id: 'ask_book',
          type: 'question',                  // joke|compliment|question|story|
          text: 'What is it?',               // tease|sincere|bold|exit
          tags: ['curiosity', 'books'],      // scored against likes/dislikes
          requires: [{ kind: 'stat', stat: 'culture', min: 40 }],
          interest: 4,                       // authored baseline
          comfort: 2,
          learn: ['wren_thesis'],            // facts the player uncovers
          tell: ['player_reads'],            // what she learns about him
          next: 'hub',
        },
      ],
    },
    got_number: { id: 'got_number', lines: [...], outcome: 'number' },
  },
};
```

Rules the tests enforce:

- every `next` points at a node that exists, and every node is reachable from an
  opening — no orphans, no dead ends,
- a node either has replies or an `outcome`, never both,
- `learn` only names facts the character actually has,
- line variants are filtered by `mood`, `minInterest`, `maxInterest` and
  `minEncounters`; the **last** line in the list is the fallback, so always end
  with an unconditional one.

### How a reply is scored

`engine/dialogue/scoring.ts`, and it is worth knowing when writing:

```
delta = authored baseline
      x her preference for that reply type
      + her likes/dislikes for the tags
      + the stats she cares about, weighted by the venue
      - a penalty if you have covered this topic with her before
      x her mood that day
```

Comfort is separate and less forgiving: pushing while she is uncomfortable costs
extra, and while comfort is under 30 any interest gained is halved. Comfort on
the floor ends the conversation whatever the interest was. Her `dealbreaker` tag
ends it permanently.

### Texting

Every character needs a `texts` block: replies for each of the four tones
(`playful`, `warm`, `direct`, `callback`), split into `good` and `bad`, plus
`opens` (what she sends unprompted when she is interested and you have gone
quiet), `acceptsDate`, `declinesDate` and `stoodUp`.

A text is scored like a reply — tone maps to a response type and runs through
her preferences — plus **cadence**: double-texting costs, a day or three is the
sweet spot, and a week of silence is a cold open. The `callback` tone is locked
until the player has learned something about her, and it uses the fact's
`callback` line, which should be written the way a person actually texts
("How is urban loneliness coming along? The thesis, not the condition."), not
the notebook line the contacts screen shows.

### Date ideas and date trees

Ideas live in `src/content/dateIdeas.ts`. An idea is offered when the player can
pull it off (`requiresHobby` / `requiresStat` / money) and earns a bonus when its
`appealsTo` overlaps her `interests` — that bonus is the reward for having paid
attention in conversation.

A date is the same engine with a longer leash: give the character a
`dateDialogue` tree. Convention for its nodes: `arrive` (and `arrive_again` for
someone you are already dating), one or two scenes, a moment where she says the
real thing, then `walk_home` with three endings — a great one
(`outcome: 'date_planned'`), a decent one, and a cold one (`outcome: 'rejected'`).
Romance fades to black at the door: write the cue line, not the scene.

The wingman lives in `src/content/wingman.ts`. His tips are data; one a day, never
repeated, and some of them hand the player a fact they would otherwise have to
discover.

### Writing for both modes

A character is played two ways from the same file. Written mode reads her
`dialogue` tree. AI mode reads her sheet — `bio`, `personality`, `likes`,
`dislikes`, `dealbreaker`, `interests` — plus two fields written for it:

- **`voice`** — direction for an actor. Three to five lines, concrete, about how
  she talks rather than who she is. Sable's first rule is "Short sentences. She
  does not explain herself twice."
- Her authored lines. The AI provider samples her actual tree and shows the
  model how she sounds, so a new character's dialogue tree improves her AI
  version for free.

Keep `likes` and `dislikes` honest: both modes score against them, and in AI
mode they are also what the model is told she cares about.

### Which provider is running

The game talks to a `DialogueProvider`, never to a tree.
`ScriptedDialogueProvider` (the one that ships) reads the content above.
`engine/dialogue/llmProvider.ts` is a documented stub for a model-backed
provider; swapping it in is one line in `engine/encounter.ts`. Nothing else in
the game knows which is active.

## Balance numbers

All of them are in `src/config/gameConfig.ts` (`BALANCE`). XP curves, starting
money, energy recovery, confidence rules. Change them there, not in the engine —
the tests read the same constants, so a balance change does not break the suite.

`CONTENT_RATING` also lives there: `'tame' | 'suggestive' | 'explicit'`. Content
is authored for `'suggestive'`, romance fades to black, and every character is
21 or older. Use `allowsContent('suggestive')` to gate anything spicier than a
raised eyebrow.

## Onboarding tips

`src/content/onboarding.ts`. Each tip is an id, a title and two sentences, shown
once, stored as a `tip_<id>` player flag, and switchable in settings. Place one
with `<TipCard id="venue" />`; it renders nothing once it has been read.

## Sound cues

`src/engine/audio.ts` holds the cue list. Add a cue name there and call
`playCue('your_cue')` where it belongs. Nothing plays until a real audio player
is registered, and a broken sound can never break a conversation.

## Running things

```bash
npm run dev        # play it
npm run test       # unit tests
npm run typecheck  # types only
npm run build      # production build
```
