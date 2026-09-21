# Last Call (working title)

A dating / life simulation prototype. You make a character, live a week at a
time in one city — working, getting more interesting, going out — and try to be
worth talking to.

Two pillars:

1. **A conversation system where reading the other person is the skill.** Not
   picking the right option from a list: noticing that she has checked her phone
   twice and changing tack.
2. **An RPG self-improvement loop**, where becoming a more interesting person is
   what opens up new connections.

The women are people, not puzzles. They can reject you, lose interest, remember
what you said last week, have bad days, and text first.

## Stack

React 19 + TypeScript + Vite, Tailwind 4, Zustand with versioned localStorage
saves, Vitest. Mobile-first: it is built to be wrapped for app stores later.

## Running it

```bash
cd games/last-call
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run typecheck
npm run build
```

### Playing it without a server

```bash
npm run build:standalone   # -> dist-standalone/last-call.html
```

One file, everything inlined, openable straight from disk — double-click it, or
drag it into a browser tab. Saves and imported portraits go to that browser's
`localStorage`, keyed `last-call:save`.

The standalone build compiles to a classic `iife` script rather than an ES
module, because browsers refuse to load modules from a `file://` origin. The
platform AI transport is not there off-platform either, so conversations run the
scripted dialogue trees; for free-text conversation use `npm run dev` with a key
(see [The conversation system](#the-conversation-system)) or the hosted build.

## Where things are

| Path | What lives there |
| --- | --- |
| `src/content` | All game content: activities, traits, hobbies, venues, jobs, wardrobe, appearance |
| `src/config/gameConfig.ts` | `CONTENT_RATING` and every balance number |
| `src/types` | The shapes content and state must satisfy |
| `src/engine` | Pure rules: progression, calendar, activity resolution, saves, RNG |
| `src/engine/dialogue` | Conversation scoring, the written provider, the AI provider |
| `server/` | The dialogue service that holds the API key for AI mode |
| `src/content/characters` | Characters, their dialogue trees and their date scenes |
| `src/state` | Zustand store and UI selectors |
| `src/ui` | Screens and components |
| `src/test` | Unit tests |
| `docs/CONTENT_GUIDE.md` | How to add a character, venue, activity or trait |
| `docs/ART_GUIDE.md` | Portrait layers, sizes, naming convention, gallery |
| `docs/AI_DIALOGUE.md` | AI mode: running it, who decides what, the prompt, cost |

## Build phases

- **Phase 1 (done)** — project setup, types, store, versioned save/load,
  character creation, stat system, calendar loop with activities. Create a
  character and live a week.
- **Phase 2 (done)** — the conversation engine behind a `DialogueProvider`
  interface, `ScriptedDialogueProvider` with Sable's full dialogue tree, the
  awareness mechanic, layered portraits with eight expressions, the bar with
  darts, character memory and relationship stages, and the gallery.
- **Phase 3 (done)** — Wren and Nadia with full dialogue trees, the bookshop and
  the gym running encounters, venue reputation, and gossip between characters
  who know each other.
- **Phase 4 (done)** — the phone: contacts, texting with tone and cadence, she
  texts first when she is interested, asking her out, a planned date that lands
  on the calendar, one full date scene per character, and Dez the wingman.
- **Phase 5 (done)** — polish: screen transitions, a settings screen, sound
  hooks wired at every moment that should make a noise, first-run coaching, and
  a balance pass driven by a simulation of a sensible player.

## The conversation system

The game never reads a dialogue tree. It calls `open()` and `respond()` on a
`DialogueProvider` and gets back her line, an expression, a body-language cue,
interest and comfort deltas, and the next set of replies.

- **Written mode** — `ScriptedDialogueProvider`, the authored trees in
  `src/content`. Works offline, always.
- **AI mode** — type anything and she answers in character, powered by Claude.
  The model writes her words; the game still decides what they are worth, and it
  cannot hand out a win the player has not earned. Full details, including how
  to run it and what it costs: **`docs/AI_DIALOGUE.md`**.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run dev   # then Settings -> AI - say anything
```

What the player can see of her state depends on their social awareness level:
nothing at all at first (just her face and what she does with her hands), then
words, then bars, then numbers, then the reasons behind each swing.

## The week, end to end

Work and train and read to become someone worth talking to. Go out on a night
she is there. Read her face, because the meters are not there yet. Get a number.
Text with some timing. Ask her out to something she would actually like. Turn
up. Do not turn up and she will tell you about it.

## Balance

`src/config/gameConfig.ts` holds every number, and `src/test/balance.test.ts`
simulates a sensible player — works weekdays, trains, goes out when someone is
around, picks replies she likes — for three weeks and asserts the outcome:
rent paid, several stats visibly grown, social awareness at level two, and at
least one number. Run it with a report:

```bash
BALANCE_REPORT=1 npm run test -- src/test/balance.test.ts --reporter=verbose
```

Change a constant, run that, and see what it did to a real playthrough.

## Sound

No audio ships, but every moment that should make a noise already calls
`playCue` (`src/engine/audio.ts`). Registering a player is one call at startup
and no call sites change:

```ts
registerAudioPlayer((cue) => howler.play(cue));
```

## Content rating

`CONTENT_RATING` in `src/config/gameConfig.ts` is `'suggestive'`: flirting and
innuendo, scenes fade to black. Every character in the game is 21 or older.
