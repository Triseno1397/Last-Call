import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CityDoor } from '@/content/city';
import type { GameState } from '@/types/game';
import { CITY_DOORS, CITY_HEIGHT, CITY_WALKERS, CITY_WIDTH, TILE } from '@/content/city';
import type { CharacterId } from '@/content/ids';
import { getCharacter } from '@/content/characters';
import { VENUES } from '@/content/venues';
import { DAY_LABELS, SLOT_LABELS, currentDay, currentSlot, slotsRemainingToday } from '@/engine/calendar';
import { energyReadout } from '@/state/selectors';
import type { StreetPerson } from '@/engine/city';
import type { CityProp, InteriorId } from '@/content/city';
import type { InteriorProp } from '@/content/interiors';
import {
  doorNear,
  doorState,
  lightLevel,
  peopleOnStreet,
  personNear,
  step,
  streetPropNear,
} from '@/engine/city';
import {
  atExit,
  interiorFor,
  interiorStep,
  isVenue,
  propNear,
  roomPeople,
  roomPersonNear,
} from '@/engine/interior';
import { paintRoom } from '@/ui/art/room';
import { paintLampLight, paintStreet } from '@/ui/art/street';
import { readComfort, readInterest, meterVisibility } from '@/engine/awareness';
import { drawMeterPanel } from '@/ui/art/bubble';
import { useGameStore } from '@/state/gameStore';
import { characterLook, extraLook, playerLook } from '@/ui/art/looks';
import { drawCharacter, facingFrom, type Facing } from '@/ui/art/sprite';
import { drawSpeechBubble, drawThinking } from '@/ui/art/bubble';
import { TalkBar } from '@/ui/components/TalkBar';
import { ChatBar } from '@/ui/components/ChatBar';
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
/**
 * Sixteen tiles across. Eleven put the characters at a good size but showed a
 * corridor; sixteen shows a street — the shop opposite, the corner, who is
 * coming — and the characters are still a comfortable 45px on a phone.
 */
const TILES_ACROSS = 16;

/** What to call the room you are in, and how to describe it. */
const PLACE_INFO: Readonly<Record<string, { name: string; blurb: string }>> = {
  copper_kettle: {
    name: 'Copper Kettle',
    blurb: 'Coffee that takes itself seriously and a window seat that does not.',
  },
  static_records: {
    name: 'Static',
    blurb: 'Crates to dig through, one listening post, and a staff pick you will not agree with.',
  },
};

function roomInfo(id: InteriorId): { name: string; blurb: string } {
  if (isVenue(id)) return { name: VENUES[id].name, blurb: VENUES[id].blurb };
  return PLACE_INFO[id] ?? { name: id, blurb: '' };
}

/** How far above a character's feet the top of their head sits, at scale 1. */
const HEAD_TOP = 34;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function CityMapScreen({ game }: { game: GameState }) {
  const {
    enterVenueFromMap,
    closeCity,
    talkOnStreet,
    setCityPosition,
    setInteriorPosition,
    leaveInterior,
    enterPlace,
  } = useGameStore();
  const interior = useGameStore((store) => store.interior);
  const smallTalk = useGameStore((store) => store.smallTalk);
  const talkToStranger = useGameStore((store) => store.talkToStranger);
  const encounter = useGameStore((store) => store.encounter);
  const streetTalk = useGameStore((store) => store.streetTalk);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLCanvasElement | null>(null);
  const room = interior ? interiorFor(interior) : null;
  const worldW = room ? room.width * TILE : WIDTH;
  const worldH = room ? room.height * TILE : HEIGHT;
  const position = useRef(
    room
      ? { ...useGameStore.getState().interiorPosition }
      : { ...useGameStore.getState().cityPosition },
  );
  const held = useRef<Record<string, boolean>>({});
  const stick = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // Which way you are pointing, and how far through a stride you are. Refs,
  // not state: they change every frame and nothing outside the canvas cares.
  const facing = useRef<Facing>('down');
  const walkPhase = useRef(0);
  const talkRef = useRef<{ person: StreetPerson | null; encounter: typeof encounter }>({
    person: null,
    encounter: null,
  });
  talkRef.current = { person: streetTalk, encounter };
  /** Where each passer-by is this frame, written by the loop and read by the
   *  proximity check so the two never disagree about who you are next to. */
  const walkerSpots = useRef<{ index: number; x: number; y: number }[]>([]);
  const smallTalkRef = useRef(smallTalk);
  smallTalkRef.current = smallTalk;
  /** The passer-by you are mid-sentence with, pinned where they stopped. A
   *  walker who keeps pacing walks out from under their own speech bubble. */
  const frozenWalker = useRef<{ index: number; x: number; y: number } | null>(null);
  const [near, setNear] = useState<CityDoor | null>(null);
  const [nearPerson, setNearPerson] = useState<StreetPerson | null>(null);
  // What is within reach indoors: someone to talk to, or the way out.
  const [nearWalker, setNearWalker] = useState<number | null>(null);
  /** Street furniture with a line, within reach. Its line shows on approach —
   *  nobody should need a button to read a bench. */
  const [nearProp, setNearProp] = useState<CityProp | null>(null);
  const [nearRoomProp, setNearRoomProp] = useState<InteriorProp | null>(null);
  const [indoor, setIndoor] = useState<{ characterId: string | null; exit: boolean }>({
    characterId: null,
    exit: false,
  });

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

  // Remember where we stopped, so coming back from a venue or a summary does
  // not teleport the player to the spawn point.
  useEffect(
    () => () => {
      if (interior) setInteriorPosition({ ...position.current });
      else setCityPosition({ ...position.current });
    },
    [interior, setCityPosition, setInteriorPosition],
  );

  // Walking through a door swaps which world we are standing in, so the player
  // restarts at that world's own entry point rather than keeping street
  // coordinates that mean nothing indoors.
  useEffect(() => {
    position.current = room
      ? { ...useGameStore.getState().interiorPosition }
      : { ...useGameStore.getState().cityPosition };
    facing.current = 'up';
  }, [interior, room]);

  // The static layer is painted once; the loop only draws what moves.
  useEffect(() => {
    const world = document.createElement('canvas');
    world.width = worldW;
    world.height = worldH;
    const ctx = world.getContext('2d');
    if (ctx) {
      if (room) paintRoom(ctx, room);
      else paintStreet(ctx);
    }
    worldRef.current = world;
  }, [room, worldW, worldH]);

  const interact = useCallback(() => {
    if (room && interior) {
      const inRoom = roomPersonNear(roomPeople(game, interior), position.current);
      if (inRoom) {
        void talkOnStreet({
          characterId: inRoom.characterId,
          venueId: inRoom.venueId,
          x: inRoom.x,
          y: inRoom.y,
        });
        return;
      }
      if (atExit(room, position.current)) leaveInterior();
      return;
    }

    // A passer-by is the simplest case: nobody else competes for them, because
    // they are only ever offered when nothing nearer is in reach.
    if (nearWalker !== null && !nearPerson && !near?.venue && !near?.place) {
      talkToStranger(nearWalker);
      return;
    }

    // Whichever is nearer wins. Preferring people unconditionally made a door
    // unusable whenever one of them was standing outside it.
    const person = personNear(peopleOnStreet(game), position.current);
    const door = doorNear(position.current);
    const toPerson = person
      ? Math.hypot(person.x - position.current.x, person.y - position.current.y)
      : Infinity;
    const toDoor = door
      ? Math.hypot(door.x - position.current.x, door.y - position.current.y)
      : Infinity;

    if (person && toPerson <= toDoor) {
      void talkOnStreet(person);
      return;
    }
    if (!door) return;
    if (door.place) {
      enterPlace(door.place);
      return;
    }
    const state = doorState(game, door);
    if (door.venue && state.open) {
      enterVenueFromMap(door.venue);
      return;
    }
    setNear(door);
  }, [
    game,
    room,
    interior,
    near,
    nearPerson,
    nearWalker,
    enterVenueFromMap,
    enterPlace,
    talkOnStreet,
    talkToStranger,
    leaveInterior,
  ]);

  useEffect(() => {
    // Keys typed into a text box belong to the text box. Without this, a
    // space in the chat field was swallowed as "interact" and the arrow keys
    // steered the player while you edited a sentence.
    const typing = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const down = (event: KeyboardEvent) => {
      if (typing(event)) return;
      const key = event.key.toLowerCase();
      held.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        // Arrow keys and space scroll the page by default; the game owns them.
        event.preventDefault();
      }
      if (['e', 'enter', ' '].includes(key) && !event.repeat) {
        interact();
      }
    };
    const up = (event: KeyboardEvent) => {
      held.current[event.key.toLowerCase()] = false;
    };
    // A key held when the window loses focus never sends its keyup; the
    // player would keep walking into a wall until it was pressed again.
    const release = () => {
      held.current = {};
      stick.current = { dx: 0, dy: 0 };
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
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

      if (talkRef.current.person || smallTalkRef.current) {
        dx = 0;
        dy = 0;
      }
      const length = Math.hypot(dx, dy);
      const walking = length > 0;
      if (walking) {
        const move = (SPEED * delta) / (length > 1 ? length : 1);
        position.current = room
          ? interiorStep(room, position.current, dx * move, dy * move)
          : step(position.current, dx * move, dy * move);
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
        // A room is a fraction of the street's size, so it gets a tighter
        // camera: the whole room across the screen, rather than the room
        // floating small in a field of wall.
        const across = room ? Math.min(TILES_ACROSS, Math.max(12, room.width + 1)) : TILES_ACROSS;
        const zoom = Math.max(1, cssWidth / (across * TILE));
        const viewW = cssWidth / zoom;
        const viewH = cssHeight / zoom;

        // A room can be smaller than the viewport. Clamping to zero then pins
        // it to the top-left with no sky above anyone's head; centring it
        // instead keeps the bubbles and meters on screen.
        const camX =
          worldW <= viewW
            ? (worldW - viewW) / 2
            : clamp(position.current.x * TILE - viewW / 2, 0, worldW - viewW);
        // Talking stacks a meter panel and two bubbles above head height, so
        // the camera drops the pair down the frame to leave room for the lot.
        const headroom = talkRef.current.person ? 5.6 * TILE : smallTalkRef.current ? 3.4 * TILE : 0;
        const camY =
          worldH <= viewH
            ? (worldH - viewH) / 2 - headroom * 0.6
            : clamp(position.current.y * TILE - viewH / 2 - headroom, 0, worldH - viewH);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.fillStyle = '#07060f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * dpr * zoom, -camY * dpr * zoom);
        ctx.drawImage(world, 0, 0);

        // Night tint, painted over the world and under the people.
        if (light < 1 && !room) {
          ctx.fillStyle = `rgba(8, 6, 20, ${(1 - light) * 0.72})`;
          ctx.fillRect(0, 0, worldW, worldH);
          paintLampLight(ctx, 1 - light);
        }

        if (!room) {
        for (const door of CITY_DOORS) {
          const state = doorState(game, door);
          const glow = door.venue
            ? state.open
              ? '#ff5fa8'
              : '#5a4a68'
            : door.place
              ? '#ffce6b'
              : '#4fd6ff';
          const radius = (door.venue && state.open) || door.place ? 14 : 9;
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
            const talkingToHer = talkRef.current.person?.characterId === id;
            drawCharacter(
              ctx,
              (door.x + (index - (state.inside.length - 1) / 2) * 1.2) * TILE,
              (door.y - 1.1) * TILE,
              characterLook(character),
              {
                facing: 'down',
                phase: sway,
                moving: false,
                scale: 0.92,
                ...(talkingToHer && talkRef.current.encounter
                  ? { expression: talkRef.current.encounter.expression }
                  : {}),
              },
            );
          });
        }

        const chatting = smallTalkRef.current;
        if (!chatting) frozenWalker.current = null;

        walkerSpots.current = [];
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
          // Whoever you stopped stays stopped until the conversation ends.
          const stopped = chatting?.walkerIndex === index;
          if (stopped && !frozenWalker.current) {
            frozenWalker.current = { index, x: wx, y: wy };
          }
          const pinned = stopped ? frozenWalker.current : null;
          const px = pinned ? pinned.x : wx;
          const py = pinned ? pinned.y : wy;

          walkerSpots.current.push({ index, x: px, y: py });
          drawCharacter(ctx, px * TILE, py * TILE, extraLook(index, walker.colour), {
            facing: pinned
              ? facingFrom(position.current.x - px, position.current.y - py, 'down')
              : toward,
            phase: reduced || pinned ? 0 : (elapsed * walker.speed * 0.9) % 1,
            moving: !reduced && !pinned,
            scale: 0.86,
          });
        });
        } else if (interior) {
          for (const person of roomPeople(game, interior)) {
            const talkingToHer = talkRef.current.person?.characterId === person.characterId;
            drawCharacter(
              ctx,
              person.x * TILE,
              person.y * TILE,
              characterLook(getCharacter(person.characterId)),
              {
                facing: person.facing,
                phase: 0,
                moving: false,
                scale: 0.96,
                ...(talkingToHer && talkRef.current.encounter
                  ? { expression: talkRef.current.encounter.expression }
                  : {}),
              },
            );
          }
        }

        drawCharacter(ctx, position.current.x * TILE, position.current.y * TILE, you, {
          facing: facing.current,
          phase: walkPhase.current,
          moving: walking,
          scale: 1.06,
          highlight: true,
        });

        // The conversation happens here, over the street, rather than on a
        // screen of its own: her line above her head, yours above yours.
        const chat = smallTalkRef.current;
        if (chat) {
          const spot = walkerSpots.current.find((entry) => entry.index === chat.walkerIndex);
          if (spot) {
            const theirTop = spot.y * TILE - HEAD_TOP * 0.86;
            const mine = [...chat.beats].reverse().find((beat) => beat.speaker === 'you');
            const apart = Math.abs(spot.x - position.current.x) < 5;
            const tilt = apart ? (spot.x >= position.current.x ? 14 : -14) : 0;
            let height = 0;
            if (chat.busy) {
              drawThinking(ctx, spot.x * TILE + tilt, theirTop, elapsed);
              height = 20;
            } else {
              height = drawSpeechBubble(ctx, spot.x * TILE + tilt, theirTop, chat.line, {
                tone: 'thought',
                maxWidth: 94,
              });
            }
            if (mine) {
              drawSpeechBubble(
                ctx,
                position.current.x * TILE - tilt,
                position.current.y * TILE - HEAD_TOP * 1.06 - (apart ? height + 3 : 0),
                mine.text,
                { tone: 'you', maxWidth: 82 },
              );
            }
          }
        }

        const talk = talkRef.current;
        if (talk.person && talk.encounter) {
          const herX = talk.person.x * TILE;
          const youX = position.current.x * TILE;
          const herTop = talk.person.y * TILE - HEAD_TOP * 0.92;
          const yourTop = position.current.y * TILE - HEAD_TOP * 1.06;
          const mine = [...talk.encounter.beats].reverse().find((beat) => beat.speaker === 'you');

          // Standing face to face puts two bubbles in the same patch of sky.
          // Lean them apart, and stack yours above hers rather than through it.
          const close = Math.abs(herX - youX) < 5 * TILE;
          const lean = close ? (herX >= youX ? 14 : -14) : 0;

          // What you can read off her, floated over her head. Awareness decides
          // how much of it is legible; the panel is always there.
          const visibility = meterVisibility(game.player, game.settings.alwaysShowMeters);
          const interestRead = readInterest(
            talk.encounter.interest,
            talk.encounter.lastInterestDelta,
            visibility,
          );
          const comfortRead = readComfort(
            talk.encounter.comfort,
            talk.encounter.lastComfortDelta,
            visibility,
          );

          let herHeight = 0;
          if (talk.encounter.busy) {
            drawThinking(ctx, herX + lean, herTop, elapsed);
            herHeight = 20;
          } else if (talk.encounter.outcome !== 'you_left') {
            herHeight = drawSpeechBubble(ctx, herX + lean, herTop, talk.encounter.line, {
              tone: 'her',
              maxWidth: 94,
            });
          }

          drawMeterPanel(ctx, herX + lean, herTop - herHeight - 3, {
            interestLabel: interestRead.label,
            interestSegments: interestRead.segments,
            interestValue: interestRead.value,
            interestDelta: interestRead.delta,
            comfortLabel: comfortRead.label,
            comfortSegments: comfortRead.segments,
            comfortValue: comfortRead.value,
            comfortDelta: comfortRead.delta,
            mood: talk.encounter.mood,
          });

          if (mine) {
            const lift = close ? herHeight + 36 : 0;
            drawSpeechBubble(ctx, youX - lean, yourTop - lift, mine.text, {
              tone: 'you',
              maxWidth: 82,
            });
          }
        }
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  // `room` and the world size are deliberately here: the loop closes over
  // them for collision and the camera, and a loop that kept the street's
  // collision after you walked into a café left you stuck in a wall.
  }, [game, light, reduced, you, room, interior, worldW, worldH]);

  // What the player is standing next to, polled gently rather than per frame.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (room && interior) {
        const person = roomPersonNear(roomPeople(game, interior), position.current);
        const exit = atExit(room, position.current);
        const fixture = propNear(room, position.current);
        setNearRoomProp((current) => (current === fixture ? current : fixture));
        setIndoor((current) =>
          current.characterId === (person?.characterId ?? null) && current.exit === exit
            ? current
            : { characterId: person?.characterId ?? null, exit },
        );
        return;
      }
      const door = doorNear(position.current);
      setNear((current) => (current?.id === door?.id ? current : door));
      const furniture = streetPropNear(position.current);
      setNearProp((current) => (current?.id === furniture?.id ? current : furniture));
      let walker: number | null = null;
      let walkerDistance = 2.2;
      for (const spot of walkerSpots.current) {
        const distance = Math.hypot(spot.x - position.current.x, spot.y - position.current.y);
        if (distance < walkerDistance) {
          walker = spot.index;
          walkerDistance = distance;
        }
      }
      setNearWalker((current) => (current === walker ? current : walker));

      const person = personNear(peopleOnStreet(game), position.current);
      // Only claim the button when they are nearer than the door, so the two
      // affordances never fight over the same patch of pavement.
      const closer =
        person &&
        (!door ||
          Math.hypot(person.x - position.current.x, person.y - position.current.y) <=
            Math.hypot(door.x - position.current.x, door.y - position.current.y))
          ? person
          : null;
      setNearPerson((current) =>
        current?.characterId === closer?.characterId ? current : closer,
      );
    }, 120);
    return () => window.clearInterval(timer);
  }, [game, room, interior]);

  const nearState = near ? doorState(game, near) : null;
  // One flag for "a conversation is happening in the street right now".
  const talking = streetTalk !== null;
  const chatting = smallTalk !== null;

  const setStick = (dx: number, dy: number) => {
    stick.current = { dx, dy };
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-3 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">
            {interior ? roomInfo(interior).name : 'The block'}
          </h1>
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

      {talking && encounter ? (
        <TalkBar encounter={encounter} name={getCharacter(streetTalk.characterId).name} />
      ) : chatting && smallTalk ? (
        <ChatBar chat={smallTalk} />
      ) : (
      <div className="min-h-[4.5rem] rounded-2xl border border-ink-500/20 bg-night-850/70 p-3">
        {interior ? (
          indoor.characterId ? (
            <>
              <p className="font-display text-sm font-semibold">
                {getCharacter(indoor.characterId as CharacterId).name}
              </p>
              <p className="text-xs text-ink-500">Hit TALK and say something.</p>
            </>
          ) : indoor.exit ? (
            <p className="text-xs text-ink-500">The door out. Hit OUT to step back on the street.</p>
          ) : nearRoomProp?.line ? (
            <>
              <p className="font-display text-sm font-semibold capitalize">{nearRoomProp.label}</p>
              <p className="text-xs italic text-ink-500">{nearRoomProp.line}</p>
            </>
          ) : (
            <p className="text-xs text-ink-600">
              {roomInfo(interior).blurb} Walk up to someone to talk, or back to the door to leave.
            </p>
          )
        ) : nearPerson ? (
          <>
            <p className="font-display text-sm font-semibold">
              {getCharacter(nearPerson.characterId).name}
            </p>
            <p className="text-xs text-ink-500">Right there. Hit TALK and say something.</p>
          </>
        ) : nearState ? (
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
            ) : nearState.door.place ? (
              <p className="text-xs text-ink-500">Open. Walk in and have a look round.</p>
            ) : (
              <p className="text-xs italic text-ink-500">{nearState.door.line}</p>
            )}
          </>
        ) : nearProp?.line ? (
          <>
            <p className="font-display text-sm font-semibold">{nearProp.label}</p>
            <p className="text-xs italic text-ink-500">{nearProp.line}</p>
          </>
        ) : (
          <p className="text-xs text-ink-600">
            Arrow keys or WASD to walk, Space or E to act. Pink doors are open venues, gold doors
            are shops you can wander into, and anything with a name will tell you about itself.
          </p>
        )}
      </div>
      )}

      {!talking && !chatting && (
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
          {!interior && (
            <Button variant="quiet" onClick={closeCity}>
              Things to do
            </Button>
          )}
          <button
            onClick={interact}
            disabled={
              interior
                ? !indoor.characterId && !indoor.exit
                : !near && !nearPerson && nearWalker === null && !nearProp
            }
            className="tap h-16 w-16 rounded-full border border-neon-400 bg-neon-500/90 text-xs font-bold text-night-950 disabled:border-night-600 disabled:bg-night-700 disabled:text-ink-600"
          >
            {interior
              ? indoor.characterId
                ? 'TALK'
                : indoor.exit
                  ? 'OUT'
                  : '—'
              : nearPerson
                ? 'TALK'
                : near?.venue || near?.place
                  ? 'ENTER'
                  : nearWalker !== null
                    ? 'TALK'
                    : 'LOOK'}
          </button>
        </div>
      </div>
      )}
      {(talking || chatting) && <div className="safe-bottom" />}
    </main>
  );
}
