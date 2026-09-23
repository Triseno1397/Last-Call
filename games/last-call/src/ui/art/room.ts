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
  checker: '#e8e2d8',
  marble: '#e4e1ee',
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
      ctx.fillStyle = prop.colour ?? mix(trim, 1.2, 10);
      ctx.fill();
      if (prop.colour) {
        // A vinyl seat catches the light along its top edge.
        ctx.fillStyle = mix(prop.colour, 1.35, 30);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.38, w * 0.24, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
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
      const tint = prop.colour ?? glow;
      const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, w * 0.8);
      aura.addColorStop(0, `${tint}88`);
      aura.addColorStop(1, `${tint}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 0.4, y - h * 1.6, w * 1.8, h * 4);
      if (prop.label) {
        ctx.fillStyle = tint;
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
    case 'led_strip': {
      // A run of LED tape: a hard bright line with a soft aura either side.
      const tint = prop.colour ?? glow;
      const aura = ctx.createLinearGradient(x, y - h * 6, x, y + h * 7);
      aura.addColorStop(0, `${tint}00`);
      aura.addColorStop(0.5, `${tint}55`);
      aura.addColorStop(1, `${tint}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x, y - h * 6, w, h * 13);
      ctx.fillStyle = tint;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x, y + h * 0.3, w, h * 0.35);
      break;
    }
    case 'lantern': {
      // A red paper lantern with the character painted on it, glowing.
      const tint = prop.colour ?? glow;
      const aura = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, w * 2.2);
      aura.addColorStop(0, `${tint}77`);
      aura.addColorStop(1, `${tint}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 2, y - w * 2, w * 5, h + w * 4);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + w / 2 - 0.5, y - 4, 1, 4);
      ctx.fillStyle = mix(tint, 1.1, 20);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x, y, w, 1.5);
      ctx.fillRect(x, y + h - 1.5, w, 1.5);
      ctx.fillStyle = '#1a0608';
      ctx.font = `700 ${Math.max(6, h * 0.5)}px "Space Grotesk", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('赤', x + w / 2, y + h / 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
      break;
    }
    case 'blossom': {
      // A canopy of cherry blossom pressed against the ceiling, lit pink.
      const aura = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, w * 0.7);
      aura.addColorStop(0, 'rgba(255, 80, 140, 0.35)');
      aura.addColorStop(1, 'rgba(255, 80, 140, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 0.3, y - h, w * 1.6, h * 3);
      const pinks = ['#ff3b7a', '#ff6fa0', '#ff9ac2', '#e0245e', '#ffb3d1'];
      for (let i = 0; i < Math.floor(w / 3) * 3; i += 1) {
        const px = x + ((i * 37) % Math.max(1, w - 6)) + 3;
        const py = y + ((i * 53) % Math.max(1, h - 4)) + 2;
        ctx.fillStyle = pinks[(i * 7) % pinks.length]!;
        ctx.beginPath();
        ctx.arc(px, py, 2.6 + ((i * 3) % 3) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3a1418';
      ctx.fillRect(x + w * 0.45, y + h * 0.3, 1.2, h * 0.7);
      break;
    }
    case 'cocoon': {
      // A tall wicker cocoon chair: a dark rounded shell with a lattice and
      // a bright seat inside.
      const shell = '#1c1410';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.95, w * 0.5, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shell;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h * 0.35);
      ctx.quadraticCurveTo(x + w / 2, y - h * 0.15, x + w, y + h * 0.35);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(210, 170, 110, 0.35)';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 6; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + (w / 6) * i, y + h * 0.12);
        ctx.lineTo(x + (w / 6) * i, y + h);
        ctx.stroke();
      }
      for (let i = 1; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.35 + (h * 0.65 * i) / 5);
        ctx.lineTo(x + w, y + h * 0.35 + (h * 0.65 * i) / 5);
        ctx.stroke();
      }
      ctx.fillStyle = prop.colour ?? '#e2c23f';
      ctx.fillRect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.3);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h * 0.35);
      ctx.quadraticCurveTo(x + w / 2, y - h * 0.15, x + w, y + h * 0.35);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
      break;
    }
    case 'grow_rack': {
      // Hydroponic shelves: purple light bars over trays of green.
      block(ctx, prop, '#2a2440', 0.18);
      const tall = h > w;
      const bars = Math.max(2, Math.floor((tall ? h : w) / 12));
      for (let i = 0; i < bars; i += 1) {
        const bx = tall ? x + 2 : x + 2 + (i * (w - 4)) / bars;
        const by = tall ? y + 2 + (i * (h - 4)) / bars : y + 2;
        const bw = tall ? w - 4 : (w - 4) / bars - 2;
        const bh = tall ? (h - 4) / bars - 2 : h - 4;
        const light = ctx.createLinearGradient(bx, by, bx, by + bh);
        light.addColorStop(0, '#ff7ad9');
        light.addColorStop(0.35, 'rgba(255, 122, 217, 0.25)');
        light.addColorStop(1, 'rgba(120, 60, 200, 0.1)');
        ctx.fillStyle = light;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#ffd6f2';
        ctx.fillRect(bx, by, bw, 1.2);
        // Trays of leaves along the bottom of each shelf.
        for (let lx = bx + 2; lx < bx + bw - 2; lx += 4) {
          ctx.fillStyle = ['#3fbf85', '#7fd67a', '#2f8f5a'][Math.round(lx) % 3]!;
          ctx.beginPath();
          ctx.arc(lx + 1, by + bh - 2.5, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'ring': {
      // A ring of light on the ceiling, doubled in the mirror above it.
      const cx = x + w / 2;
      const cy = y + h / 2;
      const aura = ctx.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.9);
      aura.addColorStop(0, 'rgba(255, 250, 255, 0.45)');
      aura.addColorStop(1, 'rgba(255, 250, 255, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(x - w * 0.5, y - h, w * 2, h * 3);
      for (const [rx, ry, width] of [
        [w * 0.5, h * 0.5, 2.2],
        [w * 0.34, h * 0.32, 1.4],
      ] as const) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = prop.colour ?? glow;
      ctx.font = '700 4px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MERIDIAN · MERIDIAN', cx, cy + h * 0.5 + 2.5);
      break;
    }
    case 'shoji': {
      // A lit paper screen: warm glow behind a dark lattice.
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(x, y, w, h);
      const warm = ctx.createLinearGradient(x, y, x, y + h);
      warm.addColorStop(0, 'rgba(255, 170, 90, 0.5)');
      warm.addColorStop(1, 'rgba(255, 220, 150, 0)');
      ctx.fillStyle = warm;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#3a1814';
      ctx.lineWidth = 1.2;
      for (let gx = x; gx <= x + w; gx += w / 4) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
        ctx.stroke();
      }
      for (let gy = y; gy <= y + h; gy += h / 3) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
      }
      const spill = ctx.createLinearGradient(x, y + h, x, y + h * 2.2);
      spill.addColorStop(0, 'rgba(255, 190, 100, 0.28)');
      spill.addColorStop(1, 'rgba(255, 190, 100, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(x, y + h, w, h * 1.2);
      break;
    }
    case 'cityview': {
      // Floor-to-ceiling glass with the city behind it: towers in silhouette,
      // pricked with pink and blue windows, and a glow that spills inside.
      const sky = ctx.createLinearGradient(x, y, x, y + h);
      sky.addColorStop(0, '#0a0620');
      sky.addColorStop(1, '#2a0f4a');
      ctx.fillStyle = sky;
      ctx.fillRect(x, y, w, h);
      const lights = ['#ff5fa8', '#4fd6ff', '#ffce6b', '#9a6bff'];
      for (let i = 0; i < Math.floor(w / 7); i += 1) {
        const tx = x + 2 + i * 7 + ((i * 3) % 3);
        const th = h * (0.35 + ((i * 5) % 4) * 0.15);
        ctx.fillStyle = '#120a26';
        ctx.fillRect(tx, y + h - th, 5, th);
        for (let wy = y + h - th + 2; wy < y + h - 2; wy += 3) {
          if ((i * 7 + Math.round(wy)) % 5 < 3) {
            ctx.fillStyle = lights[(i + Math.round(wy)) % lights.length]!;
            ctx.fillRect(tx + 1 + ((i + Math.round(wy)) % 2) * 2, wy, 1.2, 1.5);
          }
        }
      }
      const haze = ctx.createLinearGradient(x, y + h * 0.4, x, y + h);
      haze.addColorStop(0, 'rgba(255, 95, 168, 0)');
      haze.addColorStop(1, 'rgba(255, 95, 168, 0.35)');
      ctx.fillStyle = haze;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = mix(trim, 1.6, 30);
      ctx.lineWidth = 1.4;
      for (let gx = x; gx <= x + w + 0.1; gx += w / 4) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
        ctx.stroke();
      }
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      const spill = ctx.createLinearGradient(x, y + h, x, y + h * 2.4);
      spill.addColorStop(0, 'rgba(255, 95, 168, 0.28)');
      spill.addColorStop(1, 'rgba(79, 214, 255, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(x, y + h, w, h * 1.4);
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
    if (floor.kind === 'checker') {
      // Black and cream, half-tile squares, warm from the lights above.
      const c = TILE / 2;
      for (let cx = x, i = 0; cx < x + w; cx += c, i += 1) {
        for (let cy = y, j = 0; cy < y + h; cy += c, j += 1) {
          ctx.fillStyle = (i + j) % 2 === 0 ? '#1a1a1e' : '#e8e2d8';
          ctx.fillRect(cx, cy, c, c);
        }
      }
      ctx.fillStyle = 'rgba(255, 211, 107, 0.12)';
      ctx.fillRect(x, y, w, h);
    }
    if (floor.kind === 'marble') {
      // Pale stone with a few grey veins and a sheen from the rings above.
      ctx.strokeStyle = 'rgba(120, 110, 150, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        const vx = x + ((i * 73) % w);
        ctx.moveTo(vx, y);
        ctx.bezierCurveTo(vx + 20, y + h * 0.3, vx - 25, y + h * 0.6, vx + 10, y + h);
        ctx.stroke();
      }
      const sheen = ctx.createLinearGradient(x, y, x, y + h);
      sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
      sheen.addColorStop(1, 'rgba(180, 140, 255, 0.08)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h);
    }
  }

  // The wall band across the top, so the room has a back to it.
  ctx.fillStyle = mix(def.palette.wall, 0.8);
  ctx.fillRect(0, 0, W, 2 * TILE);
  if (def.ceiling === 'mirror') {
    // A mirrored ceiling: the room's own colours smeared back at it, with a
    // hard bright edge where the glass meets the wall.
    const reflect = ctx.createLinearGradient(0, 0, 0, 2 * TILE);
    reflect.addColorStop(0, mix(def.palette.trim, 1.3, 30));
    reflect.addColorStop(0.5, `${def.palette.glow}44`);
    reflect.addColorStop(1, mix(def.palette.wall, 1.1, 10));
    ctx.fillStyle = reflect;
    ctx.fillRect(0, 0, W, 2 * TILE);
    for (const prop of def.props) {
      if (prop.kind !== 'table' && prop.kind !== 'booth' && prop.kind !== 'counter' && prop.kind !== 'armchair' && prop.kind !== 'cocoon') continue;
      ctx.fillStyle = `${prop.colour ?? def.palette.trim}55`;
      ctx.fillRect(prop.x * TILE, TILE * 0.5, prop.w * TILE, TILE * 0.9);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 2 * TILE - 4, W, 1);
  }
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
