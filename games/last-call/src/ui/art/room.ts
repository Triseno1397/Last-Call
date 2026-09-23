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
    case 'espresso': {
      // A chrome machine on the counter: body, group heads, a steam wand.
      block(ctx, prop, '#8a8fa8', 0.5);
      ctx.fillStyle = '#c9cede';
      ctx.fillRect(x + 2, y + 1, w - 4, 3);
      ctx.fillStyle = '#2a2838';
      ctx.fillRect(x + 3, y + h - 5, 3, 3);
      ctx.fillRect(x + w - 6, y + h - 5, 3, 3);
      ctx.fillStyle = '#ff5fa8';
      ctx.fillRect(x + w / 2 - 1, y + 2, 2, 1.5);
      break;
    }
    case 'pastry_case': {
      // Glass case with three shelves of things you should not buy.
      block(ctx, prop, mix(trim, 1.1, 8), 0.3);
      ctx.fillStyle = 'rgba(200, 230, 255, 0.18)';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      for (let i = 0; i < Math.floor(w / 6); i += 1) {
        ctx.fillStyle = ['#d8a36a', '#f0c48a', '#b5273f', '#ffe7b3'][i % 4]!;
        ctx.beginPath();
        ctx.arc(x + 4 + i * 6, y + h / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      break;
    }
    case 'crate': {
      // A record crate: a box full of sleeves, spines facing up.
      block(ctx, prop, '#3a2a1e', 0.35);
      const sleeves = ['#b5273f', '#243a8f', '#d8b06a', '#3fbf85', '#f0e6d8', '#7f8ad6', '#c96a3f'];
      for (let sx = x + 3, i = 0; sx < x + w - 3; sx += 2.4, i += 1) {
        ctx.fillStyle = sleeves[(i * 5 + Math.round(x)) % sleeves.length]!;
        ctx.fillRect(sx, y + 2, 1.8, h * 0.4 - 1);
      }
      if (prop.label) {
        ctx.fillStyle = '#f2eefc';
        ctx.font = '700 4.5px "DM Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(prop.label, x + w / 2, y + h - 5);
      }
      break;
    }
    case 'listening_post': {
      block(ctx, prop, '#2a2838', 0.4);
      // Turntable and a pair of headphones hung on a hook.
      ctx.beginPath();
      ctx.arc(x + w * 0.4, y + h * 0.4, w * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = '#111018';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w * 0.4, y + h * 0.4, w * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#9a6bff';
      ctx.fill();
      ctx.strokeStyle = '#c9cede';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + w * 0.8, y + h * 0.5, w * 0.16, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
      break;
    }
    case 'poster': {
      // Paper on the wall, layered; the one on top is a gig.
      for (const [dx, dy, colour] of [
        [0, 0, '#e8dcc8'],
        [2, -1, '#f0c48a'],
        [4, 1, '#ff9ac2'],
      ] as const) {
        ctx.fillStyle = colour;
        ctx.fillRect(x + dx, y + dy, w * 0.8, h);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.7;
        ctx.strokeRect(x + dx + 0.35, y + dy + 0.35, w * 0.8 - 0.7, h - 0.7);
      }
      ctx.fillStyle = '#1a1220';
      ctx.fillRect(x + 6, y + 3, w * 0.5, 1);
      ctx.fillRect(x + 6, y + 6, w * 0.35, 1);
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
    case 'cabinet': {
      // An arcade machine: dark body, a lit screen, a marquee in its colour.
      const tint = prop.colour ?? glow;
      block(ctx, prop, '#1c1626', 0.55);
      ctx.fillStyle = tint;
      ctx.fillRect(x + 1, y + 1, w - 2, 3);
      const screen = ctx.createLinearGradient(x, y + 5, x, y + h * 0.55);
      screen.addColorStop(0, mix(tint, 0.9, 30));
      screen.addColorStop(1, '#0b0a14');
      ctx.fillStyle = screen;
      ctx.fillRect(x + 2, y + 5, w - 4, h * 0.55 - 5);
      const aura = ctx.createRadialGradient(x + w / 2, y + h * 0.3, 1, x + w / 2, y + h * 0.3, w);
      aura.addColorStop(0, `${tint}66`);
      aura.addColorStop(1, `${tint}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 0.5, y - h * 0.5, w * 2, h * 2);
      // Joystick and two buttons on the control deck.
      ctx.fillStyle = '#e8e2f2';
      ctx.beginPath();
      ctx.arc(x + w * 0.3, y + h * 0.78, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.arc(x + w * 0.62, y + h * 0.78, 1.3, 0, Math.PI * 2);
      ctx.arc(x + w * 0.8, y + h * 0.74, 1.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'painting': {
      // A canvas in a frame, with a wash of its own colour and a spotlight.
      const tint = prop.colour ?? glow;
      const spot = ctx.createRadialGradient(x + w / 2, y + h, 1, x + w / 2, y + h, w * 0.9);
      spot.addColorStop(0, 'rgba(255, 244, 220, 0.22)');
      spot.addColorStop(1, 'rgba(255, 244, 220, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(x - w * 0.5, y, w * 2, h * 2.4);
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(x, y, w, h);
      const wash = ctx.createLinearGradient(x, y, x + w, y + h);
      wash.addColorStop(0, mix(tint, 1.2, 20));
      wash.addColorStop(1, mix(tint, 0.5));
      ctx.fillStyle = wash;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(x + w * 0.35, y + h * 0.45, h * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      break;
    }
    case 'plinth': {
      block(ctx, prop, '#cfc8d8', 0.35);
      // The piece on top: a small dark shape with a highlight.
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.22, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8b06a';
      ctx.beginPath();
      ctx.arc(x + w * 0.44, y + h * 0.16, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'fridge': {
      // A chiller cabinet: glass front, lit shelves, rows of things in colour.
      block(ctx, prop, '#3b4a5a', 0.24);
      ctx.fillStyle = 'rgba(180, 230, 255, 0.16)';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      const goods = ['#3fbf85', '#ffce6b', '#ff5fa8', '#4fd6ff', '#e2a03f', '#f0e6d8'];
      for (let i = 0; i < Math.floor((w - 4) / 4); i += 1) {
        ctx.fillStyle = goods[(i * 5) % goods.length]!;
        ctx.fillRect(x + 3 + i * 4, y + 4, 2.6, h * 0.3);
        ctx.fillRect(x + 3 + i * 4, y + h * 0.62, 2.6, h * 0.28);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      break;
    }
    case 'produce': {
      // A tilted crate of fruit and veg, or bread, or flowers: heaps of colour.
      block(ctx, prop, '#4a3a26', 0.35);
      const tint = prop.colour ?? '#3fbf85';
      const heap = [tint, mix(tint, 1.25, 20), mix(tint, 0.75), '#e2a03f', '#c9313f'];
      for (let i = 0; i < Math.floor(w / 4) * 2; i += 1) {
        ctx.fillStyle = heap[(i * 3 + Math.round(y)) % heap.length]!;
        ctx.beginPath();
        ctx.arc(x + 4 + (i % Math.floor(w / 4)) * 4, y + 4 + Math.floor(i / Math.floor(w / 4)) * 5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (prop.label) {
        ctx.fillStyle = '#f2eefc';
        ctx.font = '700 4.5px "DM Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(prop.label.toUpperCase(), x + w / 2, y + h - 4);
      }
      break;
    }
    case 'booth': {
      // A velvet banquette: a padded back along the top, a seat in front.
      const velvet = prop.colour ?? '#3a1f3a';
      block(ctx, prop, velvet, 0.5);
      ctx.fillStyle = mix(velvet, 1.35, 16);
      ctx.fillRect(x + 2, y + h * 0.5, w - 4, h * 0.24);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      for (let bx = x + w / 4; bx < x + w - 2; bx += w / 4) {
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + h * 0.5);
        ctx.stroke();
      }
      break;
    }
    case 'bottles': {
      // The back bar: shelves of bottles lit from below.
      const under = ctx.createLinearGradient(x, y + h, x, y);
      under.addColorStop(0, `${glow}55`);
      under.addColorStop(1, `${glow}00`);
      ctx.fillStyle = under;
      ctx.fillRect(x, y - h * 0.4, w, h * 1.4);
      ctx.fillStyle = mix(trim, 0.7);
      ctx.fillRect(x, y + h - 2, w, 2);
      const glass = ['#4fd6ff', '#ffce6b', '#3fbf85', '#f0e6d8', '#ff5fa8', '#e2a03f', '#9a6bff'];
      for (let i = 0; i < Math.floor((w - 2) / 3); i += 1) {
        ctx.fillStyle = glass[(i * 3) % glass.length]!;
        ctx.globalAlpha = 0.85;
        const bh = h * (0.55 + ((i * 7) % 3) * 0.12);
        ctx.fillRect(x + 2 + i * 3, y + h - 2 - bh, 1.8, bh);
        ctx.fillRect(x + 2.5 + i * 3, y + h - 2 - bh - 1.6, 0.8, 1.6);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'oven': {
      // A wood-fired oven: a dome with a glowing mouth.
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.6, w * 0.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x, y + h * 0.6, w, h * 0.4);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.6, w * 0.5, Math.PI, Math.PI * 2);
      ctx.stroke();
      const fire = ctx.createRadialGradient(x + w / 2, y + h * 0.7, 1, x + w / 2, y + h * 0.7, w * 0.3);
      fire.addColorStop(0, '#ffe08a');
      fire.addColorStop(0.5, '#ff7a2a');
      fire.addColorStop(1, '#3a1208');
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.72, w * 0.26, Math.PI, Math.PI * 2);
      ctx.fill();
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
