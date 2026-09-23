/**
 * The establishing shots.
 *
 * The same rendered scenes the rooms are played inside, used as the still
 * you see on arrival and as the picture behind a conversation. Kept as its
 * own module so the map screen does not need to know how scenes are built.
 */
import type { SceneId } from '@/content/scenes';
import { SCENE_IMAGES } from '@/content/scenes';

export type BackdropId = SceneId;

export const BACKDROPS: Readonly<Record<BackdropId, string>> = SCENE_IMAGES;

export function backdropFor(place: BackdropId): string | null {
  return BACKDROPS[place] ?? null;
}
