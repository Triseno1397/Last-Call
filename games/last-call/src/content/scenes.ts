/**
 * The rendered scenes.
 *
 * One image per place, generated from the reference set so that every room
 * looks like the world it was asked to look like, and the game runs inside
 * it: the drawn floor plan of each room is projected onto the picture, so the
 * counter is at the back where the picture has a counter and the way out is
 * at the bottom of the frame where you walked in.
 *
 * The images are loaded straight from the render host by the player's
 * browser. `SCENE_FLOORS` says where the walkable floor sits in each picture,
 * in fractions of the frame, and how big a person is at the near and far edge.
 */
import type { InteriorId } from '@/content/city';

const HOST = 'https://d8j0ntlcm91z4.cloudfront.net/user_37NVjOty0iqni6aBd5Kpn88QUhU/';

export type SceneId = InteriorId | 'street' | 'square';

export const SCENE_IMAGES: Readonly<Record<SceneId, string>> = {
  street: `${HOST}hf_20260923_182912_74de5a8e-29e5-4d3d-afc2-bce1069536fb.png`,
  square: `${HOST}hf_20260923_182912_42c69db7-f6b9-4756-9cd2-a7a1d2d7a75d.png`,
  neon_last_call: `${HOST}hf_20260923_182911_e71fc484-4e67-4864-87c3-1a5e6d3760e2.png`,
  margin_notes: `${HOST}hf_20260923_182912_d13efa19-2933-45d3-aa38-52378b9a2832.png`,
  ironhaus: `${HOST}hf_20260923_183146_33e29b53-967f-4a16-9cbd-091656c7e5a6.png`,
  copper_kettle: `${HOST}hf_20260923_182912_e7cd9a8d-3487-4656-8cd5-3e89d0a0f273.png`,
  static_records: `${HOST}hf_20260923_182912_d4d55d57-411a-4bed-bd2a-d7c35842cbd3.png`,
  nightjar: `${HOST}hf_20260923_182912_ea8bd7b8-94df-4317-9d20-b4590cad1c47.png`,
  akai: `${HOST}hf_20260923_182912_be4e8d5a-2e1c-4958-bf0e-2860bd8d420f.png`,
  slurp: `${HOST}hf_20260923_182911_d69d33c0-829a-49b7-a822-bb8377561f37.png`,
  pixel_palace: `${HOST}hf_20260923_182912_1771a123-44e2-495c-b407-95265c9ad648.png`,
  panels: `${HOST}hf_20260923_183030_6e7c2219-a3e6-42b3-8247-d8ebfdc5c0f5.png`,
  meridian_gallery: `${HOST}hf_20260923_183110_0dc36e9d-5468-495f-b694-5e5c83bd6c99.png`,
  fresh_market: `${HOST}hf_20260923_183030_e9083b25-ad6b-477c-a198-f19035e9b73b.png`,
};

/**
 * Where the floor is in the picture. Depth 0 is the near edge (the bottom of
 * the frame, where the door is), depth 1 is the far edge (the back wall). At
 * each depth the floor runs from `left(d)` to `right(d)` across the frame,
 * and a standing person is `scale(d)` of the frame's height tall.
 */
export interface SceneFloor {
  nearY: number;
  farY: number;
  nearLeft: number;
  nearRight: number;
  farLeft: number;
  farRight: number;
  nearScale: number;
  farScale: number;
}

const DEFAULT_FLOOR: SceneFloor = {
  nearY: 0.97,
  farY: 0.56,
  nearLeft: 0.0,
  nearRight: 1.0,
  farLeft: 0.2,
  farRight: 0.8,
  nearScale: 0.66,
  farScale: 0.3,
};

/** Rooms whose picture puts the floor somewhere other than the default. */
const FLOOR_OVERRIDES: Readonly<Partial<Record<SceneId, Partial<SceneFloor>>>> = {
  street: { farY: 0.62, farLeft: 0.3, farRight: 0.7, farScale: 0.22 },
  square: { farY: 0.6, farLeft: 0.25, farRight: 0.75, farScale: 0.24 },
  meridian_gallery: { farY: 0.58 },
  akai: { farY: 0.55, nearScale: 0.62 },
};

export function sceneFloor(id: SceneId): SceneFloor {
  return { ...DEFAULT_FLOOR, ...(FLOOR_OVERRIDES[id] ?? {}) };
}

export function sceneImage(id: SceneId): string {
  return SCENE_IMAGES[id];
}
