import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { GameState } from '@/types/game';
import type { InteriorDef, InteriorProp } from '@/content/interiors';
import type { InteriorId } from '@/content/city';
import type { Facing } from '@/ui/art/sprite';
import type { CharacterLook } from '@/ui/art/sprite';
import { sceneFloor, sceneImage } from '@/content/scenes';
import { cutoutFor, playerCutout } from '@/content/cutouts';
import { getCharacter } from '@/content/characters';
import { cameraShift, project, type ScenePoint } from '@/engine/scene';
import { roomPeople, roomStrangers } from '@/engine/interior';
import { characterLook, playerLook, strangerLook } from '@/ui/art/looks';
import { drawCharacter } from '@/ui/art/sprite';
import { useGameStore } from '@/state/gameStore';

/**
 * A room, played inside its picture.
 *
 * The rendered scene fills the frame; the room's floor plan is projected onto
 * it in perspective (see engine/scene). People are full-length cutouts
 * standing at their stations; you are one too, and the layer slides sideways
 * on a phone so you stay in view. Nothing here decides anything — proximity,
 * collision and who is in the room are the same functions the drawn room
 * used — this only shows it.
 *
 * The player and the speech bubbles move every frame, so they are updated
 * straight on the DOM from a requestAnimationFrame loop rather than through
 * React state; everyone else stands still and renders once.
 */

interface Standing {
  key: string;
  cutout: string | null;
  look: CharacterLook;
  point: ScenePoint;
  facing: Facing;
}

const SCENE_ASPECT = 16 / 9;

/** A person: the generated cutout, or the drawn sprite if it will not load. */
function Cutout({
  cutout,
  look,
  facing,
  heightPx,
  className,
}: {
  cutout: string | null;
  look: CharacterLook;
  facing: Facing;
  heightPx: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flip = facing === 'left';

  useEffect(() => {
    if (cutout && !broken) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(24, heightPx * 0.6);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(heightPx * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The drawn sprite is about 46px tall at scale 1; fit it to the height.
    const scale = heightPx / 46;
    drawCharacter(ctx, w / 2, heightPx - 2, look, {
      facing: facing === 'left' || facing === 'right' ? facing : 'down',
      phase: 0,
      moving: false,
      scale,
    });
  }, [cutout, broken, look, facing, heightPx]);

  if (cutout && !broken) {
    return (
      <img
        src={cutout}
        alt=""
        draggable={false}
        onError={() => setBroken(true)}
        className={className}
        style={{ height: heightPx, width: 'auto', transform: flip ? 'scaleX(-1)' : undefined }}
      />
    );
  }
  return <canvas ref={canvasRef} className={className} style={{ height: heightPx, width: heightPx * 0.6 }} />;
}

export function SceneView({
  game,
  interior,
  room,
  positionRef,
  facingRef,
  walkingRef,
}: {
  game: GameState;
  interior: InteriorId;
  room: InteriorDef;
  positionRef: MutableRefObject<{ x: number; y: number }>;
  facingRef: MutableRefObject<Facing>;
  walkingRef: MutableRefObject<boolean>;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const mineRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [playerFacing, setPlayerFacing] = useState<Facing>('down');
  const [imageBroken, setImageBroken] = useState(false);
  const smallTalk = useGameStore((store) => store.smallTalk);
  const encounter = useGameStore((store) => store.encounter);
  const streetTalk = useGameStore((store) => store.streetTalk);
  const reduced = game.settings.reducedMotion;
  const floor = sceneFloor(interior);
  const image = sceneImage(interior);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const rect = frame.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const layerW = size.h * SCENE_ASPECT;
  const you = playerLook(game.player.appearance, game.player.gender);
  const yourCutout = playerCutout(game.player.gender);

  // Everyone standing in the room, projected once.
  const standing: Standing[] = [
    ...roomPeople(game, interior).map((person) => ({
      key: `lead:${person.characterId}`,
      cutout: cutoutFor(person.characterId),
      look: characterLook(getCharacter(person.characterId)),
      point: project(room, floor, person.x, person.y),
      facing: person.facing,
    })),
    ...roomStrangers(game, interior).map((person) => ({
      key: `stranger:${person.stranger.id}`,
      cutout: cutoutFor(person.stranger.id),
      look: strangerLook(person.stranger),
      point: project(room, floor, person.x, person.y),
      facing: person.facing,
    })),
  ];

  const chattingWith = smallTalk
    ? standing.find((person) => person.key === `stranger:${smallTalk.strangerId}`)
    : undefined;
  const talkingTo = streetTalk
    ? standing.find((person) => person.key === `lead:${streetTalk.characterId}`)
    : undefined;

  // The player, the camera and your bubble, every frame.
  useEffect(() => {
    let frame = 0;
    let lastFacing: Facing = facingRef.current;
    const tick = () => {
      const layer = layerRef.current;
      const player = playerRef.current;
      if (layer && player && size.h > 0) {
        const { x, y } = positionRef.current;
        const point = project(room, floor, x, y);
        const heightPx = point.scale * size.h;
        player.style.left = `${point.x * 100}%`;
        player.style.top = `${point.y * 100}%`;
        player.style.zIndex = `${Math.round((1 - point.depth) * 100) + 10}`;
        player.style.setProperty('--h', `${heightPx}px`);
        player.classList.toggle('scene-walk', walkingRef.current && !reduced);
        const shift = cameraShift(point.x, size.w / size.h, SCENE_ASPECT);
        layer.style.transform = `translateX(${-shift * layerW}px)`;
        if (facingRef.current !== lastFacing) {
          lastFacing = facingRef.current;
          setPlayerFacing(lastFacing);
        }
        const mine = mineRef.current;
        if (mine) {
          mine.style.left = `${point.x * 100}%`;
          mine.style.top = `${(point.y - point.scale) * 100}%`;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [room, floor, size, layerW, positionRef, facingRef, walkingRef, reduced]);

  const exit = project(room, floor, room.exit.x, room.exit.y);
  const fixtures = room.props.filter((prop): prop is InteriorProp & { label: string } => Boolean(prop.label && (prop.action || prop.line)));
  const pop = reduced ? '' : 'bubble-pop';
  const said = smallTalk
    ? (smallTalk.pending ?? [...smallTalk.beats].reverse().find((beat) => beat.speaker === 'you')?.text ?? null)
    : null;

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden bg-night-950">
      <div
        ref={layerRef}
        className="absolute top-0 bottom-0 left-0 will-change-transform"
        style={{ width: layerW || '100%' }}
      >
        {!imageBroken ? (
          <img
            src={image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-fill"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(${room.palette.wall}, ${room.palette.trim})` }}
          />
        )}
        {/* A faint floor, so the picture reads as somewhere you can walk when
            it has not loaded, and never when it has. */}
        {imageBroken && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${(1 - floor.farY) * 100}%`,
              background: 'linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.12))',
            }}
          />
        )}

        {/* The way out. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-glow-400/60 bg-glow-500/20 px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-glow-400"
          style={{ left: `${exit.x * 100}%`, top: `${exit.y * 100}%`, zIndex: 5 }}
        >
          Out
        </div>

        {/* Things you can use, marked where the plan puts them. */}
        {fixtures.map((prop) => {
          const point = project(room, floor, prop.x + prop.w / 2, prop.y + prop.h / 2);
          return (
            <div
              key={`${prop.kind}:${prop.x}:${prop.y}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-ink-500/40 bg-night-950/60 px-1.5 py-0.5 text-[0.55rem] text-ink-300"
              style={{ left: `${point.x * 100}%`, top: `${(point.y - 0.02) * 100}%`, zIndex: 4, opacity: 0.85 }}
            >
              {prop.action ? '◆ ' : ''}
              {prop.label}
            </div>
          );
        })}

        {/* Everyone else, standing where they belong. */}
        {standing.map((person) => (
          <div
            key={person.key}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${person.point.x * 100}%`,
              top: `${person.point.y * 100}%`,
              zIndex: Math.round((1 - person.point.depth) * 100) + 10,
            }}
          >
            <Cutout cutout={person.cutout} look={person.look} facing={person.facing} heightPx={person.point.scale * size.h} className="block select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]" />
          </div>
        ))}

        {/* Their bubble, over their head, the moment they say something. */}
        {smallTalk && chattingWith && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${chattingWith.point.x * 100}%`,
              top: `${(chattingWith.point.y - chattingWith.point.scale) * 100}%`,
              zIndex: 200,
            }}
          >
            {smallTalk.busy ? (
              <div className="relative mb-2 rounded-2xl rounded-bl-sm border border-ink-500/30 bg-night-850/90 px-3 py-2">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-ink-300" style={{ animationDelay: `${dot * 0.16}s` }} />
                  ))}
                </span>
              </div>
            ) : (
              <div key={smallTalk.line} className={`relative mb-2 w-max max-w-[38vw] rounded-2xl rounded-bl-sm border border-ink-500/30 bg-night-850/95 px-3 py-2 text-xs leading-snug text-ink-100 ${pop}`} style={{ transformOrigin: 'left bottom' }}>
                {smallTalk.line}
              </div>
            )}
          </div>
        )}
        {talkingTo && encounter && !encounter.busy && encounter.outcome !== 'you_left' && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${talkingTo.point.x * 100}%`,
              top: `${(talkingTo.point.y - talkingTo.point.scale) * 100}%`,
              zIndex: 200,
            }}
          >
            <div key={encounter.line} className={`relative mb-2 w-max max-w-[38vw] rounded-2xl rounded-bl-sm border border-neon-400/40 bg-night-850/95 px-3 py-2 text-xs leading-snug text-ink-100 ${pop}`} style={{ transformOrigin: 'left bottom' }}>
              {encounter.line}
            </div>
          </div>
        )}

        {/* You. */}
        <div ref={playerRef} className="scene-player absolute -translate-x-1/2 -translate-y-full" style={{ zIndex: 50 }}>
          <div className="scene-player-body">
            <Cutout cutout={yourCutout} look={you} facing={playerFacing} heightPx={size.h * 0.5} className="block select-none drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)]" />
          </div>
          <div className="absolute inset-x-0 -bottom-1 mx-auto h-2 w-1/2 rounded-full bg-neon-500/40 blur-sm" />
        </div>

        {/* Your line, the instant you say it. */}
        {said && smallTalk && (
          <div ref={mineRef} className="absolute -translate-x-1/2 -translate-y-full" style={{ zIndex: 201 }}>
            <div key={said} className={`relative mb-2 w-max max-w-[38vw] rounded-2xl rounded-br-sm border border-neon-400/40 bg-neon-500/15 px-3 py-2 text-xs leading-snug text-ink-100 ${pop}`} style={{ transformOrigin: 'right bottom' }}>
              {said}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
