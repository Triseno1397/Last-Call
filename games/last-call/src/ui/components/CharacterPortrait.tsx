import { useEffect, useState } from 'react';
import type { Expression } from '@/content/ids';
import type { CharacterDef, OutfitDef } from '@/types/character';
import { portraitSource } from '@/engine/artStore';
import { useGameStore } from '@/state/gameStore';

/**
 * Layered portrait.
 *
 * Real art, when it exists, is three stacked PNGs on one canvas:
 *   /art/characters/<id>/base.png
 *   /art/characters/<id>/outfit_<outfitId>.png
 *   /art/characters/<id>/expr_<expression>.png
 *
 * Until it exists, the same layers are drawn as SVG from the character's
 * palette, driven by exactly the same outfit and expression ids. Dropping the
 * files in swaps the art with no code change (see docs/ART_GUIDE.md).
 */
export function artPath(characterId: string, file: string): string {
  return `/art/characters/${characterId}/${file}`;
}

type ArtState = 'checking' | 'art' | 'placeholder';

function useArtAvailability(characterId: string): ArtState {
  const [state, setState] = useState<ArtState>('checking');

  useEffect(() => {
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setState('art');
    };
    probe.onerror = () => {
      if (!cancelled) setState('placeholder');
    };
    probe.src = artPath(characterId, 'base.png');
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return state;
}

interface EyeShape {
  lidTop: number;
  height: number;
  browAngle: number;
  browLift: number;
  pupilShift: number;
  closed: boolean;
}

const EYES: Record<Expression, EyeShape> = {
  neutral: { lidTop: 0, height: 15, browAngle: 0, browLift: 0, pupilShift: 0, closed: false },
  amused: { lidTop: 2, height: 13, browAngle: -8, browLift: -3, pupilShift: 1.5, closed: false },
  interested: { lidTop: -1, height: 17, browAngle: -3, browLift: -4, pupilShift: 0, closed: false },
  bored: { lidTop: 6, height: 8, browAngle: 3, browLift: 2, pupilShift: -2, closed: false },
  uncomfortable: { lidTop: 3, height: 12, browAngle: 8, browLift: -1, pupilShift: -3, closed: false },
  annoyed: { lidTop: 4, height: 11, browAngle: 14, browLift: 1, pupilShift: 0, closed: false },
  blushing: { lidTop: 3, height: 12, browAngle: -4, browLift: -2, pupilShift: 2.5, closed: false },
  laughing: { lidTop: 0, height: 14, browAngle: -6, browLift: -4, pupilShift: 0, closed: true },
};

const MOUTHS: Record<Expression, string> = {
  neutral: 'M92 172 Q100 176 108 172',
  amused: 'M89 171 Q100 181 111 168',
  interested: 'M91 171 Q100 179 109 171',
  bored: 'M92 174 L108 174',
  uncomfortable: 'M94 175 Q100 171 106 175',
  annoyed: 'M92 177 Q100 170 108 177',
  blushing: 'M93 172 Q100 178 107 172',
  laughing: 'M88 169 Q100 187 112 169 Q100 178 88 169',
};

interface PortraitProps {
  character: CharacterDef;
  expression: Expression;
  outfit?: OutfitDef | undefined;
  /** Rendered width in px; the canvas is always 2:3. */
  width?: number;
  className?: string;
}

export function CharacterPortrait({
  character,
  expression,
  outfit,
  width = 200,
  className = '',
}: PortraitProps) {
  const artMap = useGameStore((store) => store.artMap);
  const imported = portraitSource(artMap, character.id, expression);
  const [importedBroken, setImportedBroken] = useState(false);
  const art = useArtAvailability(character.id);
  const height = Math.round((width * 3) / 2);
  const look = EYES[expression];
  const worn = outfit ?? character.outfits[0];
  const palette = character.palette;

  // Art the player imported into this build wins: it is the most specific
  // thing anyone has said about how she looks.
  if (imported && !importedBroken) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={{ width, height, background: palette.background }}
      >
        <img
          src={imported}
          alt={`${character.name}, looking ${expression}`}
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setImportedBroken(true)}
        />
      </div>
    );
  }

  if (art === 'art') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={{ width, height, background: palette.background }}
      >
        <img src={artPath(character.id, 'base.png')} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {worn && (
          <img
            src={artPath(character.id, `outfit_${worn.id}.png`)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <img
          src={artPath(character.id, `expr_${expression}.png`)}
          alt={`${character.name}, ${expression}`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  const outfitPalette = worn?.palette ?? { primary: '#241f36', secondary: '#3a2f52', accent: palette.accent };
  const eyeCy = 138 + look.lidTop / 2;
  const eyeRy = look.height * 0.75;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 300"
      role="img"
      aria-label={`${character.name}, looking ${expression}`}
      className={`rounded-2xl ${className}`}
    >
      <defs>
        <linearGradient id={`bg-${character.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.background} />
          <stop offset="100%" stopColor="#0b0918" />
        </linearGradient>
        <linearGradient id={`hair-${character.id}`} x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={palette.hair} />
          <stop offset="100%" stopColor={palette.hairShadow} />
        </linearGradient>
        <linearGradient id={`iris-${character.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hairShadow} />
          <stop offset="45%" stopColor={palette.eyes} />
          <stop offset="100%" stopColor="#fff3d0" />
        </linearGradient>
        <linearGradient id={`skin-${character.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skin} />
          <stop offset="100%" stopColor="#d9a683" />
        </linearGradient>
        <radialGradient id={`glow-${character.id}`} cx="50%" cy="26%" r="62%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="300" fill={`url(#bg-${character.id})`} />
      <rect width="200" height="300" fill={`url(#glow-${character.id})`} />

      {/* hair, back mass */}
      <path
        d="M46 150 Q38 60 100 50 Q162 60 154 150 Q160 220 150 300 L132 300 Q140 210 132 150 L68 150 Q60 210 68 300 L50 300 Q40 220 46 150 Z"
        fill={`url(#hair-${character.id})`}
      />

      {/* shoulders and outfit */}
      <path d="M30 300 Q40 244 100 232 Q160 244 170 300 Z" fill={outfitPalette.primary} />
      <path d="M74 300 Q80 248 100 238 Q120 248 126 300 Z" fill={outfitPalette.secondary} />
      <path d="M94 238 L100 286 L106 238 Z" fill={outfitPalette.accent} opacity="0.9" />

      {/* neck */}
      <path d="M86 198 L86 236 Q100 248 114 236 L114 198 Z" fill="#c99a7c" />

      {/* face: tapered jaw, pointed chin */}
      <path
        d="M62 132 Q62 96 100 94 Q138 96 138 132 Q138 164 121 182 Q110 193 100 193 Q90 193 79 182 Q62 164 62 132 Z"
        fill={`url(#skin-${character.id})`}
      />
      <path d="M79 182 Q100 196 121 182 Q110 190 100 190 Q90 190 79 182 Z" fill="#c9926f" opacity="0.45" />

      {/* ears */}
      <ellipse cx="62" cy="146" rx="5.5" ry="9" fill="#d9a683" />
      <ellipse cx="138" cy="146" rx="5.5" ry="9" fill="#d9a683" />

      {/* fringe: swooping bangs with pointed locks */}
      <path
        d="M58 140 Q56 78 100 70 Q146 78 144 142 Q140 112 128 104 Q120 126 112 108 Q104 122 96 106 Q84 124 76 108 Q64 116 58 140 Z"
        fill={`url(#hair-${character.id})`}
      />
      <path d="M58 140 Q62 104 78 92" stroke={palette.accent} strokeWidth="2" fill="none" opacity="0.45" />
      <path d="M144 142 Q140 102 122 90" stroke={palette.accent} strokeWidth="2" fill="none" opacity="0.3" />

      {/* side locks */}
      <path d="M60 128 Q52 172 58 214 Q68 176 66 134 Z" fill={`url(#hair-${character.id})`} />
      <path d="M140 128 Q148 172 142 214 Q132 176 134 134 Z" fill={`url(#hair-${character.id})`} />

      {/* brows */}
      <g stroke={palette.hairShadow} strokeWidth="3.4" strokeLinecap="round">
        <line x1="71" y1={119 + look.browLift} x2="91" y2={119 + look.browLift + look.browAngle * 0.35} />
        <line x1="109" y1={119 + look.browLift + look.browAngle * 0.35} x2="129" y2={119 + look.browLift} />
      </g>

      {/* eyes */}
      {look.closed ? (
        <g stroke="#3a2030" strokeWidth="3.6" fill="none" strokeLinecap="round">
          <path d="M70 140 Q82 130 94 140" />
          <path d="M106 140 Q118 130 130 140" />
        </g>
      ) : (
        <g>
          {[82, 118].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={eyeCy} rx="12.5" ry={eyeRy} fill="#fdfbff" />
              <ellipse cx={cx + look.pupilShift} cy={eyeCy} rx="9.5" ry={eyeRy - 0.5} fill={`url(#iris-${character.id})`} />
              <ellipse cx={cx + look.pupilShift} cy={eyeCy + 0.5} rx="4.4" ry={eyeRy - 3.5} fill="#160f1f" />
              <circle cx={cx + look.pupilShift + 4} cy={eyeCy - 4.5} r="3.2" fill="#ffffff" />
              <circle cx={cx + look.pupilShift - 4} cy={eyeCy + 4} r="1.7" fill="#ffffff" opacity="0.75" />
              <path
                d={`M${cx - 13.5} ${eyeCy - eyeRy + 1} Q${cx} ${eyeCy - eyeRy - 5} ${cx + 13.5} ${eyeCy - eyeRy + 2}`}
                stroke="#2b1b2a"
                strokeWidth="3.4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${cx + 12} ${eyeCy - eyeRy + 2} l6 -4`}
                stroke="#2b1b2a"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      )}

      {/* blush */}
      {(expression === 'blushing' || expression === 'laughing') && (
        <g fill={palette.accent} opacity={expression === 'blushing' ? 0.42 : 0.24}>
          <ellipse cx="72" cy="162" rx="12" ry="6.5" />
          <ellipse cx="128" cy="162" rx="12" ry="6.5" />
        </g>
      )}

      {/* nose and mouth */}
      <path d="M100 152 Q97 160 101 162" stroke="#b88467" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path
        d={MOUTHS[expression]}
        stroke="#a33f5c"
        strokeWidth="3"
        fill={expression === 'laughing' ? '#a33f5c' : 'none'}
        strokeLinecap="round"
      />
    </svg>
  );
}
