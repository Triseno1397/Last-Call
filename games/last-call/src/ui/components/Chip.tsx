import type { ReactNode } from 'react';

type Tone = 'neutral' | 'good' | 'cost' | 'lock';

const TONES: Record<Tone, string> = {
  neutral: 'bg-night-700/70 text-ink-300 border-ink-500/20',
  good: 'bg-lime-400/10 text-lime-400 border-lime-400/30',
  cost: 'bg-night-800 text-ink-500 border-ink-600/30',
  lock: 'bg-alarm-400/10 text-alarm-400 border-alarm-400/25',
};

export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
