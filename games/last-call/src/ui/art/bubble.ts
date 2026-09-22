/**
 * Speech bubbles, drawn into the world above a character's head.
 *
 * They live in canvas rather than in DOM elements positioned over it, because
 * the camera pans and zooms: a bubble in world space stays glued to the head
 * it belongs to for free, and a DOM bubble would need the whole transform
 * replicated in JavaScript every frame.
 *
 * Text is wrapped against a maximum width and the box is sized to the result,
 * so a one-word answer gets a small bubble and a long one grows upwards rather
 * than off the side of the screen.
 */

export type BubbleTone = 'her' | 'you' | 'thought';

export interface BubbleStyle {
  fill: string;
  stroke: string;
  text: string;
}

const TONES: Readonly<Record<BubbleTone, BubbleStyle>> = {
  her: { fill: 'rgba(26, 20, 38, 0.96)', stroke: 'rgba(255, 95, 168, 0.85)', text: '#f6f2ff' },
  you: { fill: 'rgba(16, 24, 36, 0.96)', stroke: 'rgba(79, 214, 255, 0.8)', text: '#eaf6ff' },
  thought: { fill: 'rgba(20, 18, 30, 0.9)', stroke: 'rgba(154, 146, 184, 0.5)', text: '#c9c2e0' },
};

export interface BubbleOptions {
  /** Widest the box may get, in world pixels, before wrapping. */
  maxWidth?: number;
  fontSize?: number;
  tone?: BubbleTone;
  /** 0..1 — fades and lifts the bubble as it appears. */
  progress?: number;
}

/** Split `text` into lines that each fit inside `maxWidth`. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): readonly string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draw a bubble whose tail points down at (`cx`, `tipY`) — the top of a head.
 * Returns the height it took, so a caller stacking two bubbles knows where the
 * next one starts.
 */
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  tipY: number,
  text: string,
  options: BubbleOptions = {},
): number {
  const maxWidth = options.maxWidth ?? 108;
  const fontSize = options.fontSize ?? 7;
  const tone = TONES[options.tone ?? 'her'];
  const progress = Math.max(0, Math.min(1, options.progress ?? 1));
  if (progress <= 0 || !text.trim()) return 0;

  ctx.save();
  ctx.font = `600 ${fontSize}px "DM Sans", system-ui, sans-serif`;
  ctx.textBaseline = 'top';

  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.32;
  const padX = fontSize * 0.85;
  const padY = fontSize * 0.7;
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const boxW = textWidth + padX * 2;
  const boxH = lines.length * lineHeight + padY * 2;
  const tail = fontSize * 0.9;

  // Rises slightly into place as it appears, which reads as someone speaking
  // rather than a label blinking on.
  const lift = (1 - progress) * 4;
  const boxY = tipY - tail - boxH + lift;
  const boxX = cx - boxW / 2;

  ctx.globalAlpha = progress;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = tone.fill;
  roundedRect(ctx, boxX, boxY, boxW, boxH, fontSize * 0.9);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Tail, drawn as part of the same silhouette so the outline stays unbroken.
  ctx.beginPath();
  ctx.moveTo(cx - tail * 0.75, boxY + boxH - 0.5);
  ctx.lineTo(cx, tipY + lift);
  ctx.lineTo(cx + tail * 0.75, boxY + boxH - 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = tone.stroke;
  ctx.lineWidth = 0.9;
  roundedRect(ctx, boxX, boxY, boxW, boxH, fontSize * 0.9);
  ctx.stroke();

  ctx.fillStyle = tone.text;
  ctx.textAlign = 'center';
  lines.forEach((line, index) => {
    ctx.fillText(line, cx, boxY + padY + index * lineHeight);
  });

  ctx.restore();
  return boxH + tail;
}

/**
 * The "…" a character shows while the reply is still coming back. Three dots
 * that fill in turn, so a slow answer looks like thinking rather than a hang.
 */
export function drawThinking(
  ctx: CanvasRenderingContext2D,
  cx: number,
  tipY: number,
  elapsed: number,
): void {
  const fontSize = 7;
  const boxW = 22;
  const boxH = 12;
  const tail = fontSize * 0.9;
  const boxY = tipY - tail - boxH;

  ctx.save();
  ctx.fillStyle = TONES.her.fill;
  roundedRect(ctx, cx - boxW / 2, boxY, boxW, boxH, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - tail * 0.7, boxY + boxH - 0.5);
  ctx.lineTo(cx, tipY);
  ctx.lineTo(cx + tail * 0.7, boxY + boxH - 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = TONES.her.stroke;
  ctx.lineWidth = 0.9;
  roundedRect(ctx, cx - boxW / 2, boxY, boxW, boxH, 5);
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    const pulse = (Math.sin(elapsed * 4 - i * 0.7) + 1) / 2;
    ctx.fillStyle = `rgba(246, 242, 255, ${0.32 + pulse * 0.62})`;
    ctx.beginPath();
    ctx.arc(cx - 5.2 + i * 5.2, boxY + boxH / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The read on someone, floated over their head while you talk to them.
 *
 * Two bars — interest and comfort — plus how she is feeling right now. What it
 * shows is gated by social awareness, the same as everywhere else: at the
 * bottom it is a coloured aura and a word, and numbers only appear once you
 * are good enough at reading people to have earned them. The panel is always
 * there, so the mechanic reads as "learn to see more" rather than "the game is
 * hiding things from you".
 */
export interface MeterPanel {
  interestLabel: string | null;
  interestSegments: number | null;
  interestValue: number | null;
  interestDelta: string | null;
  comfortLabel: string | null;
  comfortSegments: number | null;
  comfortValue: number | null;
  comfortDelta: string | null;
  /** Her mood band, always legible — it is on her face anyway. */
  mood: string;
}

const BAR_W = 42;
const BAR_H = 3.4;

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  segments: number | null,
  colour: string,
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, BAR_W, BAR_H);
  if (segments === null) {
    // Awareness too low for a reading: a dashed rail, so the bar is visibly
    // there but visibly unreadable.
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 5; i += 1) ctx.fillRect(x + i * (BAR_W / 5) + 1, y, 2, BAR_H);
    return;
  }
  const filled = Math.max(0, Math.min(5, segments));
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, (BAR_W / 5) * filled, BAR_H);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x + 0.3, y + 0.3, BAR_W - 0.6, BAR_H - 0.6);
}

/** Draw the panel with its bottom edge at `bottomY`, centred on `cx`. */
export function drawMeterPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  panel: MeterPanel,
): number {
  const w = 64;
  const h = 32;
  const x = cx - w / 2;
  const y = bottomY - h;

  ctx.save();
  ctx.fillStyle = 'rgba(14, 10, 24, 0.92)';
  roundedRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 95, 168, 0.5)';
  ctx.lineWidth = 0.8;
  roundedRect(ctx, x, y, w, h, 4);
  ctx.stroke();

  ctx.font = '700 4.6px "DM Sans", system-ui, sans-serif';
  ctx.textBaseline = 'top';

  const row = (
    top: number,
    name: string,
    label: string | null,
    segments: number | null,
    value: number | null,
    delta: string | null,
    colour: string,
  ) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(200, 192, 224, 0.85)';
    ctx.fillText(name, x + 4, top);

    ctx.textAlign = 'right';
    if (value !== null) {
      ctx.fillStyle = '#f2eefc';
      ctx.fillText(String(value), x + w - 4, top);
    } else if (label) {
      ctx.fillStyle = 'rgba(232, 226, 246, 0.85)';
      ctx.fillText(label.length > 16 ? `${label.slice(0, 15)}…` : label, x + w - 4, top);
    }

    bar(ctx, x + 4, top + 5.6, segments, colour);
    if (delta) {
      ctx.textAlign = 'left';
      const rising = delta === 'up' || delta.startsWith('+');
      ctx.fillStyle = rising ? '#5fe3a1' : '#ff7a7a';
      ctx.fillText(delta === 'up' ? '\u25b2' : delta === 'down' ? '\u25bc' : delta, x + 4 + BAR_W + 2, top + 4.8);
    }
  };

  row(y + 3, 'INT', panel.interestLabel, panel.interestSegments, panel.interestValue, panel.interestDelta, '#ff5fa8');
  row(y + 15, 'CMF', panel.comfortLabel, panel.comfortSegments, panel.comfortValue, panel.comfortDelta, '#4fd6ff');

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(168, 160, 196, 0.9)';
  ctx.fillText(panel.mood, cx, y + h - 6);

  ctx.restore();
  return h;
}
