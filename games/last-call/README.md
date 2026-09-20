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
| `src/state` | Zustand store and UI selectors |
| `src/ui` | Screens and components |
| `src/test` | Unit tests |
| `docs/CONTENT_GUIDE.md` | How to add a character, venue, activity or trait |
| `docs/ART_GUIDE.md` | Portrait layers, sizes, naming convention, gallery |

## Build phases

- **Phase 1 (done)** — project setup, types, store, versioned save/load,
  character creation, stat system, calendar loop with activities. Create a
  character and live a week.
- **Phase 2** — conversation engine with `ScriptedDialogueProvider`, awareness
  mechanic, layered portraits with expressions, the bar, and one complete
  character with a full dialogue tree.
- **Phase 3** — the other two characters, the other two venues, memory,
  relationship stages, reputation.
- **Phase 4** — phone and texting, dates, wingman, hobbies wired into dialogue.
- **Phase 5** — polish: transitions, sound hooks, onboarding, balance pass.

## Content rating

`CONTENT_RATING` in `src/config/gameConfig.ts` is `'suggestive'`: flirting and
innuendo, scenes fade to black. Every character in the game is 21 or older.
