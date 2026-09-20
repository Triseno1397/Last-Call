import type { LogEntry, LogTone } from '@/types/game';
import { DAY_LABELS, SLOT_LABELS } from '@/engine/calendar';
import { DAY_IDS, SLOT_IDS } from '@/types/core';

const TONE_CLASS: Record<LogTone, string> = {
  neutral: 'text-ink-100',
  good: 'text-lime-400',
  bad: 'text-alarm-400',
  flavour: 'text-ink-500 italic',
  milestone: 'text-gold-400',
};

export function LogFeed({ entries, limit = 40 }: { entries: readonly LogEntry[]; limit?: number }) {
  const shown = entries.slice(-limit).reverse();

  return (
    <ol className="flex flex-col gap-2">
      {shown.map((entry) => {
        const day = DAY_IDS[entry.dayIndex % DAY_IDS.length];
        const slot = SLOT_IDS[entry.slotIndex % SLOT_IDS.length];
        return (
          <li key={entry.id} className="panel-flat px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-600">
              W{entry.week} · {day ? DAY_LABELS[day].slice(0, 3) : ''} ·{' '}
              {slot ? SLOT_LABELS[slot].toLowerCase() : ''}
            </p>
            <p className={`text-sm leading-snug ${TONE_CLASS[entry.tone]}`}>{entry.text}</p>
          </li>
        );
      })}
      {shown.length === 0 && <li className="text-sm text-ink-600">Nothing has happened yet.</li>}
    </ol>
  );
}
