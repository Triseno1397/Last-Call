/**
 * The character renderer.
 *
 * Everything you see walking around the block is drawn here, from parts rather
 * than from an image: shadow, legs, torso, arms, head, face, hair. Drawing the
 * body instead of blitting a sprite sheet means a character is a set of
 * numbers — build, hair style, hair colour, outfit — so the person you made in
 * creation is the person on the street, and a new character costs a palette
 * rather than an art commission.
 *
 * Coordinates are world pixels: `cx` is the centre of the body and `groundY`
 * is the floor the feet stand on, so callers pass a tile position times TILE
 * and never think about the character's height. A character stands about 34px
 * tall at scale 1, a little over two tiles.
 *
 * Proportions are deliberately closer to seven heads than to chibi: at this
 * size a big round head reads as a doll, and the thing that actually sells a
 * person at a glance is leg length and a visible arm swing.
 */
import type { Gender } from '@/content/ids';

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface CharacterLook {
  /** One of the ids in `HAIR_STYLES`; an unknown id falls back to messy waves. */
  hairStyle: string;
  hair: string;
  hairShadow: string;
  skin: string;
  eyes: string;
  /** Shirt, jacket, whatever is on top. */
  top: string;
  /** Trousers or skirt. */
  bottom: string;
  /** Trim: collar, cuffs, the one bright thing in the outfit. */
  accent: string;
  /** One of the ids in `BUILDS`. */
  build: string;
  gender: Gender;
}

export interface CharacterPose {
  facing: Facing;
  /** Position in the walk cycle, 0..1. Ignored when `moving` is false. */
  phase: number;
  moving: boolean;
  scale: number;
  /** Draws a soft ring on the floor — used to mark which one is you. */
  highlight?: boolean;
}

interface BuildMetrics {
  shoulder: number;
  waist: number;
  hip: number;
  legGap: number;
  torso: number;
  limb: number;
}

const BUILD_METRICS: Readonly<Record<string, BuildMetrics>> = {
  lean: { shoulder: 4.4, waist: 3.2, hip: 3.6, legGap: 1.8, torso: 10, limb: 2.0 },
  athletic: { shoulder: 5.3, waist: 3.5, hip: 4.0, legGap: 2.0, torso: 10.2, limb: 2.3 },
  broad: { shoulder: 6.1, waist: 4.7, hip: 4.8, legGap: 2.3, torso: 10.4, limb: 2.7 },
  soft: { shoulder: 4.9, waist: 4.8, hip: 5.0, legGap: 2.1, torso: 9.8, limb: 2.4 },
};

/** Head, neck and leg lengths are shared; build only changes width and torso. */
const HEAD_R = 4.4;
const LEG_LENGTH = 12.5;
const NECK = 1.8;

function metrics(build: string): BuildMetrics {
  return BUILD_METRICS[build] ?? BUILD_METRICS['lean']!;
}

/** A rounded limb, drawn as a thick line so joints stay smooth at any scale. */
function limb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  colour: string,
): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Hair sits in two pieces: whatever falls behind the head — a ponytail, long
 * lengths — goes down before the skull, and the cap and fringe go on after the
 * face. Each style draws its own silhouette rather than tinting one dome,
 * because at thirty pixels tall the outline is the only thing that
 * distinguishes a buzz cut from curtain bangs.
 */
function drawHairBack(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  r: number,
  look: CharacterLook,
  facing: Facing,
): void {
  const lean = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  ctx.fillStyle = look.hairShadow;

  switch (look.hairStyle) {
    case 'long_tie_up': {
      // Bulk gathered at the back, then a tail that swings out behind.
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.2, r * 1.1, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        cx - lean * r * 1.15,
        hy + r * 0.75,
        r * 0.5,
        r * 1.25,
        lean * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
    case 'curtains': {
      // Length down past the jaw on both sides.
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.45, r * 1.16, r * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'messy_waves': {
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.15, r * 1.12, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

function drawHairFront(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  r: number,
  look: CharacterLook,
  facing: Facing,
): void {
  const dir = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  ctx.fillStyle = look.hair;

  switch (look.hairStyle) {
    case 'buzz': {
      // A shadow on the skull and nothing more.
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.16, r * 0.96, r * 0.82, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'undercut': {
      // Tall slab on top, sides taken right down to the skin.
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.74, hy - r * 0.42);
      ctx.lineTo(cx - r * 0.86, hy - r * 1.5);
      ctx.quadraticCurveTo(cx, hy - r * 1.96, cx + r * 0.86, hy - r * 1.5);
      ctx.lineTo(cx + r * 0.74, hy - r * 0.42);
      ctx.quadraticCurveTo(cx, hy - r * 0.86, cx - r * 0.74, hy - r * 0.42);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'slicked_back': {
      // Volume swept back off a widow's peak, higher at the rear.
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.02, hy - r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.5, hy - r * 1.62, cx + r * 0.34, hy - r * 1.24);
      ctx.quadraticCurveTo(cx + r * 1.2, hy - r * 0.96, cx + r * 1.04, hy - r * 0.04);
      ctx.quadraticCurveTo(cx + r * 0.72, hy - r * 0.72, cx + r * 0.1, hy - r * 0.78);
      ctx.quadraticCurveTo(cx - r * 0.5, hy - r * 0.84, cx - r * 1.02, hy - r * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'long_tie_up': {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.1, r * 1.04, r * 0.98, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // A high tail standing proud of the skull.
      ctx.fillStyle = look.hair;
      ctx.beginPath();
      ctx.ellipse(cx - dir * r * 0.2, hy - r * 1.5, r * 0.34, r * 0.52, dir * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.accent;
      ctx.fillRect(cx - r * 0.26, hy - r * 1.26, r * 0.52, r * 0.24);
      break;
    }
    case 'curtains': {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.06, r * 1.1, r * 1.02, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Two heavy lengths parted down the middle, over the brow.
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx, hy - r * 1.02);
        ctx.quadraticCurveTo(cx + side * r * 1.32, hy - r * 0.62, cx + side * r * 0.94, hy + r * 0.66);
        ctx.quadraticCurveTo(cx + side * r * 0.66, hy - r * 0.16, cx, hy - r * 0.34);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'messy_waves':
    default: {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.08, r * 1.08, r * 1.04, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Tufts that break the outline, which is what makes it read as messy.
      const tufts: readonly [number, number, number][] = [
        [-0.78, -0.92, 0.42],
        [-0.16, -1.24, 0.38],
        [0.52, -1.06, 0.44],
        [1.0, -0.5, 0.34],
      ];
      for (const [tx, ty, size] of tufts) {
        ctx.beginPath();
        ctx.ellipse(cx + tx * r, hy + ty * r, size * r, size * r * 0.8, tx * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
}

/**
 * The face, drawn only when there is one to see. Facing away shows the back of
 * the head; facing sideways shows one eye near the edge and a sliver of the
 * far one, which is what sells the turn at this size.
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  r: number,
  look: CharacterLook,
  facing: Facing,
): void {
  if (facing === 'up') return;

  const dir = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  const eyeY = hy + r * 0.12;

  const eye = (ex: number, wide: number) => {
    ctx.fillStyle = '#fbf8ff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, r * 0.3 * wide, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = look.eyes;
    ctx.beginPath();
    ctx.ellipse(ex + dir * r * 0.06, eyeY + r * 0.02, r * 0.21 * wide, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e0b18';
    ctx.beginPath();
    ctx.ellipse(ex + dir * r * 0.06, eyeY + r * 0.04, r * 0.11 * wide, r * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight. Two pixels of white, and the eye stops looking dead.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex + dir * r * 0.02 - r * 0.07, eyeY - r * 0.12, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  };

  if (dir === 0) {
    eye(cx - r * 0.42, 1);
    eye(cx + r * 0.42, 1);
  } else {
    eye(cx + dir * r * 0.46, 1);
    eye(cx - dir * r * 0.26, 0.5);
  }

  // Brows, set above the near eye.
  ctx.strokeStyle = look.hairShadow;
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (const side of dir === 0 ? [-1, 1] : [dir]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.42 - r * 0.26, eyeY - r * 0.52);
    ctx.lineTo(cx + side * r * 0.42 + r * 0.26, eyeY - r * 0.58);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(126, 72, 72, 0.8)';
  ctx.lineWidth = r * 0.11;
  const mouthX = cx + dir * r * 0.3;
  ctx.beginPath();
  ctx.moveTo(mouthX - r * 0.17, hy + r * 0.62);
  ctx.quadraticCurveTo(mouthX, hy + r * 0.78, mouthX + r * 0.17, hy + r * 0.62);
  ctx.stroke();
}

/**
 * Draw one character standing on `groundY`, centred on `cx`.
 *
 * The walk is two counter-swinging pairs — legs and arms — plus a small bob,
 * which is the cheapest motion that still reads as walking rather than
 * sliding. Facing sideways swings the stride along x so you see the gait;
 * facing towards or away lifts the feet alternately instead, because a stride
 * drawn head-on just looks like the legs are shuffling apart.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  look: CharacterLook,
  pose: CharacterPose,
): void {
  const s = pose.scale;
  const m = metrics(look.build);
  const swing = pose.moving ? Math.sin(pose.phase * Math.PI * 2) : 0;
  const bob = pose.moving ? Math.abs(Math.cos(pose.phase * Math.PI * 2)) * 0.8 * s : 0;

  const sideways = pose.facing === 'left' || pose.facing === 'right';
  const stride = sideways ? swing * 3.4 * s : 0;
  const lift = sideways ? 0 : swing * 1.8 * s;

  const hipY = groundY - LEG_LENGTH * s - bob;
  const shoulderY = hipY - m.torso * s;
  const headY = shoulderY - NECK * s - HEAD_R * s;
  const r = HEAD_R * s;

  const shoe = shadeOf(look.bottom, 0.55);
  const legColour = lift1(look.bottom);
  // Sleeves sit a shade off the body colour. Identical arms and torso merge
  // into one dark mass at this size, whatever the pose.
  const sleeve = mix(look.top, 1.34, 14);

  ctx.save();

  // Floor contact. Without a shadow the character reads as floating.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, m.shoulder * 1.2 * s, m.shoulder * 0.38 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose.highlight) {
    const ring = ctx.createRadialGradient(cx, groundY, 1, cx, groundY, m.shoulder * 2.6 * s);
    ring.addColorStop(0, 'rgba(255, 95, 168, 0.38)');
    ring.addColorStop(1, 'rgba(255, 95, 168, 0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.ellipse(cx, groundY, m.shoulder * 2.6 * s, m.shoulder * 1.0 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Back limbs, behind the torso ---
  const armY = shoulderY + 0.6 * s;
  const armLength = (m.torso + 1.2) * s;
  const armWidth = m.limb * 0.92 * s;
  // Arms hang clear of the silhouette, not inside it — buried arms were the
  // single biggest thing making earlier passes read as a block with a head.
  const armOut = (m.shoulder + armWidth * 0.55) * s;

  const backLegX = cx - m.legGap * s;
  const backFootY = groundY - (sideways ? 0 : Math.max(0, lift));
  limb(ctx, cx - m.legGap * s * 0.8, hipY, backLegX - stride, backFootY, m.limb * 1.25 * s, shadeOf(legColour));
  limb(ctx, backLegX - stride, backFootY, backLegX - stride - (sideways ? 1.1 * s : 0), backFootY, m.limb * 1.1 * s, shadeOf(shoe));

  if (!sideways) {
    limb(ctx, cx - armOut, armY, cx - armOut - stride * 0.4, armY + armLength * 0.98, armWidth, shadeOf(sleeve, 0.74));
  }

  // --- Torso ---
  ctx.fillStyle = look.top;
  ctx.beginPath();
  ctx.moveTo(cx - m.shoulder * s, shoulderY + 0.4 * s);
  ctx.quadraticCurveTo(cx, shoulderY - 0.9 * s, cx + m.shoulder * s, shoulderY + 0.4 * s);
  ctx.quadraticCurveTo(cx + m.waist * s, hipY - m.torso * 0.42 * s, cx + m.hip * s, hipY);
  ctx.lineTo(cx - m.hip * s, hipY);
  ctx.quadraticCurveTo(cx - m.waist * s, hipY - m.torso * 0.42 * s, cx - m.shoulder * s, shoulderY + 0.4 * s);
  ctx.closePath();
  ctx.fill();

  // Waistband and collar: the two bright lines that stop a dark outfit going
  // flat, and the only cue for where the torso ends and the legs begin.
  ctx.fillStyle = shadeOf(look.bottom, 0.85);
  ctx.fillRect(cx - m.hip * s, hipY - 1.5 * s, m.hip * 2 * s, 1.9 * s);
  ctx.fillStyle = look.accent;
  ctx.fillRect(cx - m.shoulder * 0.46 * s, shoulderY, m.shoulder * 0.92 * s, 1.3 * s);

  // --- Front limbs, over the torso ---
  const frontLegX = cx + m.legGap * s;
  const frontFootY = groundY - (sideways ? 0 : Math.max(0, -lift));
  limb(ctx, cx + m.legGap * s * 0.8, hipY, frontLegX + stride, frontFootY, m.limb * 1.25 * s, legColour);
  limb(ctx, frontLegX + stride, frontFootY, frontLegX + stride + (sideways ? 1.1 * s : 0), frontFootY, m.limb * 1.1 * s, shoe);

  const frontArmX = sideways ? cx + (m.shoulder * 0.35 + armWidth * 0.4) * s : cx + armOut;
  const handX = frontArmX + stride * 0.45;
  const handY = armY + armLength * 0.98;
  limb(ctx, frontArmX, armY, handX, handY, armWidth, sleeve);
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(handX, handY + armWidth * 0.1, armWidth * 0.52, 0, Math.PI * 2);
  ctx.fill();
  if (!sideways) {
    const backHandX = cx - armOut - stride * 0.4;
    ctx.beginPath();
    ctx.arc(backHandX, armY + armLength * 0.98 + armWidth * 0.1, armWidth * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Head ---
  limb(ctx, cx, shoulderY + 0.2 * s, cx, shoulderY - NECK * s, 2.2 * s, shadeOf(look.skin, 0.82));

  drawHairBack(ctx, cx, headY, r, look, pose.facing);

  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.ellipse(cx, headY, r * 0.92, r * 1.04, 0, 0, Math.PI * 2);
  ctx.fill();

  drawFace(ctx, cx, headY, r, look, pose.facing);
  drawHairFront(ctx, cx, headY, r, look, pose.facing);

  ctx.restore();
}

/** A darker version of a colour, for the limb that is further away. */
function shadeOf(colour: string, factor = 0.62): string {
  return mix(colour, factor);
}

/**
 * Trousers are usually the darkest thing in an outfit, and against a night
 * street they vanish. This lifts them just enough to keep legs visible.
 */
function lift1(colour: string): string {
  return mix(colour, 1.5, 26);
}

function mix(colour: string, factor: number, floor = 0): string {
  const hex = colour.replace('#', '');
  if (hex.length !== 6) return colour;
  const channel = (from: number) => {
    const value = Number.parseInt(hex.slice(from, from + 2), 16);
    return Math.min(255, Math.max(0, Math.round(value * factor) + floor))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/** Which way a character is facing, given how they are moving. */
export function facingFrom(dx: number, dy: number, previous: Facing): Facing {
  if (dx === 0 && dy === 0) return previous;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
