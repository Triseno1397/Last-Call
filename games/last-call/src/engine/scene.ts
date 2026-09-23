/**
 * Standing inside a picture.
 *
 * A room is still its floor plan — tiles, furniture, stations — and the
 * player still walks it in tile coordinates with the same collision as
 * before. What changes is how it is shown: the plan is projected onto a
 * rendered image of the room, in perspective, so a person at the back of the
 * plan stands small by the counter at the back of the picture and a person
 * by the door stands large at the bottom of the frame.
 *
 * Pure functions, so the projection can be tested without a browser.
 */
import type { InteriorDef } from '@/content/interiors';
import type { SceneFloor } from '@/content/scenes';

export interface ScenePoint {
  /** Fraction of the frame's width, 0 at the left edge. */
  x: number;
  /** Fraction of the frame's height, 0 at the top; where the feet are. */
  y: number;
  /** A standing person's height as a fraction of the frame's height. */
  scale: number;
  /** 0 at the door, 1 at the back wall. */
  depth: number;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * The plan's y runs from the wall band (row 2) at the back to the last row at
 * the front; depth is that, normalised and flipped.
 */
export function depthOf(room: Pick<InteriorDef, 'height'>, tileY: number): number {
  const top = 2;
  const bottom = room.height;
  return clamp01(1 - (tileY - top) / (bottom - top));
}

/** Where a tile of the plan lands in the picture. */
export function project(
  room: Pick<InteriorDef, 'width' | 'height'>,
  floor: SceneFloor,
  tileX: number,
  tileY: number,
): ScenePoint {
  const depth = depthOf(room, tileY);
  const across = clamp01(tileX / room.width);
  const left = lerp(floor.nearLeft, floor.farLeft, depth);
  const right = lerp(floor.nearRight, floor.farRight, depth);
  return {
    x: lerp(left, right, across),
    y: lerp(floor.nearY, floor.farY, depth),
    scale: lerp(floor.nearScale, floor.farScale, depth),
    depth,
  };
}

/**
 * The picture is wider than a phone. The scene layer is as tall as the frame
 * and 16:9, and slides sideways so the player stays in view; this is how far
 * it slides, in fractions of the layer's width, clamped so the edges of the
 * picture never show.
 */
export function cameraShift(playerX: number, frameAspect: number, sceneAspect = 16 / 9): number {
  if (frameAspect >= sceneAspect) return 0;
  const visible = frameAspect / sceneAspect;
  const shift = playerX - visible / 2;
  return Math.max(0, Math.min(1 - visible, shift));
}
