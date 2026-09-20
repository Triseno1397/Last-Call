import type { Appearance } from '@/types/player';
import { EYE_COLORS, HAIR_COLORS } from '@/content/appearance';

const HAIR_SHAPES: Record<string, string> = {
  undercut: 'M22 44 Q50 8 78 44 L78 52 Q64 34 50 34 Q36 34 22 52 Z',
  messy_waves: 'M18 50 Q24 10 50 10 Q76 10 82 50 Q70 30 58 40 Q44 22 34 42 Q26 36 18 50 Z',
  slicked_back: 'M22 46 Q50 12 78 46 L74 50 Q50 26 26 50 Z',
  long_tie_up: 'M20 52 Q26 10 50 10 Q74 10 80 52 L74 52 Q72 26 50 26 Q28 26 26 52 Z',
  buzz: 'M26 44 Q50 22 74 44 L72 48 Q50 32 28 48 Z',
  curtains: 'M20 50 Q22 10 50 10 Q78 10 80 50 Q66 24 52 44 Q48 44 48 44 Q34 24 20 50 Z',
};

function swatch(list: readonly { id: string; swatch?: string }[], id: string, fallback: string) {
  return list.find((option) => option.id === id)?.swatch ?? fallback;
}

/**
 * Placeholder portrait for the player. Phase 2 brings the layered sprite system
 * for characters (see docs/ART_GUIDE.md); this stays as the CSS/SVG stand-in.
 */
export function PlayerPortrait({ appearance, size = 128 }: { appearance: Appearance; size?: number }) {
  const hair = swatch(HAIR_COLORS, appearance.hairColor, '#141326');
  const eyes = swatch(EYE_COLORS, appearance.eyeColor, '#e2a03f');
  const shape = HAIR_SHAPES[appearance.hairStyle] ?? HAIR_SHAPES['messy_waves'];
  const shoulders =
    appearance.build === 'broad' ? 16 : appearance.build === 'athletic' ? 12 : appearance.build === 'soft' ? 10 : 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Your character"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f2a55" />
          <stop offset="100%" stopColor="#0b0918" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="18" fill="url(#bg)" />
      <path
        d={`M${50 - 22 - shoulders} 100 Q50 ${70 - shoulders / 2} ${50 + 22 + shoulders} 100 Z`}
        fill="#221e3f"
      />
      <ellipse cx="50" cy="52" rx="20" ry="23" fill="#e8c4a8" />
      <path d={shape} fill={hair} />
      <ellipse cx="42" cy="52" rx="3.4" ry="4.2" fill={eyes} />
      <ellipse cx="58" cy="52" rx="3.4" ry="4.2" fill={eyes} />
      <ellipse cx="42" cy="51" rx="1.3" ry="1.6" fill="#0b0918" />
      <ellipse cx="58" cy="51" rx="1.3" ry="1.6" fill="#0b0918" />
      <path d="M44 64 Q50 68 56 64" stroke="#8a5a4a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
