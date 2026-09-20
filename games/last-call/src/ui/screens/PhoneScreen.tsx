import type { GameState } from '@/types/game';
import type { CharacterId } from '@/content/ids';
import { getCharacter } from '@/content/characters';
import { DATE_IDEAS } from '@/content/dateIdeas';
import { WINGMAN } from '@/content/wingman';
import { DAY_LABELS } from '@/engine/calendar';
import { DAY_IDS } from '@/types/core';
import { STAGE_LABELS, memoryFor } from '@/engine/characters';
import { contacts, threadFor } from '@/engine/phone';
import { upcomingDates } from '@/engine/dates';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';

export function PhoneScreen({ game }: { game: GameState }) {
  const { openThread, acknowledgeDay } = useGameStore();
  const list = contacts(game);
  const dates = upcomingDates(game);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-4 py-6">
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight">Phone</h1>
        <p className="text-sm text-ink-500">
          {list.length === 0 ? 'No numbers yet. Go and earn one.' : `${list.length} contact${list.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {dates.length > 0 && (
        <section className="panel p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
            Planned
          </h2>
          {dates.map((date) => (
            <p key={`${date.characterId}-${date.week}-${date.dayIndex}`} className="mt-2 text-sm text-gold-400">
              {getCharacter(date.characterId).name} — {DATE_IDEAS[date.ideaId].name},{' '}
              {DAY_LABELS[DAY_IDS[date.dayIndex] ?? 'mon']} evening
              {date.week > game.clock.week ? ' next week' : ''}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        {list.map((id: CharacterId) => {
          const character = getCharacter(id);
          const memory = memoryFor(game.characters, id);
          const thread = threadFor(game, id);
          const last = thread.messages[thread.messages.length - 1];
          return (
            <button
              key={id}
              onClick={() => openThread(id)}
              className="tap flex items-center gap-3 rounded-2xl border border-ink-500/20 bg-night-850/80 p-3 text-left hover:border-glow-400/50"
            >
              <CharacterPortrait character={character} expression="neutral" width={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-semibold">{character.name}</span>
                  {thread.unread ? (
                    <Chip tone="good">new</Chip>
                  ) : (
                    <Chip tone="neutral">{STAGE_LABELS[memory.stage]}</Chip>
                  )}
                </div>
                <p className="truncate text-xs text-ink-500">
                  {last ? `${last.from === 'you' ? 'You: ' : ''}${last.text}` : 'No messages yet.'}
                </p>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => openThread(WINGMAN.id)}
          className="tap flex items-center gap-3 rounded-2xl border border-ink-500/15 bg-night-900/70 p-3 text-left hover:border-gold-400/40"
        >
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-night-700 font-display text-lg text-gold-400">
            D
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-display text-base font-semibold">{WINGMAN.name}</span>
            <p className="truncate text-xs text-ink-500">{WINGMAN.bio}</p>
          </div>
        </button>
      </section>

      <div className="safe-bottom mt-auto pt-2">
        <Button variant="ghost" className="w-full" onClick={acknowledgeDay}>
          Put it away
        </Button>
      </div>
    </main>
  );
}
