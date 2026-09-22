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
