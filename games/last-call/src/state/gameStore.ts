import { create } from 'zustand';
import type { ActivityId, CharacterId, VenueId } from '@/content/ids';
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
}

export interface GameStore {
  screen: ScreenId;
  game: GameState | null;
  visit: VenueVisit | null;
  encounter: EncounterState | null;
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
  updateSettings: (patch: Partial<GameSettings>) => void;
  dismissNotice: () => void;
}

function commit(state: GameState): GameState {
  saveToStorage(state);
  return state;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  game: null,
  visit: null,
  encounter: null,
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
        },
      });
      return;
    }

    set({
      game: commit(next),
      screen: result.weekRolled ? 'weekEnd' : result.dayRolled ? 'dayEnd' : 'city',
      notice: null,
    });
  },

  skip: () => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = skipSlot(game, rng);
    const next: GameState = { ...result.state, rngCursor: rng.cursor };
    set({
      game: commit(next),
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
    const next: GameState = {
      ...appendLog(advanced.state, advanced.entries),
      rngCursor: rng.cursor,
    };
    set({
      game: commit(next),
      visit: null,
      encounter: null,
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
    const { game, encounter, visit } = get();
    if (!game || !encounter) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = concludeEncounter(game, encounter, rng);
    const next: GameState = { ...result.state, rngCursor: rng.cursor };
    set({
      game: commit(next),
      screen: 'encounterEnd',
      visit: visit ? { ...visit, bonus: 0 } : null,
    });
  },

  closeEncounterSummary: () => set({ screen: 'venue', encounter: null }),

  openGallery: () => set({ screen: 'gallery' }),

  updateSettings: (patch) => {
    const { game } = get();
    if (!game) return;
    set({ game: commit({ ...game, settings: { ...game.settings, ...patch } }) });
  },

  dismissNotice: () => set({ notice: null }),
}));
