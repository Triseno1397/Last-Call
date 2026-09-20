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

Character ids live in `CHARACTER_IDS`. Character data files land in Phase 2/3
(`src/content/characters/`), and the shape is already reserved: archetype,
traits, bio, age (21+ — enforced by a test), likes, dislikes, one dealbreaker,
interests, weekly schedule, mood range, memory and relationship stage.

The rule the architecture exists to protect: **adding a character must not
require an engine change.** A character is data plus a dialogue tree; the
conversation engine reads both through the `DialogueProvider` interface.

## Balance numbers

All of them are in `src/config/gameConfig.ts` (`BALANCE`). XP curves, starting
money, energy recovery, confidence rules. Change them there, not in the engine —
the tests read the same constants, so a balance change does not break the suite.

`CONTENT_RATING` also lives there: `'tame' | 'suggestive' | 'explicit'`. Content
is authored for `'suggestive'`, romance fades to black, and every character is
21 or older. Use `allowsContent('suggestive')` to gate anything spicier than a
raised eyebrow.

## Running things

```bash
npm run dev        # play it
npm run test       # unit tests
npm run typecheck  # types only
npm run build      # production build
```
