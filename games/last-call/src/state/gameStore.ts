import { create } from 'zustand';
import type { ActivityId, CharacterId, DateIdeaId, TextTone, VenueId } from '@/content/ids';
import type { ScheduledDate } from '@/types/phone';
import type { EncounterState } from '@/types/dialogue';
import type { GameSettings, GameState, ScreenId } from '@/types/game';
import type { CreationChoices } from '@/engine/newGame';
import { createNewGame } from '@/engine/newGame';
import { createRng, randomSeed } from '@/engine/rng';
import { getActivity } from '@/content/activities';
import { VENUES } from '@/content/venues';
import { performActivity, skipSlot } from '@/engine/activities';
import { advanceSlots, appendLog, makeLogEntry } from '@/engine/calendar';
import { beginEncounter, chooseOption, concludeEncounter } from '@/engine/encounter';
import { beginDate, concludeDate, dateDueNow, payForDate } from '@/engine/dates';
import { onDayRolled } from '@/engine/dayTick';
import { askOut, sendText } from '@/engine/phone';
import { WINGMAN_ASSIST_BONUS, assistLine, tipFor } from '@/engine/wingman';
import { dartsBonus, dartsVerdict } from '@/engine/darts';
import { clearSave, hasSave, loadFromStorage, saveToStorage } from '@/engine/save';

export interface VenueVisit {
  venueId: VenueId;
  /** Slots owed to the clock when the player leaves. */
  pendingSlots: number;
  atmosphere: string;
  /** Interest bonus earned at the dartboard, spent on the next conversation. */
  bonus: number;
  dartsPlayed: boolean;
  dartsLine: string | null;
  wingmanUsed: boolean;
  wingmanLine: string | null;
}

export interface GameStore {
  screen: ScreenId;
  game: GameState | null;
  visit: VenueVisit | null;
  encounter: EncounterState | null;
  /** The date being played right now, if this is a date rather than a night out. */
  activeDate: ScheduledDate | null;
  /** Whose thread the phone is showing. */
  openThreadId: string | null;
  saveExists: boolean;
  notice: string | null;

  goToTitle: () => void;
  startCreation: () => void;
  beginGame: (choices: CreationChoices) => void;
  continueGame: () => void;
  deleteSave: () => void;
  doActivity: (id: ActivityId) => void;
  skip: () => void;
  acknowledgeDay: () => void;
  acknowledgeWeek: () => void;
  leaveVenue: () => void;
  recordDarts: (total: number) => void;
  talkTo: (characterId: CharacterId) => Promise<void>;
  pickOption: (optionId: string) => Promise<void>;
  endEncounter: () => void;
  closeEncounterSummary: () => void;
  openGallery: () => void;
  openPhone: () => void;
  openThread: (id: string) => void;
  closeThread: () => void;
  sendTextTo: (characterId: CharacterId, tone: TextTone, text: string) => void;
  askOutWith: (characterId: CharacterId, ideaId: DateIdeaId) => void;
  askWingman: (about: CharacterId) => void;
  useWingman: () => void;
  startDate: () => Promise<void>;
  updateSettings: (patch: Partial<GameSettings>) => void;
  dismissNotice: () => void;
}

function commit(state: GameState): GameState {
  saveToStorage(state);
  return state;
}

/** Missed dates and incoming texts land the moment the day turns over. */
function afterClock(state: GameState, dayRolled: boolean, rng: ReturnType<typeof createRng>): GameState {
  if (!dayRolled) return { ...state, rngCursor: rng.cursor };
  const ticked = onDayRolled(state, rng);
  return { ...ticked.state, rngCursor: rng.cursor };
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  game: null,
  visit: null,
  encounter: null,
  activeDate: null,
  openThreadId: null,
  saveExists: hasSave(),
  notice: null,

  goToTitle: () =>
    set({ screen: 'title', notice: null, saveExists: hasSave(), visit: null, encounter: null }),

  startCreation: () => set({ screen: 'creation', notice: null }),

  beginGame: (choices) => {
    const game = createNewGame(choices, randomSeed());
    set({ game: commit(game), screen: 'city', saveExists: true, notice: null, visit: null });
  },

  continueGame: () => {
    const result = loadFromStorage();
    if (!result) {
      set({ notice: 'No save found on this device.', saveExists: false });
      return;
    }
    if (!result.ok) {
      set({ notice: result.reason });
      return;
    }
    set({
      game: result.state,
      screen: 'city',
      saveExists: true,
      visit: null,
      encounter: null,
      notice: result.migratedFrom === null ? null : 'Save upgraded from an older version.',
    });
  },

  deleteSave: () => {
    clearSave();
    set({ game: null, screen: 'title', saveExists: false, notice: 'Save deleted.', visit: null });
  },

  doActivity: (id) => {
    const { game } = get();
    if (!game) return;
    const activity = getActivity(id);
    const rng = createRng(game.rngSeed, game.rngCursor);
    const goingOut = activity.venue !== undefined;
    const result = performActivity(game, id, rng, { deferClock: goingOut });

    if (!result.ok) {
      set({ notice: result.reasons.join(' · ') });
      return;
    }

    const next: GameState = { ...result.state, rngCursor: rng.cursor };

    if (goingOut && activity.venue) {
      const venue = VENUES[activity.venue];
      set({
        game: commit(next),
        screen: 'venue',
        notice: null,
        visit: {
          venueId: activity.venue,
          pendingSlots: result.pendingSlots,
          atmosphere: rng.pick(venue.atmosphere),
          bonus: 0,
          dartsPlayed: false,
          dartsLine: null,
          wingmanUsed: false,
          wingmanLine: null,
        },
      });
      return;
    }

    set({
      game: commit(afterClock(next, result.dayRolled, rng)),
      screen: result.weekRolled ? 'weekEnd' : result.dayRolled ? 'dayEnd' : 'city',
      notice: null,
    });
  },

  skip: () => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = skipSlot(game, rng);
    const next: GameState = result.state;
    set({
      game: commit(afterClock(next, result.dayRolled, rng)),
      screen: result.weekRolled ? 'weekEnd' : result.dayRolled ? 'dayEnd' : 'city',
      notice: null,
    });
  },

  acknowledgeDay: () => set({ screen: 'city' }),
  acknowledgeWeek: () => set({ screen: 'city' }),

  /** Leaving the venue is what actually spends the slot. */
  leaveVenue: () => {
    const { game, visit } = get();
    if (!game || !visit) {
      set({ screen: 'city', visit: null });
      return;
    }
    const rng = createRng(game.rngSeed, game.rngCursor);
    const advanced = advanceSlots(game, visit.pendingSlots, rng);
    const next = appendLog(advanced.state, advanced.entries);
    set({
      game: commit(afterClock(next, advanced.dayRolled, rng)),
      visit: null,
      encounter: null,
      activeDate: null,
      screen: advanced.weekRolled ? 'weekEnd' : advanced.dayRolled ? 'dayEnd' : 'city',
    });
  },

  recordDarts: (total) => {
    const { game, visit } = get();
    if (!game || !visit) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const line = dartsVerdict(total);
    const next: GameState = {
      ...appendLog(game, [makeLogEntry(game, `Darts: ${line}`, 'flavour', rng)]),
      rngCursor: rng.cursor,
    };
    set({
      game: commit(next),
      visit: { ...visit, bonus: dartsBonus(total), dartsPlayed: true, dartsLine: line },
    });
  },

  talkTo: async (characterId) => {
    const { game, visit } = get();
    if (!game || !visit) return;
    set({ screen: 'encounter', encounter: null, notice: null });
    try {
      const encounter = await beginEncounter(game, characterId, visit.venueId, visit.bonus);
      set({ encounter });
    } catch (error) {
      set({
        screen: 'venue',
        notice: error instanceof Error ? error.message : 'She is not around tonight.',
      });
    }
  },

  pickOption: async (optionId) => {
    const { game, encounter } = get();
    if (!game || !encounter || encounter.busy || encounter.outcome) return;
    set({ encounter: { ...encounter, busy: true } });
    const rng = createRng(game.rngSeed, game.rngCursor);
    try {
      const next = await chooseOption(game, encounter, optionId, undefined, rng);
      set({ game: { ...game, rngCursor: rng.cursor }, encounter: next });
    } catch (error) {
      set({
        encounter: { ...encounter, busy: false },
        notice: error instanceof Error ? error.message : 'Something went wrong mid-sentence.',
      });
    }
  },

  /** Conversation over: write it into her memory and pay out. */
  endEncounter: () => {
    const { game, encounter, visit, activeDate } = get();
    if (!game || !encounter) return;
    const rng = createRng(game.rngSeed, game.rngCursor);

    if (activeDate) {
      const result = concludeDate(game, encounter, activeDate, rng);
      set({
        game: commit({ ...result.state, rngCursor: rng.cursor }),
        screen: 'encounterEnd',
      });
      return;
    }

    const result = concludeEncounter(game, encounter, rng);
    set({
      game: commit({ ...result.state, rngCursor: rng.cursor }),
      screen: 'encounterEnd',
      visit: visit ? { ...visit, bonus: 0 } : null,
    });
  },

  closeEncounterSummary: () => {
    const { game, activeDate } = get();
    if (activeDate && game) {
      const rng = createRng(game.rngSeed, game.rngCursor);
      const advanced = advanceSlots(game, 1, rng);
      const next = appendLog(advanced.state, advanced.entries);
      set({
        game: commit(afterClock(next, advanced.dayRolled, rng)),
        screen: advanced.weekRolled ? 'weekEnd' : advanced.dayRolled ? 'dayEnd' : 'city',
        encounter: null,
        activeDate: null,
      });
      return;
    }
    set({ screen: 'venue', encounter: null });
  },

  openGallery: () => set({ screen: 'gallery' }),

  openPhone: () => set({ screen: 'phone', openThreadId: null }),

  openThread: (id) => {
    const { game } = get();
    if (game) {
      const thread = game.phone.threads[id];
      if (thread?.unread) {
        set({
          game: commit({
            ...game,
            phone: {
              ...game.phone,
              threads: { ...game.phone.threads, [id]: { ...thread, unread: false } },
            },
          }),
        });
      }
    }
    set({ screen: 'thread', openThreadId: id });
  },

  closeThread: () => set({ screen: 'phone', openThreadId: null }),

  sendTextTo: (characterId, tone, text) => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = sendText(game, characterId, tone, text, rng);
    set({
      game: commit({ ...result.state, rngCursor: rng.cursor }),
      notice: result.notes[0] ?? null,
    });
  },

  askOutWith: (characterId, ideaId) => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = askOut(game, characterId, ideaId, rng);
    set({
      game: commit({ ...result.state, rngCursor: rng.cursor }),
      notice: result.accepted ? null : 'She said no. It cost you a little.',
    });
  },

  askWingman: (about) => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = tipFor(game, about, rng);
    set({ game: commit({ ...result.state, rngCursor: rng.cursor }), openThreadId: 'dez', screen: 'thread' });
  },

  /** Dez comes over and does the introduction properly. */
  useWingman: () => {
    const { game, visit } = get();
    if (!game || !visit || visit.wingmanUsed) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const line = assistLine(rng);
    set({
      game: commit({ ...game, rngCursor: rng.cursor }),
      visit: {
        ...visit,
        wingmanUsed: true,
        wingmanLine: line,
        bonus: visit.bonus + WINGMAN_ASSIST_BONUS,
      },
    });
  },

  /** A date that is due in this slot. Costs money and energy up front. */
  startDate: async () => {
    const { game } = get();
    if (!game) return;
    const due = dateDueNow(game);
    if (!due) {
      set({ notice: 'Nothing planned for right now.' });
      return;
    }
    const paid = payForDate(game, due);
    set({ game: paid, screen: 'date', encounter: null, activeDate: due, notice: null });
    try {
      const encounter = await beginDate(paid, due);
      set({ encounter });
    } catch (error) {
      set({
        screen: 'city',
        activeDate: null,
        notice: error instanceof Error ? error.message : 'The date did not happen.',
      });
    }
  },

  updateSettings: (patch) => {
    const { game } = get();
    if (!game) return;
    set({ game: commit({ ...game, settings: { ...game.settings, ...patch } }) });
  },

  dismissNotice: () => set({ notice: null }),
}));
