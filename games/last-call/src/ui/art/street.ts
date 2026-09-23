/**
 * Painting the block.
 *
 * Everything static about the street is drawn once here into an offscreen
 * canvas: surfaces, buildings, street furniture. The frame loop blits it and
 * draws only what moves on top. Same cel-shaded treatment as the characters
 * and the rooms — flat fills, one hard shadow edge, a keyline on anything
 * with a silhouette — so the world and the people in it look like one thing.
 *
 * Buildings are drawn from their style rather than one generic box: a shop
 * gets a shopfront on whichever side faces the pavement, with a big window,
 * a door, an awning and a sign; a block gets window rows and rooftop plant; a
 * house gets bays and a pitched roofline; an industrial unit gets corrugation
 * and a roller door; a civic front gets columns and a marquee. Detail is what
 * makes a street somewhere rather than a diagram of one.
 */
import type { CityBuilding, CityProp, CitySpot } from '@/content/city';
import { CITY_BUILDINGS, CITY_HEIGHT, CITY_PROPS, CITY_SURFACES, CITY_WIDTH, TILE } from '@/content/city';
import { isWalkable } from '@/engine/city';

const W = CITY_WIDTH * TILE;
const H = CITY_HEIGHT * TILE;

const INK = 'rgba(8, 6, 16, 0.85)';

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

/** Deterministic noise, so texture is the same every visit and every frame. */
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string): void {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, h);
}

function keyline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, width = 1): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

const SURFACE: Readonly<Record<string, string>> = {
  road: '#12111c',
  pavement: '#22202e',
  plaza: '#1e2030',
  park: '#17261c',
  water: '#0b1626',
  crossing: '#12111c',
};

function paintSurface(ctx: CanvasRenderingContext2D, spot: CitySpot): void {
  const x = spot.x * TILE;
  const y = spot.y * TILE;
  const w = spot.w * TILE;
  const h = spot.h * TILE;
  rect(ctx, x, y, w, h, SURFACE[spot.kind] ?? '#1a1826');

  switch (spot.kind) {
    case 'road': {
      // Wet asphalt: a cold sheen across it, then the speckle.
      const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
      sheen.addColorStop(0, 'rgba(79, 214, 255, 0.06)');
      sheen.addColorStop(0.5, 'rgba(255, 95, 168, 0.05)');
      sheen.addColorStop(1, 'rgba(154, 107, 255, 0.06)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      for (let i = 0; i < (w * h) / 90; i += 1) {
        const px = x + noise(i, spot.x) * w;
        const py = y + noise(spot.y, i) * h;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      break;
    }
    case 'pavement': {
      // Paving slabs.
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1;
      const slab = TILE / 2;
      for (let px = x; px <= x + w; px += slab) {
        ctx.beginPath();
        ctx.moveTo(px + 0.5, y);
        ctx.lineTo(px + 0.5, y + h);
        ctx.stroke();
      }
      for (let py = y; py <= y + h; py += slab) {
        ctx.beginPath();
        ctx.moveTo(x, py + 0.5);
        ctx.lineTo(x + w, py + 0.5);
        ctx.stroke();
      }
      // Kerb: a lighter lip on the side that meets a road.
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      if (!isWalkable(spot.x + spot.w / 2, spot.y + spot.h + 0.5) || true) {
        // Draw both long edges; the one against a building is hidden by it.
        ctx.fillRect(x, y, w, 1.5);
        ctx.fillRect(x, y + h - 1.5, w, 1.5);
      }
      break;
    }
    case 'plaza': {
      // Dark marble with gold veins, from the plaza in the references.
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i += 1) {
        const vx = x + ((i * 61) % w);
        ctx.beginPath();
        ctx.moveTo(vx, y);
        ctx.bezierCurveTo(vx + 30, y + h * 0.3, vx - 35, y + h * 0.7, vx + 15, y + h);
        ctx.stroke();
      }
      // Flagstones in a staggered bond.
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      const fw = TILE;
      const fh = TILE / 2;
      for (let row = 0; row * fh < h; row += 1) {
        const py = y + row * fh;
        ctx.beginPath();
        ctx.moveTo(x, py + 0.5);
        ctx.lineTo(x + w, py + 0.5);
        ctx.stroke();
        const offset = row % 2 === 0 ? 0 : fw / 2;
        for (let px = x + offset; px < x + w; px += fw) {
          ctx.beginPath();
          ctx.moveTo(px + 0.5, py);
          ctx.lineTo(px + 0.5, py + fh);
          ctx.stroke();
        }
      }
      break;
    }
    case 'park': {
      // Grass: two tones of blade, a few flowers.
      for (let i = 0; i < (w * h) / 22; i += 1) {
        const px = x + noise(i * 3, spot.x + 1) * w;
        const py = y + noise(spot.y + 2, i * 5) * h;
        ctx.fillStyle = noise(i, 7) > 0.5 ? 'rgba(120, 200, 140, 0.16)' : 'rgba(60, 140, 90, 0.18)';
        ctx.fillRect(px, py, 1.2, 3);
      }
      for (let i = 0; i < (w * h) / 900; i += 1) {
        const px = x + noise(i * 11, 3) * w;
        const py = y + noise(5, i * 13) * h;
        ctx.fillStyle = noise(i, 9) > 0.5 ? '#ff9ac2' : '#ffe07a';
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'water': {
      ctx.strokeStyle = 'rgba(120, 190, 255, 0.14)';
      ctx.lineWidth = 1;
      for (let py = y + 5; py < y + h; py += 8) {
        ctx.beginPath();
        for (let px = x; px <= x + w; px += 6) {
          const wave = Math.sin((px + py * 3) / 9) * 1.4;
          if (px === x) ctx.moveTo(px, py + wave);
          else ctx.lineTo(px, py + wave);
        }
        ctx.stroke();
      }
      // A faint neon reflection, the way canals catch the street.
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, 'rgba(255, 95, 168, 0.08)');
      gradient.addColorStop(1, 'rgba(79, 214, 255, 0.04)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      break;
    }
    case 'crossing': {
      // Zebra stripes across the narrow axis.
      ctx.fillStyle = 'rgba(240, 236, 250, 0.55)';
      if (w >= h) {
        for (let px = x + 3; px < x + w - 2; px += 10) ctx.fillRect(px, y + 2, 6, h - 4);
      } else {
        for (let py = y + 3; py < y + h - 2; py += 10) ctx.fillRect(x + 2, py, w - 4, 6);
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

/** Which edge of the building meets a pavement: that is where the front goes. */
function frontEdge(building: CityBuilding): 'bottom' | 'top' | 'left' | 'right' {
  const cx = building.x + building.w / 2;
  const cy = building.y + building.h / 2;
  if (isWalkable(cx, building.y + building.h + 0.5)) return 'bottom';
  if (isWalkable(cx, building.y - 0.5)) return 'top';
  if (isWalkable(building.x + building.w + 0.5, cy)) return 'right';
  if (isWalkable(building.x - 0.5, cy)) return 'left';
  return 'bottom';
}

function windowRows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: boolean,
  seed: number,
  pitch = 14,
): void {
  for (let wx = x + 6; wx < x + w - 8; wx += pitch) {
    for (let wy = y + 6; wy < y + h - 6; wy += 13) {
      const on = lit && noise(wx + seed, wy) > 0.32;
      // Frame, glass, sill.
      rect(ctx, wx - 1, wy - 1, 8, 9, 'rgba(0,0,0,0.5)');
      rect(ctx, wx, wy, 6, 7, on ? '#ffd68a' : '#0f0d1a');
      if (on) {
        rect(ctx, wx, wy, 6, 3, '#ffe7b3');
        // A curtain or a shape in some of them, so lit windows are not all alike.
        if (noise(wy, wx + seed) > 0.6) rect(ctx, wx + 3, wy, 3, 7, 'rgba(120, 60, 40, 0.5)');
      }
      rect(ctx, wx - 1, wy + 8, 8, 1, 'rgba(255,255,255,0.14)');
    }
  }
}

function shopfront(
  ctx: CanvasRenderingContext2D,
  building: CityBuilding,
  edge: 'bottom' | 'top' | 'left' | 'right',
): void {
  const x = building.x * TILE;
  const y = building.y * TILE;
  const w = building.w * TILE;
  const h = building.h * TILE;
  const ground = TILE * 1.4;
  const awning = building.awning ?? mix(building.colour, 1.4, 20);

  // Only bottom- and top-facing fronts are needed by the current block; the
  // side cases fall back to a plain façade with windows.
  const fy = edge === 'bottom' ? y + h - ground : y;
  const signY = edge === 'bottom' ? fy - 9 : fy + ground;

  // Ground floor: a dark band with a big lit window and a door.
  rect(ctx, x, fy, w, ground, mix(building.colour, 0.6));
  const doorW = 9;
  const doorX = x + w / 2 - doorW / 2;
  const glassX1 = x + 4;
  const glassW1 = doorX - 4 - glassX1;
  const glassX2 = doorX + doorW + 4;
  const glassW2 = x + w - 4 - glassX2;
  for (const [gx, gw] of [
    [glassX1, glassW1],
    [glassX2, glassW2],
  ] as const) {
    if (gw < 6) continue;
    rect(ctx, gx - 1, fy + 3, gw + 2, ground - 6, 'rgba(0,0,0,0.5)');
    const glass = ctx.createLinearGradient(gx, fy, gx, fy + ground);
    glass.addColorStop(0, mix(awning, 0.5, 30));
    glass.addColorStop(1, '#1a1626');
    ctx.fillStyle = glass;
    ctx.fillRect(gx, fy + 4, gw, ground - 8);
    // Window bar and a reflection stripe.
    rect(ctx, gx, fy + ground / 2, gw, 1, 'rgba(0,0,0,0.5)');
    rect(ctx, gx + 2, fy + 5, 2, ground - 10, 'rgba(255,255,255,0.12)');
  }
  // Door.
  rect(ctx, doorX - 1, fy + 2, doorW + 2, ground - 2, 'rgba(0,0,0,0.6)');
  rect(ctx, doorX, fy + 3, doorW, ground - 3, mix(awning, 0.55, 10));
  rect(ctx, doorX + doorW - 3, fy + ground / 2, 1.5, 1.5, '#ffe7b3');

  // Awning: a striped strip along the front edge.
  const awningY = edge === 'bottom' ? fy - 4 : fy + ground;
  rect(ctx, x + 1, awningY, w - 2, 5, awning);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let sx = x + 1; sx < x + w - 1; sx += 8) ctx.fillRect(sx, awningY, 4, 5);
  // Scalloped lower edge on the pavement side.
  ctx.fillStyle = awning;
  for (let sx = x + 4; sx < x + w - 2; sx += 6) {
    ctx.beginPath();
    ctx.arc(sx, edge === 'bottom' ? awningY + 5 : awningY, 3, 0, Math.PI, edge !== 'bottom');
    ctx.fill();
  }

  // Sign board above the awning, with the name in neon.
  const sign = building.sign ?? building.name;
  const boardY = edge === 'bottom' ? signY - 7 : signY + 6;
  rect(ctx, x + 3, boardY, w - 6, 9, mix(building.colour, 0.45));
  keyline(ctx, x + 3, boardY, w - 6, 9);
  neonText(ctx, sign.toUpperCase(), x + w / 2, boardY + 4.5, awning, Math.min(7, Math.max(5, (w - 12) / (sign.length * 0.62))));

  // Stacked sign boxes up the side of the façade, each its own colour, the
  // way a night street is signed in the references.
  if (building.signs?.length) {
    const boxW = Math.min(26, w - 10);
    const boxH = 8;
    const bx = x + w - boxW - 4;
    let by = edge === 'bottom' ? boardY - 12 : boardY + 12;
    for (const box of building.signs) {
      rect(ctx, bx + 1, by + 1, boxW, boxH, 'rgba(0,0,0,0.5)');
      rect(ctx, bx, by, boxW, boxH, mix(box.colour, 0.42, 10));
      const aura = ctx.createRadialGradient(bx + boxW / 2, by + boxH / 2, 1, bx + boxW / 2, by + boxH / 2, boxW);
      aura.addColorStop(0, `${box.colour}88`);
      aura.addColorStop(1, `${box.colour}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(bx - boxW, by - boxH * 2, boxW * 3, boxH * 5);
      keyline(ctx, bx, by, boxW, boxH);
      neonText(ctx, box.text, bx + boxW / 2, by + boxH / 2, box.colour, Math.min(6, (boxW - 4) / (box.text.length * 0.62)));
      by += edge === 'bottom' ? -(boxH + 3) : boxH + 3;
    }
  }
}

/** Glowing lettering: the glyphs drawn twice, once soft and once hard. */
function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  colour: string,
  size: number,
): void {
  ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = colour;
  ctx.shadowBlur = 6;
  ctx.fillStyle = colour;
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = mix(colour, 1.5, 90);
  ctx.fillText(text, cx, cy);
}

/** An LED strip along the roofline and down the front corner. */
function ledStrip(ctx: CanvasRenderingContext2D, building: CityBuilding, edge: 'bottom' | 'top' | 'left' | 'right'): void {
  if (!building.led) return;
  const x = building.x * TILE;
  const y = building.y * TILE;
  const w = building.w * TILE;
  const h = building.h * TILE;
  const ly = edge === 'bottom' ? y + 1 : y + h - 2;
  const aura = ctx.createLinearGradient(x, ly - 8, x, ly + 9);
  aura.addColorStop(0, `${building.led}00`);
  aura.addColorStop(0.5, `${building.led}66`);
  aura.addColorStop(1, `${building.led}00`);
  ctx.fillStyle = aura;
  ctx.fillRect(x, ly - 8, w, 17);
  rect(ctx, x, ly, w, 1.6, building.led);
  rect(ctx, x, ly + 0.4, w, 0.6, 'rgba(255,255,255,0.75)');
  rect(ctx, x + w * 0.72, y, 1.2, h, `${building.led}99`);
}

/** A holographic advertising panel on a tall block: translucent, scanlined. */
function billboard(ctx: CanvasRenderingContext2D, building: CityBuilding): void {
  if (!building.billboard) return;
  const x = building.x * TILE;
  const y = building.y * TILE;
  const w = building.w * TILE;
  const h = building.h * TILE;
  const bw = Math.min(w - 8, 56);
  const bh = Math.min(h * 0.45, 60);
  const bx = x + (w - bw) / 2;
  const by = y + 12;
  const panel = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  panel.addColorStop(0, 'rgba(79, 214, 255, 0.55)');
  panel.addColorStop(1, 'rgba(255, 95, 168, 0.55)');
  ctx.fillStyle = panel;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let sy = by; sy < by + bh; sy += 3) ctx.fillRect(bx, sy, bw, 1);
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  const aura = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, 4, bx + bw / 2, by + bh / 2, bw);
  aura.addColorStop(0, 'rgba(79, 214, 255, 0.28)');
  aura.addColorStop(1, 'rgba(79, 214, 255, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(bx - bw, by - bh, bw * 3, bh * 3);
  const lines = building.billboard.split(' ');
  lines.forEach((line, i) => {
    neonText(ctx, line, bx + bw / 2, by + bh / 2 + (i - (lines.length - 1) / 2) * 9, '#e8fbff', Math.min(9, (bw - 6) / (line.length * 0.62)));
  });
}

function paintBuilding(ctx: CanvasRenderingContext2D, building: CityBuilding): void {
  const x = building.x * TILE;
  const y = building.y * TILE;
  const w = building.w * TILE;
  const h = building.h * TILE;
  const edge = frontEdge(building);
  const seed = building.x * 7 + building.y * 13;

  // Drop shadow, then the façade with a flat darker side.
  rect(ctx, x + 4, y + 6, w, h, 'rgba(0,0,0,0.5)');
  rect(ctx, x, y, w, h, building.colour);
  rect(ctx, x + w * 0.72, y, w * 0.28, h, mix(building.colour, 0.8));

  switch (building.style) {
    case 'shop': {
      // Upper floor windows above (or below) the shopfront.
      const ground = TILE * 1.4;
      if (edge === 'bottom') windowRows(ctx, x, y, w, h - ground - 10, building.windows, seed);
      else windowRows(ctx, x, y + ground + 16, w, h - ground - 16, building.windows, seed);
      shopfront(ctx, building, edge);
      ledStrip(ctx, building, edge);
      break;
    }
    case 'block': {
      windowRows(ctx, x, y + 8, w, h - 8, building.windows, seed, 12);
      billboard(ctx, building);
      ledStrip(ctx, building, edge);
      // Rooftop plant and a parapet.
      rect(ctx, x, y, w, 6, mix(building.colour, 1.25, 10));
      rect(ctx, x + w * 0.2, y - 5, w * 0.25, 5, mix(building.colour, 0.9));
      rect(ctx, x + w * 0.6, y - 3, w * 0.15, 3, mix(building.colour, 0.9));
      // Entrance at the front edge.
      const ex = x + w / 2 - 6;
      const ey = edge === 'bottom' ? y + h - 12 : y + 6;
      rect(ctx, ex, ey, 12, 12, 'rgba(0,0,0,0.55)');
      rect(ctx, ex + 1, ey + 1, 10, 11, '#3a3550');
      break;
    }
    case 'house': {
      // Pitched roofline suggested by a lighter band and a ridge.
      rect(ctx, x, y, w, 8, mix(building.colour, 1.3, 14));
      rect(ctx, x, y + 7, w, 1.5, 'rgba(0,0,0,0.5)');
      windowRows(ctx, x, y + 10, w, h - 10 - (edge === 'bottom' ? 14 : 0), building.windows, seed, 16);
      // Bay windows on the front, and doors between them.
      const fy = edge === 'bottom' ? y + h - 14 : y + 10;
      for (let bx = x + 8; bx < x + w - 12; bx += 26) {
        rect(ctx, bx - 1, fy - 1, 12, 13, 'rgba(0,0,0,0.5)');
        rect(ctx, bx, fy, 10, 11, building.windows ? '#ffd68a' : '#0f0d1a');
        rect(ctx, bx, fy, 10, 4, 'rgba(255,255,255,0.25)');
        rect(ctx, bx + 15, fy + 2, 7, 11, mix(building.colour, 0.4));
        rect(ctx, bx + 20, fy + 8, 1.5, 1.5, '#ffe7b3');
      }
      break;
    }
    case 'industrial': {
      // Corrugation and a roller door.
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let cx = x + 3; cx < x + w; cx += 5) ctx.fillRect(cx, y + 4, 2, h - 4);
      rect(ctx, x, y, w, 4, mix(building.colour, 1.2, 8));
      billboard(ctx, building);
      ledStrip(ctx, building, edge);
      const rw = Math.min(28, w * 0.4);
      const rx = x + w / 2 - rw / 2;
      const ry = edge === 'bottom' ? y + h - 16 : y + 4;
      rect(ctx, rx - 1, ry - 1, rw + 2, 17, 'rgba(0,0,0,0.55)');
      rect(ctx, rx, ry, rw, 16, '#2a2a36');
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let ly = ry + 3; ly < ry + 16; ly += 4) ctx.fillRect(rx, ly, rw, 1);
      // Painted name on the wall.
      if (building.sign) {
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.font = `700 ${Math.min(9, w / (building.sign.length * 0.7))}px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(building.sign, x + w / 2, y + (edge === 'bottom' ? h * 0.35 : h * 0.7));
      }
      break;
    }
    case 'civic': {
      // Columns along the front and a marquee with bulbs.
      const fy = edge === 'bottom' ? y + h - 18 : y;
      for (let cx = x + 6; cx < x + w - 4; cx += 12) {
        rect(ctx, cx, fy, 4, 18, mix(building.colour, 1.35, 20));
        rect(ctx, cx + 3, fy, 1, 18, 'rgba(0,0,0,0.4)');
      }
      const my = edge === 'bottom' ? fy - 8 : fy + 18;
      rect(ctx, x + 2, my, w - 4, 8, '#1a1220');
      keyline(ctx, x + 2, my, w - 4, 8);
      for (let bx = x + 5; bx < x + w - 3; bx += 5) {
        ctx.fillStyle = noise(bx, my) > 0.3 ? '#ffe7b3' : '#8a7a5a';
        ctx.beginPath();
        ctx.arc(bx, my + 1.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, my + 6.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (building.sign) {
        ctx.fillStyle = '#ffe7b3';
        ctx.font = `700 6px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(building.sign, x + w / 2, my + 4);
      }
      windowRows(ctx, x, edge === 'bottom' ? y + 4 : y + 30, w, h - 34, building.windows, seed, 16);
      ledStrip(ctx, building, edge);
      break;
    }
    case 'house': {
      ledStrip(ctx, building, edge);
      break;
    }
  }

  keyline(ctx, x, y, w, h);
}

/**
 * Neon on a wet street: every lit sign smears down the pavement and across
 * the road in its own colour. Painted after the buildings, under the props,
 * with additive blending so overlapping colours add up rather than muddy.
 */
function paintReflections(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const building of CITY_BUILDINGS) {
    const colours = [
      ...(building.signs?.map((box) => box.colour) ?? []),
      ...(building.awning ? [building.awning] : []),
      ...(building.led ? [building.led] : []),
    ];
    if (colours.length === 0) continue;
    const edge = frontEdge(building);
    const x = building.x * TILE;
    const w = building.w * TILE;
    const reach = TILE * 6;
    const from = edge === 'bottom' ? (building.y + building.h) * TILE : building.y * TILE;
    const to = edge === 'bottom' ? from + reach : from - reach;
    colours.forEach((colour, i) => {
      const sx = x + w * (0.2 + (0.6 * i) / Math.max(1, colours.length - 1));
      const sw = Math.max(10, w * 0.28);
      const streak = ctx.createLinearGradient(0, from, 0, to);
      streak.addColorStop(0, `${colour}70`);
      streak.addColorStop(0.45, `${colour}26`);
      streak.addColorStop(1, `${colour}00`);
      ctx.fillStyle = streak;
      ctx.fillRect(sx - sw / 2, Math.min(from, to), sw, reach);
      // A brighter core down the middle, the way a sign sits in a puddle.
      const core = ctx.createLinearGradient(0, from, 0, to);
      core.addColorStop(0, `${colour}55`);
      core.addColorStop(0.3, `${colour}18`);
      core.addColorStop(1, `${colour}00`);
      ctx.fillStyle = core;
      ctx.fillRect(sx - sw / 6, Math.min(from, to), sw / 3, reach);
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Street furniture
// ---------------------------------------------------------------------------

function paintProp(ctx: CanvasRenderingContext2D, prop: CityProp): void {
  const x = prop.x * TILE;
  const y = prop.y * TILE;
  ctx.lineJoin = 'round';

  const shadow = (w: number, h: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.45, w, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  switch (prop.kind) {
    case 'lamp': {
      shadow(4, 3);
      rect(ctx, x - 1, y - 26, 2, 27, '#2a2838');
      rect(ctx, x - 3, y - 29, 6, 4, '#3a3850');
      ctx.fillStyle = '#ffe7b3';
      ctx.beginPath();
      ctx.ellipse(x, y - 27, 3, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bench': {
      shadow(16, 5);
      rect(ctx, x - 15, y - 4, 30, 5, '#4a3626');
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let sx = x - 13; sx < x + 14; sx += 5) ctx.fillRect(sx, y - 4, 1, 5);
      rect(ctx, x - 15, y - 9, 30, 4, '#5a4230');
      rect(ctx, x - 13, y + 1, 2, 4, '#2a2030');
      rect(ctx, x + 11, y + 1, 2, 4, '#2a2030');
      keyline(ctx, x - 15, y - 9, 30, 10);
      break;
    }
    case 'bin': {
      shadow(5, 4);
      rect(ctx, x - 4, y - 9, 8, 11, '#2f3a3f');
      rect(ctx, x - 5, y - 11, 10, 3, '#3f4a50');
      keyline(ctx, x - 5, y - 11, 10, 13);
      break;
    }
    case 'tree': {
      shadow(10, 5);
      rect(ctx, x - 2, y - 12, 4, 14, '#3a2818');
      for (const [dx, dy, r, c] of [
        [0, -20, 12, '#245e3a'],
        [-8, -14, 9, '#2c6e44'],
        [8, -15, 9, '#2c6e44'],
        [0, -12, 8, '#347f50'],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
    }
    case 'fountain': {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + 2, y + 4, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y, 24, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4a4560';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 8.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1d5c6a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(160, 230, 255, 0.35)';
      for (let r = 6; r < 19; r += 5) {
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      rect(ctx, x - 3, y - 14, 6, 14, '#5a5570');
      ctx.beginPath();
      ctx.ellipse(x, y - 14, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#6a6580';
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 240, 255, 0.7)';
      for (const [dx, dy] of [
        [-3, -19],
        [0, -21],
        [3, -19],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'busstop': {
      shadow(18, 5);
      rect(ctx, x - 18, y - 22, 36, 3, '#3a3850');
      rect(ctx, x - 17, y - 19, 2, 20, '#2a2838');
      rect(ctx, x + 15, y - 19, 2, 20, '#2a2838');
      rect(ctx, x - 15, y - 19, 30, 14, 'rgba(120, 180, 255, 0.12)');
      rect(ctx, x - 14, y - 12, 12, 6, '#e8c05a');
      ctx.fillStyle = '#1a1220';
      ctx.font = '700 4px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('43', x - 8, y - 9);
      keyline(ctx, x - 18, y - 22, 36, 24);
      break;
    }
    case 'phonebox': {
      shadow(6, 4);
      rect(ctx, x - 6, y - 22, 12, 24, '#b5273f');
      rect(ctx, x - 4, y - 19, 8, 14, 'rgba(180, 220, 255, 0.28)');
      rect(ctx, x - 7, y - 24, 14, 3, '#8f1f33');
      keyline(ctx, x - 7, y - 24, 14, 27);
      break;
    }
    case 'vending': {
      shadow(8, 4);
      rect(ctx, x - 8, y - 20, 16, 22, '#2a2838');
      rect(ctx, x - 6, y - 17, 9, 14, '#0d1a22');
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 2; c += 1) {
          rect(ctx, x - 5 + c * 4, y - 16 + r * 4.5, 3, 3.5, r === 1 ? '#7fe0ff' : c ? '#ff5fa8' : '#ffce6b');
        }
      }
      rect(ctx, x + 4, y - 16, 3, 12, '#3a3850');
      keyline(ctx, x - 8, y - 20, 16, 22);
      break;
    }
    case 'bikerack': {
      shadow(18, 4);
      ctx.strokeStyle = '#8a8aa0';
      ctx.lineWidth = 1.6;
      for (let bx = x - 14; bx <= x + 14; bx += 7) {
        ctx.beginPath();
        ctx.arc(bx, y - 2, 4, Math.PI, 0);
        ctx.stroke();
      }
      // Two bikes, a wheel each visible.
      ctx.strokeStyle = '#3a3850';
      for (const bx of [x - 10, x + 4]) {
        ctx.beginPath();
        ctx.arc(bx, y - 3, 3.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx + 7, y - 3, 3.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'mural': {
      // A whale on the warehouse wall, painted in flat blocks.
      const mx = x - 60;
      const my = y - 30;
      rect(ctx, mx, my, 120, 26, '#1b2a40');
      ctx.fillStyle = '#4fb8d6';
      ctx.beginPath();
      ctx.ellipse(mx + 55, my + 14, 42, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mx + 95, my + 12);
      ctx.lineTo(mx + 112, my + 4);
      ctx.lineTo(mx + 110, my + 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cfefff';
      ctx.beginPath();
      ctx.ellipse(mx + 50, my + 17, 36, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0e1620';
      ctx.beginPath();
      ctx.arc(mx + 22, my + 12, 1.6, 0, Math.PI * 2);
      ctx.fill();
      keyline(ctx, mx, my, 120, 26);
      break;
    }
    case 'kiosk': {
      shadow(18, 8);
      rect(ctx, x - 18, y - 22, 36, 26, '#4a3a2a');
      rect(ctx, x - 17, y - 14, 34, 1.5, 'rgba(0,0,0,0.4)');
      rect(ctx, x - 15, y - 12, 30, 9, '#1a1420');
      rect(ctx, x - 13, y - 10, 26, 5, '#ffb45a');
      rect(ctx, x - 20, y - 26, 40, 5, '#c96a3f');
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let sx = x - 20; sx < x + 20; sx += 8) ctx.fillRect(sx, y - 26, 4, 5);
      ctx.fillStyle = '#1a1220';
      ctx.font = '700 4.5px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('COFFEE', x, y - 7.5);
      keyline(ctx, x - 18, y - 22, 36, 26);
      break;
    }
    case 'statue': {
      shadow(12, 6);
      rect(ctx, x - 11, y - 8, 22, 10, '#4a4560');
      rect(ctx, x - 8, y - 14, 16, 6, '#5a5570');
      // Figure silhouette, pointing.
      rect(ctx, x - 3, y - 34, 6, 20, '#6a6580');
      ctx.beginPath();
      ctx.arc(x, y - 37, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6a6580';
      ctx.fill();
      rect(ctx, x + 3, y - 30, 10, 2.5, '#6a6580');
      keyline(ctx, x - 11, y - 14, 22, 16);
      break;
    }
    case 'planter': {
      shadow(10, 4);
      rect(ctx, x - 10, y - 6, 20, 8, '#3a3040');
      for (const [dx, c] of [
        [-6, '#2c6e44'],
        [0, '#347f50'],
        [6, '#2c6e44'],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + dx, y - 9, 5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.fillStyle = '#ff9ac2';
      for (const dx of [-4, 2, 7]) {
        ctx.beginPath();
        ctx.arc(x + dx, y - 11, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      keyline(ctx, x - 10, y - 6, 20, 8);
      break;
    }
    case 'hydrant': {
      shadow(3, 2);
      rect(ctx, x - 2.5, y - 8, 5, 9, '#c9403f');
      rect(ctx, x - 4, y - 5, 8, 2, '#c9403f');
      ctx.beginPath();
      ctx.arc(x, y - 8, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#d95a5a';
      ctx.fill();
      break;
    }
    case 'sign': {
      shadow(3, 2);
      rect(ctx, x - 0.8, y - 14, 1.6, 15, '#3a3850');
      rect(ctx, x - 6, y - 19, 12, 7, '#e8e2f6');
      keyline(ctx, x - 6, y - 19, 12, 7);
      ctx.fillStyle = '#1a1220';
      ctx.fillRect(x - 4, y - 16.5, 8, 1);
      ctx.fillRect(x - 4, y - 14.5, 5, 1);
      break;
    }
    case 'bollard': {
      shadow(2.5, 2);
      rect(ctx, x - 1.5, y - 7, 3, 8, '#3a3850');
      rect(ctx, x - 1.5, y - 7, 3, 1.5, '#ffce6b');
      break;
    }
    case 'ringbar': {
      // A bar built in a ring round a tree, lit from underneath, with stools.
      const rw = TILE * 1.7;
      const rh = TILE * 1.1;
      const glowRing = ctx.createRadialGradient(x, y, rw * 0.4, x, y, rw * 1.6);
      glowRing.addColorStop(0, 'rgba(200, 245, 255, 0.4)');
      glowRing.addColorStop(1, 'rgba(200, 245, 255, 0)');
      ctx.fillStyle = glowRing;
      ctx.beginPath();
      ctx.ellipse(x, y, rw * 1.6, rh * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(x + 2, y + 4, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#e8f7ff';
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4fd6ff';
      ctx.beginPath();
      ctx.ellipse(x, y + 3, rw, rh, 0, 0, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, rw + 3.5, rh + 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // The tree in the middle, and stools round the outside.
      rect(ctx, x - 2, y - 14, 4, 16, '#3a2a1e');
      ctx.fillStyle = '#7a2a2a';
      for (const [dx, dy, r] of [[0, -18, 9], [-7, -13, 7], [7, -13, 7]] as const) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.fillStyle = '#7a3aa8';
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * (rw + 7), y + Math.sin(a) * (rh + 6), 2.6, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'holo': {
      // A floating hologram: a translucent panel with scanlines and a glyph.
      const hw = 14;
      const hh = 20;
      const hx = x - hw / 2;
      const hy = y - hh;
      const panel = ctx.createLinearGradient(hx, hy, hx, hy + hh);
      panel.addColorStop(0, 'rgba(79, 214, 255, 0.5)');
      panel.addColorStop(1, 'rgba(255, 95, 168, 0.45)');
      ctx.fillStyle = panel;
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let sy = hy; sy < hy + hh; sy += 2.5) ctx.fillRect(hx, sy, hw, 0.8);
      ctx.strokeStyle = 'rgba(220, 250, 255, 0.8)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(hx + 0.4, hy + 0.4, hw - 0.8, hh - 0.8);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x, hy + hh * 0.4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      rect(ctx, x - 4, hy + hh * 0.66, 8, 1.2, 'rgba(255,255,255,0.7)');
      rect(ctx, x - 3, hy + hh * 0.78, 6, 1.2, 'rgba(255,255,255,0.5)');
      const beam = ctx.createLinearGradient(x, hy + hh, x, y + 3);
      beam.addColorStop(0, 'rgba(79, 214, 255, 0.35)');
      beam.addColorStop(1, 'rgba(79, 214, 255, 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(hx + 3, hy + hh, hw - 6, 5);
      break;
    }
    case 'puddle': {
      // Standing water: a dark shape with the sky's colours lying in it.
      const pw = TILE * 1.6;
      const ph = TILE * 0.6;
      ctx.fillStyle = 'rgba(8, 6, 20, 0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y, pw, ph, 0, 0, Math.PI * 2);
      ctx.fill();
      const wet = ctx.createLinearGradient(x - pw, y, x + pw, y);
      wet.addColorStop(0, 'rgba(79, 214, 255, 0.28)');
      wet.addColorStop(0.5, 'rgba(255, 95, 168, 0.22)');
      wet.addColorStop(1, 'rgba(154, 107, 255, 0.28)');
      ctx.fillStyle = wet;
      ctx.beginPath();
      ctx.ellipse(x, y, pw * 0.9, ph * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, pw * 0.7, ph * 0.45, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      break;
    }
    case 'manhole': {
      ctx.beginPath();
      ctx.ellipse(x, y, 5, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2838';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }
}

// ---------------------------------------------------------------------------

/** Paint the whole block into `ctx`, sized `CITY_WIDTH × CITY_HEIGHT` tiles. */
export function paintStreet(ctx: CanvasRenderingContext2D): void {
  rect(ctx, 0, 0, W, H, '#0a0812');

  for (const spot of CITY_SURFACES) paintSurface(ctx, spot);

  // Centre dashes down the main street and the avenue.
  ctx.strokeStyle = 'rgba(255, 206, 107, 0.28)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 14]);
  ctx.beginPath();
  ctx.moveTo(0, 24.5 * TILE);
  ctx.lineTo(W, 24.5 * TILE);
  ctx.moveTo(36.5 * TILE, 0);
  ctx.lineTo(36.5 * TILE, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Buildings back to front, so a nearer one overlaps a further one.
  for (const building of [...CITY_BUILDINGS].sort((a, b) => a.y + a.h - (b.y + b.h))) {
    paintBuilding(ctx, building);
  }

  // The neon lying in the wet, before anything stands on it.
  paintReflections(ctx);

  // Furniture likewise, so a bench in front of a tree overlaps its trunk.
  for (const prop of [...CITY_PROPS].sort((a, b) => a.y - b.y)) {
    paintProp(ctx, prop);
  }
}

/**
 * Light pools under the lampposts, drawn over the night tint each frame so
 * they read as light rather than as paint on the ground.
 */
export function paintLampLight(ctx: CanvasRenderingContext2D, darkness: number): void {
  if (darkness <= 0) return;
  for (const prop of CITY_PROPS) {
    if (prop.kind !== 'lamp') continue;
    const x = prop.x * TILE;
    const y = prop.y * TILE;
    const pool = ctx.createRadialGradient(x, y + 2, 2, x, y + 2, 36);
    pool.addColorStop(0, `rgba(255, 214, 140, ${0.34 * darkness})`);
    pool.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 36, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
