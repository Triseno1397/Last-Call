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

## Where things are

| Path | What lives there |
| --- | --- |
| `src/content` | All game content: activities, traits, hobbies, venues, jobs, wardrobe, appearance |
| `src/config/gameConfig.ts` | `CONTENT_RATING` and every balance number |
| `src/types` | The shapes content and state must satisfy |
| `src/engine` | Pure rules: progression, calendar, activity resolution, saves, RNG |
| `src/engine/dialogue` | Conversation scoring, the scripted provider, the LLM provider stub |
| `src/content/characters` | Characters, their dialogue trees and their date scenes |
| `src/state` | Zustand store and UI selectors |
| `src/ui` | Screens and components |
| `src/test` | Unit tests |
| `docs/CONTENT_GUIDE.md` | How to add a character, venue, activity or trait |
| `docs/ART_GUIDE.md` | Portrait layers, sizes, naming convention, gallery |

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
- **Phase 5** — polish: transitions, sound hooks, onboarding, balance pass.

## The conversation system

The game never reads a dialogue tree. It calls `open()` and `respond()` on a
`DialogueProvider` and gets back her line, an expression, a body-language cue,
interest and comfort deltas, and the next set of replies.

- `ScriptedDialogueProvider` — ships, reads authored trees from `src/content`.
- `LLMDialogueProvider` — a documented stub in `engine/dialogue/llmProvider.ts`.
  Swapping it in is one line in `engine/encounter.ts`; nothing else changes.

What the player can see of her state depends on their social awareness level:
nothing at all at first (just her face and what she does with her hands), then
words, then bars, then numbers, then the reasons behind each swing.

## The week, end to end

Work and train and read to become someone worth talking to. Go out on a night
she is there. Read her face, because the meters are not there yet. Get a number.
Text with some timing. Ask her out to something she would actually like. Turn
up. Do not turn up and she will tell you about it.

## Content rating

`CONTENT_RATING` in `src/config/gameConfig.ts` is `'suggestive'`: flirting and
innuendo, scenes fade to black. Every character in the game is 21 or older.
