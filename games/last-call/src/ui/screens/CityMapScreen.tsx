import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CityDoor } from '@/content/city';
import type { GameState } from '@/types/game';
import {
  CITY_BUILDINGS,
  CITY_DOORS,
  CITY_HEIGHT,
  CITY_SPAWN,
  CITY_SURFACES,
  CITY_WALKERS,
  CITY_WIDTH,
  TILE,
} from '@/content/city';
import { getCharacter } from '@/content/characters';
import { DAY_LABELS, SLOT_LABELS, currentDay, currentSlot, slotsRemainingToday } from '@/engine/calendar';
import { energyReadout } from '@/state/selectors';
import { doorNear, doorState, lightLevel, step } from '@/engine/city';
import { useGameStore } from '@/state/gameStore';
import { characterLook, extraLook, playerLook } from '@/ui/art/looks';
import { drawCharacter, facingFrom, type Facing } from '@/ui/art/sprite';
import { Button } from '@/ui/components/Button';
import { Meter } from '@/ui/components/Meter';

const WIDTH = CITY_WIDTH * TILE;
const HEIGHT = CITY_HEIGHT * TILE;
const SPEED = 6.5; // tiles per second

/**
 * The camera shows a slice of the block rather than all of it, so the street
 * fills the screen and the door signs are readable. It sizes itself to
 * whatever space the panel has, follows the player, and stops at the edges of
 * the world.
 */
const TILES_ACROSS = 11;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SURFACE_COLOURS: Record<string, string> = {
  road: '#15131f',
  pavement: '#221f2e',
  plaza: '#272238',
  park: '#16241d',
  water: '#0b1626',
};

/** The static world, drawn once and blitted every frame. */
function paintWorld(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const surface of CITY_SURFACES) {
    ctx.fillStyle = SURFACE_COLOURS[surface.kind] ?? '#1a1826';
    ctx.fillRect(surface.x * TILE, surface.y * TILE, surface.w * TILE, surface.h * TILE);

    if (surface.kind === 'park') {
      ctx.fillStyle = 'rgba(120, 200, 140, 0.10)';
      for (let i = 0; i < 26; i += 1) {
        const px = (surface.x + ((i * 7) % surface.w)) * TILE + ((i * 13) % TILE);
        const py = (surface.y + ((i * 5) % surface.h)) * TILE + ((i * 11) % TILE);
        ctx.beginPath();
        ctx.arc(px, py, 5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (surface.kind === 'water') {
      ctx.strokeStyle = 'rgba(120, 190, 255, 0.16)';
      ctx.lineWidth = 1;
      for (let y = surface.y * TILE + 6; y < (surface.y + surface.h) * TILE; y += 9) {
        ctx.beginPath();
        ctx.moveTo(surface.x * TILE, y);
        ctx.lineTo((surface.x + surface.w) * TILE, y);
        ctx.stroke();
      }
    }
  }

  // Centre line down the main road.
  ctx.strokeStyle = 'rgba(255, 206, 107, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 14]);
  ctx.beginPath();
  ctx.moveTo(0, 15.5 * TILE);
  ctx.lineTo(WIDTH, 15.5 * TILE);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const building of CITY_BUILDINGS) {
    const x = building.x * TILE;
    const y = building.y * TILE;
    const w = building.w * TILE;
    const h = building.h * TILE;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + 4, y + 6, w, h);

    ctx.fillStyle = building.colour;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(x, y, w, 6);

    if (building.windows) {
      ctx.fillStyle = 'rgba(255, 214, 140, 0.55)';
      for (let wx = x + 8; wx < x + w - 8; wx += 16) {
        for (let wy = y + 14; wy < y + h - 8; wy += 14) {
          if ((wx + wy) % 3 === 0) continue;
          ctx.fillRect(wx, wy, 6, 7);
        }
      }
    }

    ctx.strokeStyle = 'rgba(154, 146, 184, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

export function CityMapScreen({ game }: { game: GameState }) {
  const { enterVenueFromMap, closeCity } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLCanvasElement | null>(null);
  const position = useRef({ ...CITY_SPAWN });
  const held = useRef<Record<string, boolean>>({});
  const stick = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // Which way you are pointing, and how far through a stride you are. Refs,
  // not state: they change every frame and nothing outside the canvas cares.
  const facing = useRef<Facing>('down');
  const walkPhase = useRef(0);
  const [near, setNear] = useState<CityDoor | null>(null);

  const energy = energyReadout(game);
  const light = lightLevel(game);
  const reduced = game.settings.reducedMotion;
  // Memoised: the frame loop lists it as a dependency, and a fresh object each
  // render would tear the loop down and restart it sixty times a second.
  const you = useMemo(
    () => playerLook(game.player.appearance, game.player.gender),
    [game.player.appearance, game.player.gender],
  );

  // Match the drawing surface to the space the layout gives it, so the map
  // fills a tall phone and a wide desktop equally well.
  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // The static layer is painted once; the loop only draws what moves.
  useEffect(() => {
    const world = document.createElement('canvas');
    world.width = WIDTH;
    world.height = HEIGHT;
    const ctx = world.getContext('2d');
    if (ctx) paintWorld(ctx);
    worldRef.current = world;
  }, []);

  const interact = useCallback(() => {
    const door = doorNear(position.current);
    if (!door) return;
    const state = doorState(game, door);
    if (door.venue && state.open) {
      enterVenueFromMap(door.venue);
      return;
    }
    setNear(door);
  }, [game, enterVenueFromMap]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      held.current[event.key.toLowerCase()] = true;
      if (['e', 'enter', ' '].includes(event.key.toLowerCase())) {
        event.preventDefault();
        interact();
      }
    };
    const up = (event: KeyboardEvent) => {
      held.current[event.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [interact]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;

    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += delta;

      const keys = held.current;
      let dx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
      let dy = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
      dx += stick.current.dx;
      dy += stick.current.dy;

      const length = Math.hypot(dx, dy);
      const walking = length > 0;
      if (walking) {
        const move = (SPEED * delta) / (length > 1 ? length : 1);
        position.current = step(position.current, dx * move, dy * move);
        facing.current = facingFrom(dx, dy, facing.current);
        // Two strides a second at full tilt, tied to real time rather than
        // frame count so the gait matches the speed on any refresh rate.
        walkPhase.current = (walkPhase.current + delta * 2) % 1;
      }

      const canvas = canvasRef.current;
      const world = worldRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && world && ctx) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cssWidth = canvas.width / dpr;
        const cssHeight = canvas.height / dpr;
        const zoom = Math.max(1, cssWidth / (TILES_ACROSS * TILE));
        const viewW = cssWidth / zoom;
        const viewH = cssHeight / zoom;

        const camX = clamp(position.current.x * TILE - viewW / 2, 0, Math.max(0, WIDTH - viewW));
        const camY = clamp(position.current.y * TILE - viewH / 2, 0, Math.max(0, HEIGHT - viewH));

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.fillStyle = '#07060f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * dpr * zoom, -camY * dpr * zoom);
        ctx.drawImage(world, 0, 0);

        // Night tint, painted over the world and under the people.
        if (light < 1) {
          ctx.fillStyle = `rgba(8, 6, 20, ${(1 - light) * 0.72})`;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        for (const door of CITY_DOORS) {
          const state = doorState(game, door);
          const glow = door.venue ? (state.open ? '#ff5fa8' : '#5a4a68') : '#4fd6ff';
          const radius = door.venue && state.open ? 14 : 9;
          const pulse = reduced ? 1 : 1 + Math.sin(elapsed * 2.2) * 0.12;

          const gradient = ctx.createRadialGradient(
            door.x * TILE,
            door.y * TILE,
            2,
            door.x * TILE,
            door.y * TILE,
            radius * pulse,
          );
          gradient.addColorStop(0, `${glow}cc`);
          gradient.addColorStop(1, `${glow}00`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(door.x * TILE, door.y * TILE, radius * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = state.open || !door.venue ? '#f2eefc' : '#7a7296';
          ctx.font = '700 9px "DM Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(door.label, door.x * TILE, door.y * TILE - 13);

          // Who is in there tonight.
          state.inside.forEach((id, index) => {
            const character = getCharacter(id);
            const sway = reduced ? 0 : Math.sin(elapsed * 1.1 + index) * 0.5 + 0.5;
            drawCharacter(
              ctx,
              (door.x + (index - (state.inside.length - 1) / 2) * 1.2) * TILE,
              (door.y - 1.1) * TILE,
              characterLook(character),
              { facing: 'down', phase: sway, moving: false, scale: 0.92 },
            );
          });
        }

        CITY_WALKERS.forEach((walker, index) => {
          const along = reduced ? 0.5 : (Math.sin(elapsed * walker.speed * 0.5) + 1) / 2;
          const wx = walker.from.x + (walker.to.x - walker.from.x) * along;
          const wy = walker.from.y + (walker.to.y - walker.from.y) * along;
          // They turn around at the ends of their route, so their facing comes
          // from which way the sine is currently carrying them.
          const heading = Math.cos(elapsed * walker.speed * 0.5);
          const toward = facingFrom(
            (walker.to.x - walker.from.x) * heading,
            (walker.to.y - walker.from.y) * heading,
            'down',
          );
          drawCharacter(ctx, wx * TILE, wy * TILE, extraLook(index, walker.colour), {
            facing: toward,
            phase: reduced ? 0 : (elapsed * walker.speed * 0.9) % 1,
            moving: !reduced,
            scale: 0.86,
          });
        });

        drawCharacter(ctx, position.current.x * TILE, position.current.y * TILE, you, {
          facing: facing.current,
          phase: walkPhase.current,
          moving: walking,
          scale: 1.06,
          highlight: true,
        });
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [game, light, reduced, you]);

  // What the player is standing next to, polled gently rather than per frame.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const door = doorNear(position.current);
      setNear((current) => (current?.id === door?.id ? current : door));
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const nearState = near ? doorState(game, near) : null;

  const setStick = (dx: number, dy: number) => {
    stick.current = { dx, dy };
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-3 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">The block</h1>
          <p className="text-xs text-ink-500">
            Week {game.clock.week} · {DAY_LABELS[currentDay(game.clock)]} ·{' '}
            {SLOT_LABELS[currentSlot(game.clock)].toLowerCase()} · {slotsRemainingToday(game.clock)} slot
            {slotsRemainingToday(game.clock) === 1 ? '' : 's'} left
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg leading-none text-gold-400">${game.player.money}</p>
          <div className="mt-1.5 w-24">
            <Meter
              value={energy.current}
              max={energy.max}
              tone={energy.current < 25 ? 'bg-alarm-400' : 'bg-glow-500'}
              label="Energy"
              trailing={`${energy.current}`}
              compact
            />
          </div>
        </div>
      </header>

      <div ref={frameRef} className="panel min-h-[42vh] flex-1 overflow-hidden rounded-2xl">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <div className="min-h-[4.5rem] rounded-2xl border border-ink-500/20 bg-night-850/70 p-3">
        {nearState ? (
          <>
            <p className="font-display text-sm font-semibold">{nearState.door.label}</p>
            {nearState.door.venue ? (
              <p className="text-xs text-ink-500">
                {nearState.open
                  ? nearState.inside.length > 0
                    ? `${nearState.inside.map((id) => getCharacter(id).name).join(' and ')} inside.`
                    : 'Open. Quiet, by the look of it.'
                  : nearState.reason}
              </p>
            ) : (
              <p className="text-xs italic text-ink-500">{nearState.door.line}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-ink-600">
            Walk with the pad, or the arrow keys. Doors glow pink when they are open.
          </p>
        )}
      </div>

      <div className="safe-bottom mt-auto flex items-end justify-between gap-4">
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
          {([
            ['', 'up', ''],
            ['left', '', 'right'],
            ['', 'down', ''],
          ] as const).flat().map((direction, index) =>
            direction === '' ? (
              <span key={index} />
            ) : (
              <button
                key={index}
                aria-label={direction}
                onPointerDown={() =>
                  setStick(
                    direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
                    direction === 'up' ? -1 : direction === 'down' ? 1 : 0,
                  )
                }
                onPointerUp={() => setStick(0, 0)}
                onPointerLeave={() => setStick(0, 0)}
                onPointerCancel={() => setStick(0, 0)}
                className="tap h-12 w-12 rounded-xl border border-ink-500/25 bg-night-800/80 text-ink-300"
              >
                {direction === 'up' ? '^' : direction === 'down' ? 'v' : direction === 'left' ? '<' : '>'}
              </button>
            ),
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button variant="quiet" onClick={closeCity}>
            Things to do
          </Button>
          <button
            onClick={interact}
            disabled={!near}
            className="tap h-16 w-16 rounded-full border border-neon-400 bg-neon-500/90 text-xs font-bold text-night-950 disabled:border-night-600 disabled:bg-night-700 disabled:text-ink-600"
          >
            {near?.venue ? 'ENTER' : 'LOOK'}
          </button>
        </div>
      </div>
    </main>
  );
}
