import { create } from 'zustand';
import type { ActivityId } from '@/content/ids';
import type { GameSettings, GameState, ScreenId } from '@/types/game';
import type { CreationChoices } from '@/engine/newGame';
import { createNewGame } from '@/engine/newGame';
import { createRng, randomSeed } from '@/engine/rng';
import { performActivity, skipSlot } from '@/engine/activities';
import { clearSave, hasSave, loadFromStorage, saveToStorage } from '@/engine/save';

export interface GameStore {
  screen: ScreenId;
  game: GameState | null;
  saveExists: boolean;
  /** Transient message for the UI (load failures, locked activities). */
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
  updateSettings: (patch: Partial<GameSettings>) => void;
  dismissNotice: () => void;
}

/** Persist after every change so closing the tab never costs a week. */
function commit(state: GameState): GameState {
  saveToStorage(state);
  return state;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  game: null,
  saveExists: hasSave(),
  notice: null,

  goToTitle: () => set({ screen: 'title', notice: null, saveExists: hasSave() }),

  startCreation: () => set({ screen: 'creation', notice: null }),

  beginGame: (choices) => {
    const game = createNewGame(choices, randomSeed());
    set({ game: commit(game), screen: 'city', saveExists: true, notice: null });
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
      notice: result.migratedFrom === null ? null : 'Save upgraded from an older version.',
    });
  },

  deleteSave: () => {
    clearSave();
    set({ game: null, screen: 'title', saveExists: false, notice: 'Save deleted.' });
  },

  doActivity: (id) => {
    const { game } = get();
    if (!game) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const result = performActivity(game, id, rng);
    if (!result.ok) {
      set({ notice: result.reasons.join(' · ') });
      return;
    }
    const next: GameState = { ...result.state, rngCursor: rng.cursor };
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

  updateSettings: (patch) => {
    const { game } = get();
    if (!game) return;
    const next: GameState = { ...game, settings: { ...game.settings, ...patch } };
    set({ game: commit(next) });
  },

  dismissNotice: () => set({ notice: null }),
}));
