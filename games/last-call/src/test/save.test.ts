import { describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/types/save';
import { clearSave, deserialize, hasSave, loadFromStorage, saveToStorage, serialize } from '@/engine/save';
import { newTestGame } from '@/test/helpers';

/** Minimal in-memory Storage stand-in, so these tests need no DOM. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

describe('save round trip', () => {
  it('writes and reads back an identical state', () => {
    const storage = memoryStorage();
    const game = newTestGame();
    expect(saveToStorage(game, storage)).toBe(true);
    expect(hasSave(storage)).toBe(true);

    const loaded = loadFromStorage(storage);
    expect(loaded?.ok).toBe(true);
    if (loaded?.ok) {
      expect(loaded.state).toEqual(game);
      expect(loaded.migratedFrom).toBeNull();
    }
  });

  it('reports no save when storage is empty', () => {
    expect(loadFromStorage(memoryStorage())).toBeNull();
  });

  it('clears a save', () => {
    const storage = memoryStorage();
    saveToStorage(newTestGame(), storage);
    clearSave(storage);
    expect(hasSave(storage)).toBe(false);
  });

  it('stamps the current version on the envelope', () => {
    expect(serialize(newTestGame()).version).toBe(SAVE_VERSION);
  });
});

describe('loading bad saves', () => {
  it('rejects unreadable JSON', () => {
    const result = deserialize('{ not json');
    expect(result.ok).toBe(false);
  });

  it('rejects a blob with no envelope', () => {
    const result = deserialize(JSON.stringify({ hello: 'there' }));
    expect(result).toEqual({ ok: false, reason: 'Save file is missing its envelope.' });
  });

  it('refuses saves from a newer game version', () => {
    const raw = JSON.stringify({ version: SAVE_VERSION + 5, savedAt: 0, state: newTestGame() });
    const result = deserialize(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('newer version');
  });

  it('rejects a save whose player is missing stats', () => {
    const game = newTestGame();
    const broken = {
      version: SAVE_VERSION,
      savedAt: 0,
      state: { ...game, player: { ...game.player, stats: { charm: { value: 1, xp: 0 } } } },
    };
    const result = deserialize(JSON.stringify(broken));
    expect(result).toEqual({ ok: false, reason: 'Save file is corrupt.' });
  });
});

describe('migrations', () => {
  it('upgrades a version 0 save that predates settings', () => {
    const game = newTestGame();
    const legacyPlayer: Record<string, unknown> = { ...game.player };
    delete legacyPlayer['venueReputation'];
    const legacyState: Record<string, unknown> = { ...game, player: legacyPlayer };
    delete legacyState['settings'];
    delete legacyState['lastWeek'];

    const result = deserialize(JSON.stringify({ version: 0, savedAt: 0, state: legacyState }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migratedFrom).toBe(0);
      expect(result.state.settings.contentRating).toBe('suggestive');
      expect(result.state.player.venueReputation).toEqual({});
      expect(result.state.lastWeek).toBeNull();
    }
  });
});

describe('the dialogue-mode migration', () => {
  it('moves an old default onto auto, so free text is not locked off forever', () => {
    // Every save written before v5 carries 'scripted' because that was the
    // default, not because anyone chose it.
    const old = {
      version: 4,
      savedAt: Date.now(),
      state: { ...newTestGame(), settings: { ...newTestGame().settings, dialogueMode: 'scripted' } },
    };
    const result = deserialize(JSON.stringify(old));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.settings.dialogueMode).toBe('auto');
    expect(result.migratedFrom).toBe(4);
  });

  it('leaves a deliberate AI choice alone', () => {
    const old = {
      version: 4,
      savedAt: Date.now(),
      state: { ...newTestGame(), settings: { ...newTestGame().settings, dialogueMode: 'ai' } },
    };
    const result = deserialize(JSON.stringify(old));
    expect(result.ok && result.state.settings.dialogueMode).toBe('ai');
  });
});
