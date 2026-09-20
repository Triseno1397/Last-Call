import type { GameState } from '@/types/game';
import type { LoadResult, SaveEnvelope } from '@/types/save';
import { SAVE_VERSION } from '@/types/save';
import { STAT_IDS } from '@/content/ids';

export const SAVE_KEY = 'last-call:save';

/**
 * Migrations run in order from the save's version up to SAVE_VERSION. Each one
 * takes the previous shape (as unknown) and returns the next shape. When you
 * change GameState: bump SAVE_VERSION in types/save.ts and add an entry here.
 */
type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // 0 -> 1: settings and per-venue reputation were added.
  0: (state) => {
    const player = (state['player'] ?? {}) as Record<string, unknown>;
    return {
      ...state,
      settings: state['settings'] ?? {
        contentRating: 'suggestive',
        reducedMotion: false,
        alwaysShowMeters: false,
      },
      lastWeek: state['lastWeek'] ?? null,
      player: { ...player, venueReputation: player['venueReputation'] ?? {} },
    };
  },
  // 1 -> 2: the player has a gender, and characters remember you.
  1: (state) => {
    const player = (state['player'] ?? {}) as Record<string, unknown>;
    return {
      ...state,
      characters: state['characters'] ?? {},
      player: { ...player, gender: player['gender'] ?? 'man' },
    };
  },
  // 2 -> 3: the phone, scheduled dates and texting cadence.
  2: (state) => {
    const characters = (state['characters'] ?? {}) as Record<string, Record<string, unknown>>;
    const upgraded: Record<string, unknown> = {};
    for (const [id, memory] of Object.entries(characters)) {
      upgraded[id] = {
        ...memory,
        lastContactAbsoluteDay: memory['lastContactAbsoluteDay'] ?? null,
        dates: memory['dates'] ?? 0,
        standUps: memory['standUps'] ?? 0,
      };
    }
    return {
      ...state,
      characters: upgraded,
      phone: state['phone'] ?? { threads: {}, tipsGiven: [], lastTipDay: null },
      dates: state['dates'] ?? [],
    };
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural check that the parsed blob is a game state we can actually run. */
function validateState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  const player = value['player'];
  const clock = value['clock'];
  if (!isRecord(player) || !isRecord(clock)) return false;
  if (typeof player['name'] !== 'string') return false;
  if (typeof player['money'] !== 'number' || typeof player['energy'] !== 'number') return false;
  if (!isRecord(player['stats'])) return false;
  const stats = player['stats'];
  for (const stat of STAT_IDS) {
    const entry = stats[stat];
    if (!isRecord(entry) || typeof entry['value'] !== 'number' || typeof entry['xp'] !== 'number') {
      return false;
    }
  }
  if (typeof clock['week'] !== 'number' || typeof clock['dayIndex'] !== 'number') return false;
  if (typeof clock['slotIndex'] !== 'number') return false;
  if (!Array.isArray(value['log'])) return false;
  return true;
}

export function serialize(state: GameState): SaveEnvelope {
  return { version: SAVE_VERSION, savedAt: Date.now(), state };
}

/** Parse, migrate and validate a save blob from any source. */
export function deserialize(raw: string): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'Save file is not readable JSON.' };
  }

  if (!isRecord(parsed) || typeof parsed['version'] !== 'number' || !isRecord(parsed['state'])) {
    return { ok: false, reason: 'Save file is missing its envelope.' };
  }

  const version = parsed['version'];
  if (version > SAVE_VERSION) {
    return {
      ok: false,
      reason: `This save came from a newer version of the game (v${version}).`,
    };
  }

  let state = parsed['state'];
  const migratedFrom = version < SAVE_VERSION ? version : null;
  for (let v = version; v < SAVE_VERSION; v += 1) {
    const migration = MIGRATIONS[v];
    if (!migration) return { ok: false, reason: `No migration from save version ${v}.` };
    state = migration(state);
  }

  if (!validateState(state)) return { ok: false, reason: 'Save file is corrupt.' };
  return { ok: true, state, migratedFrom };
}

function storageOrNull(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function saveToStorage(state: GameState, storage?: Storage): boolean {
  const target = storageOrNull(storage);
  if (!target) return false;
  try {
    target.setItem(SAVE_KEY, JSON.stringify(serialize(state)));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage?: Storage): LoadResult | null {
  const target = storageOrNull(storage);
  if (!target) return null;
  const raw = target.getItem(SAVE_KEY);
  if (raw === null) return null;
  return deserialize(raw);
}

export function hasSave(storage?: Storage): boolean {
  const target = storageOrNull(storage);
  if (!target) return false;
  return target.getItem(SAVE_KEY) !== null;
}

export function clearSave(storage?: Storage): void {
  const target = storageOrNull(storage);
  if (!target) return;
  try {
    target.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do: a browser with storage disabled just plays without saves.
  }
}
