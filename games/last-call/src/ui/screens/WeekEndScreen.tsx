import type { GameState } from '@/types/game';
import { STAT_LABELS } from '@/engine/activities';
import { verdictFor } from '@/content/verdicts';
import { VENUES } from '@/content/venues';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b hairline py-2">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="font-display text-sm text-ink-100">{value}</span>
    </div>
  );
}

export function WeekEndScreen({ game }: { game: GameState }) {
  const { acknowledgeWeek } = useGameStore();
  const summary = game.lastWeek;

  if (!summary) {
    return (
      <main className="flex min-h-[100dvh] flex-col justify-center gap-4 py-8">
        <Button variant="primary" onClick={acknowledgeWeek}>
          Carry on
        </Button>
      </main>
    );
  }

  const statGains = Object.entries(summary.statGains).filter(([, points]) => (points ?? 0) > 0);
  const venues = [...new Set(summary.venuesVisited)];

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between gap-6 py-8">
      <div className="rise-in flex flex-col gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-neon-400">
            Week {summary.week} · done
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight">The week in review</h1>
          <p className="mt-2 text-sm text-ink-300">{verdictFor(summary)}</p>
        </div>

        <section className="panel px-4 py-2">
          <Row label="Earned" value={`$${summary.moneyEarned}`} />
          <Row label="Spent" value={`$${summary.moneySpent}`} />
          <Row label="Things done" value={`${summary.activitiesDone}`} />
          <Row label="Slots let go" value={`${summary.slotsWasted}`} />
          <Row label="In the bank now" value={`$${game.player.money}`} />
        </section>

        {statGains.length > 0 && (
          <section className="panel p-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
              You got better at
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {statGains.map(([stat, points]) => (
                <Chip key={stat} tone="good">
                  {STAT_LABELS[stat as keyof typeof STAT_LABELS]} +{points}
                </Chip>
              ))}
              {summary.hobbyLevelUps.map((entry) => (
                <Chip key={entry} tone="good">
                  {entry}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {venues.length > 0 && (
          <section className="panel p-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
              Where you turned up
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {venues.map((venue) => (
                <Chip key={venue}>{VENUES[venue].name}</Chip>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="safe-bottom">
        <Button variant="primary" className="w-full" onClick={acknowledgeWeek}>
          Start week {game.clock.week}
        </Button>
      </div>
    </main>
  );
}
