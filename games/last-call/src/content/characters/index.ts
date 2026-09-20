import type { CharacterId } from '@/content/ids';
import type { CharacterDef } from '@/types/character';
import { NADIA } from '@/content/characters/nadia';
import { SABLE } from '@/content/characters/sable';
import { WREN } from '@/content/characters/wren';

/**
 * Every character in the game. Add a new one by writing its file and adding it
 * here plus its id in content/ids.ts — no engine change required.
 */
export const CHARACTERS: Readonly<Partial<Record<CharacterId, CharacterDef>>> = {
  sable: SABLE,
  wren: WREN,
  nadia: NADIA,
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
