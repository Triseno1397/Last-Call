/**
 * Painting the inside of a building.
 *
 * The street painter draws blocks and roads; this draws floorboards, shelves,
 * stools and neon. Same idea, same tile grid, same cel-shaded treatment — flat
 * fills, a hard shadow edge, and a keyline on anything with a silhouette — so
 * walking through a door does not look like changing games.
 *
 * Everything is painted once into an offscreen canvas and blitted each frame;
 * nothing here runs in the animation loop.
 */
import type { InteriorDef, InteriorProp } from '@/content/interiors';
import { TILE } from '@/content/city';

const FLOOR_COLOURS: Readonly<Record<string, string>> = {
  wood: '#2a1d20',
  tile: '#232838',
  rubber: '#1a222b',
  rug: '#3a2030',
  stage: '#241a2e',
};

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

const INK = 'rgba(8, 6, 16, 0.8)';

/** A prop box with a lit top face, a darker front and a keyline. */
function block(
  ctx: CanvasRenderingContext2D,
  prop: InteriorProp,
  base: string,
  height = 0.42,
): void {
  const x = prop.x * TILE;
  const y = prop.y * TILE;
  const w = prop.w * TILE;
  const h = prop.h * TILE;
  const rise = h * height;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(x + 2, y + 3, w, h);

  // Front face, in shadow.
  ctx.fillStyle = mix(base, 0.62);
  ctx.fillRect(x, y + rise, w, h - rise);
  // Top face, lit.
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, rise);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawProp(ctx: CanvasRenderingContext2D, prop: InteriorProp, def: InteriorDef): void {
  const { trim, glow } = def.palette;
  const x = prop.x * TILE;
  const y = prop.y * TILE;
  const w = prop.w * TILE;
  const h = prop.h * TILE;

  switch (prop.kind) {
    case 'counter': {
      block(ctx, prop, prop.colour ?? mix(trim, 1.1, 8), 0.3);
      // A bright lip along the front edge; bar tops catch the light.
      ctx.fillStyle = mix(glow, 0.55, 18);
      ctx.fillRect(x, y + h - 3, w, 2);
      break;
    }
    case 'table':
      block(ctx, prop, prop.colour ?? mix(trim, 0.95), 0.5);
      break;
    case 'stool': {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.9, w * 0.38, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.45, w * 0.36, h * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = mix(trim, 1.2, 10);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case 'shelf': {
      block(ctx, prop, prop.colour ?? mix(trim, 0.85), 0.22);
      // Book spines: a run of coloured ticks along the shelf.
      const spineColours = ['#b5273f', '#d8b06a', '#3fbf85', '#7f8ad6', '#c96a3f'];
      const along = w > h;
      const count = Math.floor((along ? w : h) / 4);
      for (let i = 0; i < count; i += 1) {
        ctx.fillStyle = spineColours[(i * 3) % spineColours.length]!;
        ctx.globalAlpha = 0.75;
        if (along) ctx.fillRect(x + 2 + i * 4, y + 2, 2.4, h - 5);
        else ctx.fillRect(x + 2, y + 2 + i * 4, w - 5, 2.4);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'armchair': {
      block(ctx, prop, prop.colour ?? '#4a2a3a', 0.55);
      ctx.fillStyle = mix('#4a2a3a', 1.35, 16);
      ctx.fillRect(x + 2, y + h * 0.5, w - 4, h * 0.22);
      break;
    }
    case 'bench':
      block(ctx, prop, prop.colour ?? '#2c3440', 0.4);
      break;
    case 'rack': {
      block(ctx, prop, prop.colour ?? '#33414d', 0.3);
      // Plates stacked on the end.
      ctx.fillStyle = '#1b232c';
      ctx.beginPath();
      ctx.arc(x + w - 4, y + h - 4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case 'plant': {
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(x + w * 0.3, y + h * 0.55, w * 0.4, h * 0.42);
      ctx.fillStyle = '#2f6b4a';
      for (const [dx, dy, rr] of [
        [0.5, 0.3, 0.38],
        [0.28, 0.42, 0.26],
        [0.72, 0.42, 0.26],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + w * dx, y + h * dy, w * rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + w * 0.3 + 0.5, y + h * 0.55 + 0.5, w * 0.4 - 1, h * 0.42 - 1);
      break;
    }
    case 'dartboard': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      for (const [rr, colour] of [
        [w * 0.5, '#1d1520'],
        [w * 0.34, '#c8b48a'],
        [w * 0.2, '#8f2436'],
        [w * 0.07, '#e8d7a8'],
      ] as const) {
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'neon': {
      // A sign on the wall: glow behind, hard letters in front.
      const cx = x + w / 2;
      const cy = y + h / 2;
      const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, w * 0.8);
      aura.addColorStop(0, `${glow}88`);
      aura.addColorStop(1, `${glow}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 0.4, y - h * 1.6, w * 1.8, h * 4);
      if (prop.label) {
        ctx.fillStyle = glow;
        ctx.font = `700 ${Math.max(6, h * 0.8)}px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(prop.label, cx, cy);
      }
      break;
    }
    case 'lamp': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, w * 2.6);
      aura.addColorStop(0, 'rgba(255, 206, 107, 0.34)');
      aura.addColorStop(1, 'rgba(255, 206, 107, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd98a';
      ctx.fill();
      break;
    }
    case 'window': {
      ctx.fillStyle = 'rgba(120, 180, 255, 0.16)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = mix(trim, 1.4, 20);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      break;
    }
    case 'mirror': {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.10)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = mix(trim, 1.5, 24);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      break;
    }
  }
}

/** Paint the whole room into `ctx`, sized `def.width × def.height` tiles. */
export function paintRoom(ctx: CanvasRenderingContext2D, def: InteriorDef): void {
  const W = def.width * TILE;
  const H = def.height * TILE;

  // Wall behind everything.
  ctx.fillStyle = def.palette.wall;
  ctx.fillRect(0, 0, W, H);

  for (const floor of def.floors) {
    const x = floor.x * TILE;
    const y = floor.y * TILE;
    const w = floor.w * TILE;
    const h = floor.h * TILE;
    ctx.fillStyle = FLOOR_COLOURS[floor.kind] ?? '#232030';
    ctx.fillRect(x, y, w, h);

    if (floor.kind === 'wood') {
      // Boards: a line every few pixels, plus a seam every other board.
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      for (let by = y + 6; by < y + h; by += 6) {
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x + w, by);
        ctx.stroke();
      }
    }
    if (floor.kind === 'tile') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let tx = x; tx < x + w; tx += TILE) {
        for (let ty = y; ty < y + h; ty += TILE) {
          ctx.strokeRect(tx + 0.5, ty + 0.5, TILE - 1, TILE - 1);
        }
      }
    }
    if (floor.kind === 'rubber') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 90; i += 1) {
        const px = x + ((i * 37) % w);
        const py = y + ((i * 53) % h);
        ctx.fillRect(px, py, 2, 2);
      }
    }
    if (floor.kind === 'rug') {
      ctx.strokeStyle = 'rgba(255, 206, 107, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    }
  }

  // The wall band across the top, so the room has a back to it.
  ctx.fillStyle = mix(def.palette.wall, 0.8);
  ctx.fillRect(0, 0, W, 2 * TILE);
  ctx.fillStyle = mix(def.palette.trim, 1.1, 6);
  ctx.fillRect(0, 2 * TILE - 3, W, 3);

  // Props back to front, so things lower down overlap what is behind them.
  for (const prop of [...def.props].sort((a, b) => a.y - b.y)) {
    drawProp(ctx, prop, def);
  }

  // The way out, marked on the floor.
  const ex = def.exit.x * TILE;
  const ey = def.exit.y * TILE;
  const exitGlow = ctx.createRadialGradient(ex, ey, 1, ex, ey, TILE * 1.4);
  exitGlow.addColorStop(0, 'rgba(120, 220, 255, 0.4)');
  exitGlow.addColorStop(1, 'rgba(120, 220, 255, 0)');
  ctx.fillStyle = exitGlow;
  ctx.beginPath();
  ctx.arc(ex, ey, TILE * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9fe6ff';
  ctx.font = '700 7px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OUT', ex, ey + 3);
}
