import type { GameState } from '@/types/game';
import type { LogEntry } from '@/types/game';
import { DAY_LABELS, currentDay } from '@/engine/calendar';
import { DAY_IDS } from '@/types/core';
import { energyReadout } from '@/state/selectors';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { LogFeed } from '@/ui/components/LogFeed';
import { Meter } from '@/ui/components/Meter';

/** Entries from the most recent day that is not the one we just woke up into. */
function previousDayEntries(game: GameState): readonly LogEntry[] {
  const current = game.clock.week * 100 + game.clock.dayIndex;
  const past = game.log.filter((entry) => entry.week * 100 + entry.dayIndex < current);
  if (past.length === 0) return [];
  const lastKey = Math.max(...past.map((entry) => entry.week * 100 + entry.dayIndex));
  return past.filter((entry) => entry.week * 100 + entry.dayIndex === lastKey);
}

export function DayEndScreen({ game }: { game: GameState }) {
  const { acknowledgeDay } = useGameStore();
  const entries = previousDayEntries(game);
  const energy = energyReadout(game);
  const closedDayIndex = (game.clock.dayIndex + DAY_IDS.length - 1) % DAY_IDS.length;
  const closedDay = DAY_IDS[closedDayIndex] ?? 'mon';

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between gap-6 py-8">
      <div className="rise-in flex flex-col gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-glow-400">
            {DAY_LABELS[closedDay]} is done
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight">Lights out.</h1>
          <p className="mt-2 text-sm text-ink-500">
            You wake up on {DAY_LABELS[currentDay(game.clock)]}.
          </p>
        </div>

        <section className="panel p-4">
          <Meter
            value={energy.current}
            max={energy.max}
            tone="bg-glow-500"
            label="Energy tomorrow"
            trailing={`${energy.current} / ${energy.max}`}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
            How the day went
          </h2>
          <LogFeed entries={entries} limit={12} />
        </section>
      </div>

      <div className="safe-bottom">
        <Button variant="primary" className="w-full" onClick={acknowledgeDay}>
          Next day
        </Button>
      </div>
    </main>
  );
}
