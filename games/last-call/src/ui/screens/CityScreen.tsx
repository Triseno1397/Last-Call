import { useEffect, useState } from 'react';
import type { GameState } from '@/types/game';
import { DAY_LABELS, SLOT_LABELS, currentDay, currentSlot, slotsRemainingToday } from '@/engine/calendar';
import { activitiesByCategory, CATEGORY_LABELS, energyReadout } from '@/state/selectors';
import { useGameStore } from '@/state/gameStore';
import { DATE_IDEAS } from '@/content/dateIdeas';
import { getCharacter } from '@/content/characters';
import { dateDueNow } from '@/engine/dates';
import { ActivityCard } from '@/ui/components/ActivityCard';
import { Button } from '@/ui/components/Button';
import { LogFeed } from '@/ui/components/LogFeed';
import { Meter } from '@/ui/components/Meter';
import { StatsPanel } from '@/ui/components/StatsPanel';
import { TipCard } from '@/ui/components/TipCard';

type Tab = 'day' | 'you' | 'log';

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'you', label: 'You' },
  { id: 'log', label: 'Log' },
];

export function CityScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<Tab>('day');
  const {
    doActivity,
    skip,
    notice,
    dismissNotice,
    goToTitle,
    openGallery,
    openSettings,
    openPhone,
    startDate,
  } = useGameStore();
  const dueDate = dateDueNow(game);
  const unread = Object.values(game.phone.threads).some((thread) => thread?.unread);
  const energy = energyReadout(game);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const day = currentDay(game.clock);
  const slot = currentSlot(game.clock);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-4 py-6">
      <header className="panel px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-glow-400">
              Week {game.clock.week}
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight">{DAY_LABELS[day]}</h1>
            <p className="text-xs text-ink-500">
              {SLOT_LABELS[slot]} · {slotsRemainingToday(game.clock)} slot
              {slotsRemainingToday(game.clock) === 1 ? '' : 's'} left
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-gold-400">${game.player.money}</p>
            <div className="mt-2 w-28">
              <Meter
                value={energy.current}
                max={energy.max}
                tone={energy.current < 25 ? 'bg-alarm-400' : 'bg-glow-500'}
                label="Energy"
                trailing={`${energy.current}`}
                compact
              />
            </div>
          </div>
        </div>
      </header>

      {notice && (
        <button onClick={dismissNotice} className="panel-flat px-3 py-2 text-left text-sm text-gold-400">
          {notice}
        </button>
      )}

      <nav className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`tap flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === item.id
                ? 'border-neon-400/70 bg-neon-500/15 text-ink-100'
                : 'border-ink-500/15 bg-night-850/60 text-ink-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'day' && (
        <div className="flex flex-col gap-6">
          <TipCard id="city" />
          {dueDate && (
            <button
              onClick={() => void startDate()}
              className="tap rounded-2xl border border-neon-400/60 bg-neon-500/10 p-4 text-left"
            >
              <p className="font-display text-xs uppercase tracking-[0.2em] text-neon-400">Tonight</p>
              <h3 className="font-display text-lg font-semibold">
                {getCharacter(dueDate.characterId).name} — {DATE_IDEAS[dueDate.ideaId].name}
              </h3>
              <p className="text-sm text-ink-300">{DATE_IDEAS[dueDate.ideaId].where}</p>
              <p className="mt-1 text-xs text-gold-400">
                ${DATE_IDEAS[dueDate.ideaId].cost} · {DATE_IDEAS[dueDate.ideaId].energy} energy
              </p>
            </button>
          )}
          {activitiesByCategory(game).map((group) => (
            <section key={group.category} className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
                {CATEGORY_LABELS[group.category]}
              </h2>
              {group.items.map((preview) => (
                <ActivityCard
                  key={preview.activity.id}
                  preview={preview}
                  onPick={() => doActivity(preview.activity.id)}
                />
              ))}
            </section>
          ))}
          <Button variant="ghost" onClick={openPhone}>
            Phone{unread ? ' · 1 new' : ''}
          </Button>
          <Button variant="quiet" onClick={skip} className="mb-2">
            Let the {SLOT_LABELS[slot].toLowerCase()} go by
          </Button>
        </div>
      )}

      {tab === 'you' && <StatsPanel game={game} />}

      {tab === 'log' && (
        <div className="flex flex-col gap-4">
          <LogFeed entries={game.log} />
          <Button variant="quiet" onClick={openGallery}>
            Gallery
          </Button>
          <Button variant="quiet" onClick={openSettings}>
            Settings
          </Button>
          <Button variant="quiet" onClick={goToTitle}>
            Back to title (progress is saved)
          </Button>
        </div>
      )}

      <div className="safe-bottom" />
    </main>
  );
}
