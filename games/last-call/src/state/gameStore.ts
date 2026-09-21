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
import { beginEncounter, chooseOption, concludeEncounter, sayToHer } from '@/engine/encounter';
import { providerFor, scriptedProvider, supportsFreeText } from '@/engine/dialogue/providers';
import { DialogueServiceError } from '@/engine/dialogue/llmProvider';
import { beginDate, concludeDate, dateDueNow, payForDate } from '@/engine/dates';
import { onDayRolled } from '@/engine/dayTick';
import { askOut, sendText } from '@/engine/phone';
import { WINGMAN_ASSIST_BONUS, assistLine, tipFor } from '@/engine/wingman';
import { dartsBonus, dartsVerdict } from '@/engine/darts';
import { PLAYER_EXITS } from '@/content/encounterCopy';
import { clearSave, hasSave, loadFromStorage, saveToStorage } from '@/engine/save';
import type { ArtMap, ArtSlot } from '@/engine/artStore';
import { canImportArt, importPortrait, loadArtMap } from '@/engine/artStore';
import { playCue, setMuted } from '@/engine/audio';

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
  /** Imported portraits, by character and expression. */
  artMap: ArtMap;
  /** True when this view can import art (a published build, as its owner). */
  artImportable: boolean;

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
  /** AI mode: the player typed something of his own. */
  sayTo: (text: string) => Promise<void>;
  /** True when the running provider takes free text. */
  canSpeakFreely: () => boolean;
  /** End the conversation yourself. Always available — you can always leave. */
  walkAway: () => void;
  endEncounter: () => void;
  closeEncounterSummary: () => void;
  openGallery: () => void;
  /** Step outside onto the block. Walking around costs nothing. */
  openCity: () => void;
  closeCity: () => void;
  /** Walk in through a venue door; this is where the slot gets spent. */
  enterVenueFromMap: (venue: VenueId) => void;
  openArtImport: () => void;
  loadArt: () => Promise<void>;
  importArt: (slot: ArtSlot, file: Blob) => Promise<void>;
  openSettings: () => void;
  dismissTip: (id: string) => void;
  resetTips: () => void;
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

/**
 * The provider driving the encounter on screen. Deliberately outside the store
 * state: it is a live object, not something to serialise into a save.
 */
let activeProvider = scriptedProvider;

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
  artMap: {},
  artImportable: false,

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
    setMuted(!result.state.settings.sound);
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
      playCue('venue_enter');
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

    playCue(result.weekRolled ? 'week_end' : result.dayRolled ? 'day_end' : 'slot_spent');
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

    activeProvider = providerFor(game);
    try {
      const encounter = await beginEncounter(game, characterId, visit.venueId, visit.bonus, activeProvider);
      playCue('line_her');
      set({ encounter });
      return;
    } catch (error) {
      // AI mode is best-effort: if the service is down, the authored version
      // of her is still right there, and the night carries on.
      if (activeProvider.id !== 'scripted') {
        activeProvider = scriptedProvider;
        try {
          const encounter = await beginEncounter(game, characterId, visit.venueId, visit.bonus, scriptedProvider);
          playCue('line_her');
          set({
            encounter,
            notice: `${error instanceof DialogueServiceError ? error.message : 'AI dialogue unavailable'} — using the written version of her.`,
          });
          return;
        } catch {
          // fall through to the venue
        }
      }
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
      const next = await chooseOption(game, encounter, optionId, activeProvider, rng);
      playCue('line_you');
      if (next.lastInterestDelta > 0) playCue('interest_up');
      if (next.lastInterestDelta < 0) playCue('interest_down');
      if (next.lastComfortDelta < 0) playCue('comfort_down');
      if (next.outcome === 'number' || next.outcome === 'date_planned') playCue('outcome_number');
      if (next.outcome === 'rejected' || next.outcome === 'she_left') playCue('outcome_reject');
      set({ game: { ...game, rngCursor: rng.cursor }, encounter: next });
    } catch (error) {
      set({
        encounter: { ...encounter, busy: false },
        notice: error instanceof Error ? error.message : 'Something went wrong mid-sentence.',
      });
    }
  },

  sayTo: async (text) => {
    const { game, encounter } = get();
    if (!game || !encounter || encounter.busy || encounter.outcome) return;
    if (!supportsFreeText(activeProvider)) {
      set({ notice: 'Free text needs AI dialogue turned on in settings.' });
      return;
    }
    if (text.trim().length === 0) return;

    set({ encounter: { ...encounter, busy: true } });
    const rng = createRng(game.rngSeed, game.rngCursor);
    try {
      const next = await sayToHer(game, encounter, text, activeProvider, rng);
      playCue('line_you');
      if (next.lastInterestDelta > 0) playCue('interest_up');
      if (next.lastInterestDelta < 0) playCue('interest_down');
      if (next.lastComfortDelta < 0) playCue('comfort_down');
      if (next.outcome === 'number' || next.outcome === 'date_planned') playCue('outcome_number');
      if (next.outcome === 'rejected' || next.outcome === 'she_left') playCue('outcome_reject');
      set({ game: { ...game, rngCursor: rng.cursor }, encounter: next });
    } catch (error) {
      set({
        encounter: { ...encounter, busy: false },
        notice:
          error instanceof DialogueServiceError
            ? error.message
            : 'She did not catch that. (The dialogue service errored.)',
      });
    }
  },

  canSpeakFreely: () => supportsFreeText(activeProvider),

  walkAway: () => {
    const { game, encounter } = get();
    if (!game || !encounter || encounter.outcome) return;
    const rng = createRng(game.rngSeed, game.rngCursor);
    const line = rng.pick(PLAYER_EXITS);
    playCue('ui_back');
    set({
      game: { ...game, rngCursor: rng.cursor },
      encounter: {
        ...encounter,
        busy: false,
        line,
        cue: null,
        options: [],
        outcome: 'you_left',
        beats: [...encounter.beats, { speaker: 'her', text: line, cue: null }],
      },
    });
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

  openSettings: () => set({ screen: 'settings' }),

  openArtImport: () => set({ screen: 'artImport' }),

  openCity: () => set({ screen: 'city_map', notice: null }),

  closeCity: () => set({ screen: 'city' }),

  enterVenueFromMap: (venue) => {
    get().doActivity(`go_out_${venue}` as ActivityId);
  },

  /** Read the imported art once at start-up; absent runtimes resolve empty. */
  loadArt: async () => {
    const [artMap, artImportable] = await Promise.all([loadArtMap(), canImportArt()]);
    set({ artMap, artImportable });
  },

  importArt: async (slot, file) => {
    const { artMap } = get();
    try {
      const result = await importPortrait(slot, file, artMap);
      set({ artMap: result.map, notice: null });
    } catch (error) {
      set({ notice: error instanceof Error ? error.message : 'That image would not import.' });
    }
  },

  dismissTip: (id) => {
    const { game } = get();
    if (!game) return;
    set({
      game: commit({
        ...game,
        player: { ...game.player, flags: { ...game.player.flags, [`tip_${id}`]: true } },
      }),
    });
  },

  resetTips: () => {
    const { game } = get();
    if (!game) return;
    const flags = { ...game.player.flags };
    for (const key of Object.keys(flags)) {
      if (key.startsWith('tip_')) delete flags[key];
    }
    set({
      game: commit({ ...game, player: { ...game.player, flags }, settings: { ...game.settings, showTips: true } }),
    });
  },

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
    playCue('text_sent');
    playCue('text_received');
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
    playCue('date_start');
    const paid = payForDate(game, due);
    set({ game: paid, screen: 'date', encounter: null, activeDate: due, notice: null });
    activeProvider = providerFor(paid);
    try {
      const encounter = await beginDate(paid, due, activeProvider);
      set({ encounter });
    } catch (error) {
      if (activeProvider.id !== 'scripted') {
        activeProvider = scriptedProvider;
        try {
          const encounter = await beginDate(paid, due, scriptedProvider);
          set({ encounter, notice: 'AI dialogue unavailable — using the written version of her.' });
          return;
        } catch {
          // fall through
        }
      }
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
    const settings = { ...game.settings, ...patch };
    setMuted(!settings.sound);
    set({ game: commit({ ...game, settings }) });
  },

  dismissNotice: () => set({ notice: null }),
}));
