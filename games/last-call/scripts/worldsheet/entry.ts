import { paintStreet } from '@/ui/art/street';
import { paintRoom } from '@/ui/art/room';
import { INTERIORS } from '@/content/interiors';
import { CITY_HEIGHT, CITY_WIDTH, TILE } from '@/content/city';
import { drawCharacter } from '@/ui/art/sprite';
import { characterLook, strangerLook } from '@/ui/art/looks';
import { getStranger } from '@/content/strangers';
import { getCharacter } from '@/content/characters';
(window as unknown as { WorldSheet: unknown }).WorldSheet = {
  paintStreet, paintRoom, INTERIORS, CITY_HEIGHT, CITY_WIDTH, TILE, drawCharacter, strangerLook, characterLook, getStranger, getCharacter,
};
