/**
 * The character renderer.
 *
 * Everyone you see is drawn here from parts rather than blitted from a sprite
 * sheet: shadow, legs, torso, arms, head, face, hair. A character is therefore
 * a set of numbers — build, hair style, hair colour, outfit, expression — so
 * the person you made is the person on the street, and a new character costs a
 * palette rather than an art commission.
 *
 * The style is cel animation, which comes down to three things and not much
 * else: flat fills with a hard shadow edge rather than gradients, a dark
 * keyline around every shape, and a large head with large eyes. Proportions sit
 * near six heads, not the seven-and-a-half of life drawing — that single ratio
 * is what separates "anime character" from "generic game sprite".
 *
 * Coordinates are world pixels: `cx` is the centre of the body and `groundY`
 * is the floor the feet stand on, so callers pass a tile position times TILE
 * and never think about the character's height. A character stands about 34px
 * tall at scale 1.
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
  /** One of the EXPRESSIONS ids; drives the eyes, brows and mouth. */
  expression?: string;
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
  lean: { shoulder: 4.2, waist: 3.1, hip: 3.5, legGap: 1.7, torso: 9.2, limb: 1.9 },
  athletic: { shoulder: 5.0, waist: 3.4, hip: 3.9, legGap: 1.9, torso: 9.4, limb: 2.2 },
  broad: { shoulder: 5.8, waist: 4.5, hip: 4.6, legGap: 2.2, torso: 9.6, limb: 2.6 },
  soft: { shoulder: 4.7, waist: 4.6, hip: 4.8, legGap: 2.0, torso: 9.0, limb: 2.3 },
};

/**
 * Head, neck and leg lengths are shared; build only changes width and torso.
 * Near six heads tall, with a head deliberately larger than anatomy would give
 * it — the style cue that does the most work at this size.
 */
const HEAD_R = 4.7;
const LEG_LENGTH = 12.5;
const NECK = 1.3;

/** Every filled shape carries a keyline, the way cel animation does. */
const INK = 'rgba(11, 8, 20, 0.88)';

function metrics(build: string): BuildMetrics {
  return BUILD_METRICS[build] ?? BUILD_METRICS['lean']!;
}

/** Scale a hex colour's channels, clamped. Used for flat shadow and highlight. */
function mix(colour: string, factor: number, floor = 0): string {
  const hex = colour.replace('#', '');
  if (hex.length !== 6) return colour;
  const channel = (from: number) =>
    Math.min(
      255,
      Math.max(0, Math.round(Number.parseInt(hex.slice(from, from + 2), 16) * factor) + floor),
    )
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

const shade = (colour: string, factor = 0.66) => mix(colour, factor);
const lift = (colour: string, factor = 1.35, floor = 16) => mix(colour, factor, floor);

/** A rounded limb with a keyline, drawn as a thick stroke over a thicker one. */
function limb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  colour: string,
): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = width + 0.9;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Fill the current path flat, then ink its edge. */
function inked(ctx: CanvasRenderingContext2D, colour: string, lineWidth = 0.85): void {
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Hair sits in two pieces: whatever falls behind the head — a ponytail, long
 * lengths — goes down before the skull, and the cap and fringe go on after the
 * face. Each style draws its own silhouette rather than tinting one dome,
 * because the outline is what distinguishes a buzz cut from curtain bangs.
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

  switch (look.hairStyle) {
    case 'long_tie_up': {
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.2, r * 1.08, r * 1.14, 0, 0, Math.PI * 2);
      inked(ctx, look.hairShadow);
      ctx.beginPath();
      ctx.ellipse(cx - lean * r * 1.2, hy + r * 0.8, r * 0.46, r * 1.3, lean * 0.35, 0, Math.PI * 2);
      inked(ctx, look.hairShadow);
      break;
    }
    case 'curtains': {
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.5, r * 1.14, r * 1.34, 0, 0, Math.PI * 2);
      inked(ctx, look.hairShadow);
      break;
    }
    case 'messy_waves': {
      ctx.beginPath();
      ctx.ellipse(cx, hy + r * 0.16, r * 1.1, r * 1.04, 0, 0, Math.PI * 2);
      inked(ctx, look.hairShadow);
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

  switch (look.hairStyle) {
    case 'buzz': {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.14, r * 0.94, r * 0.8, 0, Math.PI, Math.PI * 2);
      inked(ctx, look.hair);
      break;
    }
    case 'undercut': {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.72, hy - r * 0.4);
      ctx.lineTo(cx - r * 0.84, hy - r * 1.46);
      ctx.quadraticCurveTo(cx, hy - r * 1.92, cx + r * 0.84, hy - r * 1.46);
      ctx.lineTo(cx + r * 0.72, hy - r * 0.4);
      ctx.quadraticCurveTo(cx, hy - r * 0.84, cx - r * 0.72, hy - r * 0.4);
      ctx.closePath();
      inked(ctx, look.hair);
      break;
    }
    case 'slicked_back': {
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.0, hy - r * 0.18);
      ctx.quadraticCurveTo(cx - r * 0.5, hy - r * 1.6, cx + r * 0.34, hy - r * 1.22);
      ctx.quadraticCurveTo(cx + r * 1.18, hy - r * 0.94, cx + r * 1.02, hy - r * 0.02);
      ctx.quadraticCurveTo(cx + r * 0.7, hy - r * 0.7, cx + r * 0.1, hy - r * 0.76);
      ctx.quadraticCurveTo(cx - r * 0.5, hy - r * 0.82, cx - r * 1.0, hy - r * 0.18);
      ctx.closePath();
      inked(ctx, look.hair);
      break;
    }
    case 'long_tie_up': {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.08, r * 1.02, r * 0.96, 0, Math.PI, Math.PI * 2);
      inked(ctx, look.hair);
      ctx.beginPath();
      ctx.ellipse(cx - dir * r * 0.2, hy - r * 1.48, r * 0.32, r * 0.5, dir * 0.4, 0, Math.PI * 2);
      inked(ctx, look.hair);
      ctx.fillStyle = look.accent;
      ctx.fillRect(cx - r * 0.24, hy - r * 1.24, r * 0.48, r * 0.22);
      break;
    }
    case 'curtains': {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.04, r * 1.08, r * 1.0, 0, Math.PI, Math.PI * 2);
      inked(ctx, look.hair);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx, hy - r * 1.0);
        ctx.quadraticCurveTo(cx + side * r * 1.24, hy - r * 0.72, cx + side * r * 1.0, hy + r * 0.5);
        ctx.quadraticCurveTo(cx + side * r * 0.86, hy - r * 0.3, cx + side * r * 0.2, hy - r * 0.62);
        ctx.closePath();
        inked(ctx, look.hair);
      }
      break;
    }
    case 'messy_waves':
    default: {
      ctx.beginPath();
      ctx.ellipse(cx, hy - r * 0.06, r * 1.06, r * 1.02, 0, Math.PI, Math.PI * 2);
      inked(ctx, look.hair);
      const tufts: readonly [number, number, number][] = [
        [-0.76, -0.9, 0.4],
        [-0.16, -1.22, 0.36],
        [0.5, -1.04, 0.42],
        [0.98, -0.48, 0.32],
      ];
      for (const [tx, ty, size] of tufts) {
        ctx.beginPath();
        ctx.ellipse(cx + tx * r, hy + ty * r, size * r, size * r * 0.8, tx * 0.6, 0, Math.PI * 2);
        inked(ctx, look.hair);
      }
      break;
    }
  }

  // The hair sheen — one hard specular band across the crown. Nothing reads as
  // cel-shaded anime hair faster.
  if (look.hairStyle !== 'buzz') {
    ctx.save();
    ctx.fillStyle = lift(look.hair, 1.7, 40);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(cx - dir * r * 0.18, hy - r * 0.72, r * 0.6, r * 0.16, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** How each expression bends the eyes, brows and mouth. */
interface FaceShape {
  /** 1 = wide open, 0 = shut. */
  openness: number;
  /** Positive tilts the inner brow up (worried), negative down (cross). */
  brow: number;
  /** Positive smiles, negative frowns. */
  mouth: number;
  /** Draws blush on the cheeks. */
  blush?: boolean;
  /** Draws the closed happy arc instead of an open eye. */
  arcEyes?: boolean;
}

const FACES: Readonly<Record<string, FaceShape>> = {
  neutral: { openness: 1, brow: 0, mouth: 0.15 },
  amused: { openness: 0.85, brow: 0.1, mouth: 0.8 },
  interested: { openness: 1.15, brow: 0.2, mouth: 0.45 },
  bored: { openness: 0.6, brow: -0.15, mouth: -0.2 },
  annoyed: { openness: 0.8, brow: -0.5, mouth: -0.6 },
  uncomfortable: { openness: 0.9, brow: 0.45, mouth: -0.45 },
  blushing: { openness: 0.8, brow: 0.3, mouth: 0.3, blush: true },
  laughing: { openness: 0.4, brow: 0.15, mouth: 1, arcEyes: true },
};

/**
 * The face, drawn only when there is one to see. Facing away shows the back of
 * the head; facing sideways shows one eye near the edge and a sliver of the
 * far one, which is what sells the turn at this size.
 *
 * Eyes are deliberately large, with a heavy upper lash line, a flat iris, a
 * hard shadow across its top and two catchlights — the anime eye, in about a
 * dozen drawing calls.
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  r: number,
  look: CharacterLook,
  facing: Facing,
  expression: string,
): void {
  if (facing === 'up') return;

  const face = FACES[expression] ?? FACES['neutral']!;
  const dir = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  const eyeY = hy + r * 0.14;
  const eyeH = r * 0.42 * face.openness;
  const eyeW = r * 0.3;

  const eye = (ex: number, wide: number) => {
    if (face.arcEyes) {
      // Happy closed eyes: an upward arc and nothing else.
      ctx.strokeStyle = '#181026';
      ctx.lineWidth = r * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, eyeY + r * 0.1, r * 0.26 * wide, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW * wide, eyeH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fdfbff';
    ctx.fill();

    // Iris, flat, sitting low so the eye reads as looking at you.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW * wide, eyeH, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = look.eyes;
    ctx.beginPath();
    ctx.ellipse(ex + dir * r * 0.07, eyeY + r * 0.04, eyeW * 0.78 * wide, eyeH * 0.84, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hard-edged shadow across the top of the iris: the cel look.
    ctx.fillStyle = shade(look.eyes, 0.52);
    ctx.beginPath();
    ctx.ellipse(ex + dir * r * 0.07, eyeY - r * 0.12, eyeW * 0.78 * wide, eyeH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#100a1c';
    ctx.beginPath();
    ctx.ellipse(ex + dir * r * 0.07, eyeY + r * 0.04, eyeW * 0.34 * wide, eyeH * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Two catchlights, one large and one small. Most of the "alive" is here.
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(ex + dir * r * 0.02 - r * 0.09, eyeY - r * 0.13, r * 0.085 * wide, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(ex + dir * r * 0.12, eyeY + r * 0.12, r * 0.045 * wide, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The upper lash line, the heaviest stroke on the face.
    ctx.strokeStyle = '#150e24';
    ctx.lineWidth = r * 0.13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ex, eyeY + r * 0.02, eyeW * wide, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();
  };

  if (dir === 0) {
    eye(cx - r * 0.44, 1);
    eye(cx + r * 0.44, 1);
  } else {
    eye(cx + dir * r * 0.44, 1);
    eye(cx - dir * r * 0.3, 0.55);
  }

  if (face.blush) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff6f8f';
    for (const side of dir === 0 ? [-1, 1] : [dir, -dir * 0.6]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.66, eyeY + r * 0.36, r * 0.26, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Brows: height and tilt carry most of the expression.
  ctx.strokeStyle = shade(look.hair, 0.7);
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = 'round';
  for (const side of dir === 0 ? [-1, 1] : [dir]) {
    const inner = cx + side * r * 0.24;
    const outer = cx + side * r * 0.66;
    const browY = eyeY - r * (0.5 + face.openness * 0.08);
    ctx.beginPath();
    ctx.moveTo(inner, browY - face.brow * r * 0.22);
    ctx.lineTo(outer, browY + face.brow * r * 0.14);
    ctx.stroke();
  }

  // Mouth: a small arc that flips with the expression.
  const mouthX = cx + dir * r * 0.26;
  const mouthY = hy + r * 0.66;
  const curve = face.mouth * r * 0.24;
  ctx.strokeStyle = 'rgba(118, 62, 66, 0.9)';
  ctx.lineWidth = r * 0.11;
  ctx.beginPath();
  ctx.moveTo(mouthX - r * 0.18, mouthY - curve * 0.35);
  ctx.quadraticCurveTo(mouthX, mouthY + curve, mouthX + r * 0.18, mouthY - curve * 0.35);
  ctx.stroke();

  // A wide grin opens the mouth rather than just thickening the line.
  if (face.mouth >= 0.9) {
    ctx.beginPath();
    ctx.ellipse(mouthX, mouthY + r * 0.06, r * 0.19, r * 0.14, 0, 0, Math.PI);
    inked(ctx, '#5a2230', 0.6);
  }
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
  const stride = sideways ? swing * 3.2 * s : 0;
  const footLift = sideways ? 0 : swing * 1.7 * s;

  const hipY = groundY - LEG_LENGTH * s - bob;
  const shoulderY = hipY - m.torso * s;
  const headY = shoulderY - NECK * s - HEAD_R * s;
  const r = HEAD_R * s;

  const shoe = shade(look.bottom, 0.5);
  const trouser = lift(look.bottom, 1.45, 22);
  // Only just off the body colour: a strongly contrasting sleeve made the arms
  // read as separate bars floating beside the torso.
  const sleeve = lift(look.top, 1.12, 5);

  ctx.save();
  ctx.lineJoin = 'round';

  // Floor contact. Without a shadow the character reads as floating.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, m.shoulder * 1.18 * s, m.shoulder * 0.36 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose.highlight) {
    const ring = ctx.createRadialGradient(cx, groundY, 1, cx, groundY, m.shoulder * 2.6 * s);
    ring.addColorStop(0, 'rgba(255, 95, 168, 0.4)');
    ring.addColorStop(1, 'rgba(255, 95, 168, 0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.ellipse(cx, groundY, m.shoulder * 2.6 * s, m.shoulder * 1.0 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const armY = shoulderY + 0.5 * s;
  const armLength = (m.torso + 1.4) * s;
  const armWidth = m.limb * 0.9 * s;
  // Arms hang just inside the shoulder line and taper towards the hip, so they
  // touch the body the whole way down. Outside it they float; buried in it they
  // vanish — this is the narrow band between the two.
  const armOut = m.shoulder * 0.86 * s;
  const armIn = m.waist * 0.92 * s;

  // --- Back limbs, behind the torso ---
  const backLegX = cx - m.legGap * s;
  const backFootY = groundY - (sideways ? 0 : Math.max(0, footLift));
  limb(ctx, cx - m.legGap * s * 0.8, hipY, backLegX - stride, backFootY, m.limb * 1.24 * s, shade(trouser));
  limb(
    ctx,
    backLegX - stride,
    backFootY,
    backLegX - stride - (sideways ? 1.1 * s : 0),
    backFootY,
    m.limb * 1.1 * s,
    shade(shoe),
  );

  if (!sideways) {
    limb(
      ctx,
      cx - armOut,
      armY,
      cx - armIn - stride * 0.4,
      armY + armLength * 0.96,
      armWidth,
      shade(sleeve, 0.78),
    );
  }

  // --- Torso: flat fill, then one hard shadow down the far side ---
  const torsoPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx - m.shoulder * s, shoulderY + 0.4 * s);
    ctx.quadraticCurveTo(cx, shoulderY - 1.0 * s, cx + m.shoulder * s, shoulderY + 0.4 * s);
    ctx.quadraticCurveTo(cx + m.waist * s, hipY - m.torso * 0.42 * s, cx + m.hip * s, hipY);
    ctx.lineTo(cx - m.hip * s, hipY);
    ctx.quadraticCurveTo(cx - m.waist * s, hipY - m.torso * 0.42 * s, cx - m.shoulder * s, shoulderY + 0.4 * s);
    ctx.closePath();
  };
  torsoPath();
  inked(ctx, look.top);

  ctx.save();
  torsoPath();
  ctx.clip();
  ctx.fillStyle = shade(look.top, 0.74);
  ctx.fillRect(cx + m.shoulder * s * 0.15, shoulderY - 2 * s, m.shoulder * s, (m.torso + 3) * s);
  ctx.restore();

  // Waistband and collar: the two bright lines that stop a dark outfit going
  // flat, and the only cue for where the torso ends and the legs begin.
  ctx.fillStyle = shade(look.bottom, 0.9);
  ctx.fillRect(cx - m.hip * s, hipY - 1.4 * s, m.hip * 2 * s, 1.8 * s);
  ctx.fillStyle = look.accent;
  ctx.fillRect(cx - m.shoulder * 0.44 * s, shoulderY - 0.1 * s, m.shoulder * 0.88 * s, 1.2 * s);

  // --- Front limbs, over the torso ---
  const frontLegX = cx + m.legGap * s;
  const frontFootY = groundY - (sideways ? 0 : Math.max(0, -footLift));
  limb(ctx, cx + m.legGap * s * 0.8, hipY, frontLegX + stride, frontFootY, m.limb * 1.24 * s, trouser);
  limb(
    ctx,
    frontLegX + stride,
    frontFootY,
    frontLegX + stride + (sideways ? 1.1 * s : 0),
    frontFootY,
    m.limb * 1.1 * s,
    shoe,
  );

  const frontArmX = sideways ? cx + (m.shoulder * 0.3 + armWidth * 0.35) * s : cx + armOut;
  const handX = (sideways ? frontArmX : cx + armIn) + stride * 0.45;
  const handY = armY + armLength * 0.96;
  limb(ctx, frontArmX, armY, handX, handY, armWidth, sleeve);

  const hand = (hx: number, hy2: number) => {
    ctx.beginPath();
    ctx.arc(hx, hy2, armWidth * 0.5, 0, Math.PI * 2);
    inked(ctx, look.skin, 0.7);
  };
  hand(handX, handY + armWidth * 0.02);
  if (!sideways) hand(cx - armIn - stride * 0.4, armY + armLength * 0.96 + armWidth * 0.02);

  // --- Head ---
  limb(ctx, cx, shoulderY + 0.2 * s, cx, shoulderY - NECK * s, 2.1 * s, shade(look.skin, 0.8));

  drawHairBack(ctx, cx, headY, r, look, pose.facing);

  // A jaw that tapers to a chin rather than a circle: the other anime cue.
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.9, headY - r * 0.18);
  ctx.quadraticCurveTo(cx - r * 0.94, headY + r * 0.56, cx, headY + r * 1.04);
  ctx.quadraticCurveTo(cx + r * 0.94, headY + r * 0.56, cx + r * 0.9, headY - r * 0.18);
  ctx.quadraticCurveTo(cx + r * 0.9, headY - r * 1.04, cx, headY - r * 1.04);
  ctx.quadraticCurveTo(cx - r * 0.9, headY - r * 1.04, cx - r * 0.9, headY - r * 0.18);
  ctx.closePath();
  inked(ctx, look.skin, 0.8);

  drawFace(ctx, cx, headY, r, look, pose.facing, pose.expression ?? 'neutral');
  drawHairFront(ctx, cx, headY, r, look, pose.facing);

  ctx.restore();
}

/** Which way a character is facing, given how they are moving. */
export function facingFrom(dx: number, dy: number, previous: Facing): Facing {
  if (dx === 0 && dy === 0) return previous;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
