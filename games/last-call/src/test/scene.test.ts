import { describe, expect, it } from 'vitest';
import { INTERIORS } from '@/content/interiors';
import { SCENE_IMAGES, sceneFloor } from '@/content/scenes';
import { CUTOUTS } from '@/content/cutouts';
import { STRANGERS } from '@/content/strangers';
import { cameraShift, depthOf, project } from '@/engine/scene';
import { roomStrangers } from '@/engine/interior';
import { newTestGame } from '@/test/helpers';

describe('projecting a room onto its picture', () => {
  const bar = INTERIORS.neon_last_call;
  const floor = sceneFloor('neon_last_call');

  it('puts the door at the bottom of the frame and the back wall up the picture', () => {
    const door = project(bar, floor, bar.exit.x, bar.exit.y);
    const back = project(bar, floor, bar.exit.x, 2.2);
    expect(door.depth).toBeLessThan(0.2);
    expect(back.depth).toBeGreaterThan(0.95);
    expect(door.y).toBeGreaterThan(back.y);
    expect(door.scale).toBeGreaterThan(back.scale);
  });

  it('keeps everything inside the frame', () => {
    for (const def of Object.values(INTERIORS)) {
      const f = sceneFloor(def.venue);
      for (const station of def.stations) {
        const point = project(def, f, station.x, station.y);
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThan(0.3);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('narrows the floor with depth, so the far wall reads as far', () => {
    const leftNear = project(bar, floor, 0, bar.height);
    const leftFar = project(bar, floor, 0, 2);
    expect(leftFar.x).toBeGreaterThan(leftNear.x);
  });

  it('clamps depth to the floor', () => {
    expect(depthOf(bar, -5)).toBe(1);
    expect(depthOf(bar, 99)).toBe(0);
  });
});

describe('the camera', () => {
  it('does not move on a wide screen', () => {
    expect(cameraShift(0.9, 16 / 9)).toBe(0);
    expect(cameraShift(0.1, 2)).toBe(0);
  });

  it('follows the player on a phone without showing past the edges', () => {
    const portrait = 9 / 16;
    expect(cameraShift(0, portrait)).toBe(0);
    expect(cameraShift(0.5, portrait)).toBeCloseTo(0.5 - (portrait / (16 / 9)) / 2, 5);
    expect(cameraShift(1, portrait)).toBeCloseTo(1 - portrait / (16 / 9), 5);
  });
});

describe('the rendered art', () => {
  it('has a picture for every place, the street and the square', () => {
    for (const id of Object.keys(INTERIORS)) expect(SCENE_IMAGES[id as keyof typeof SCENE_IMAGES]).toMatch(/^https:/);
    expect(SCENE_IMAGES.street).toMatch(/^https:/);
    expect(SCENE_IMAGES.square).toMatch(/^https:/);
  });

  it('has a cutout for you, the leads and everyone who works or hangs about in a room', () => {
    expect(CUTOUTS.player_man).toMatch(/^https:/);
    expect(CUTOUTS.player_woman).toMatch(/^https:/);
    for (const id of ['sable', 'wren', 'nadia']) expect(CUTOUTS[id], id).toMatch(/^https:/);
    const game = newTestGame();
    for (const def of Object.values(INTERIORS)) {
      for (const person of roomStrangers(game, def.venue)) {
        expect(CUTOUTS[person.stranger.id], person.stranger.id).toMatch(/^https:/);
      }
    }
    const walkers = STRANGERS.filter((s) => s.role === 'walker');
    expect(walkers.length).toBeGreaterThan(0);
  });
});
