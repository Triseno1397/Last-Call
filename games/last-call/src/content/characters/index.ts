import type { CharacterId } from '@/content/ids';
import type { CharacterDef } from '@/types/character';
import { SABLE } from '@/content/characters/sable';

/**
 * Every character in the game. Add a new one by writing its file and adding it
 * here plus its id in content/ids.ts — no engine change required.
 *
 * Phase 3 adds Wren (the grad student) and Nadia (the gym regular).
 */
export const CHARACTERS: Readonly<Partial<Record<CharacterId, CharacterDef>>> = {
  sable: SABLE,
};

export const CHARACTER_LIST: readonly CharacterDef[] = Object.values(CHARACTERS).filter(
  (character): character is CharacterDef => character !== undefined,
);

export function getCharacter(id: CharacterId): CharacterDef {
  const character = CHARACTERS[id];
  if (!character) throw new Error(`Character "${id}" has no data yet`);
  return character;
}

export function isPlayable(id: CharacterId): boolean {
  return CHARACTERS[id] !== undefined;
}
