import { useMemo, useState } from 'react';
import type { CharacterId } from '@/content/ids';
import type { GameState } from '@/types/game';
import { CHARACTER_LIST, getCharacter } from '@/content/characters';
import { WINGMAN } from '@/content/wingman';
import { TONE_HINTS, TONE_LABELS } from '@/content/phoneCopy';
import { ASK_OUT_LOCKED } from '@/content/phoneCopy';
import { composeOptions, dateIdeasFor, hasPendingDate, threadFor } from '@/engine/phone';
import { canAskWingman } from '@/engine/wingman';
import { memoryFor } from '@/engine/characters';
import { createRng } from '@/engine/rng';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';

function WingmanThread({ game }: { game: GameState }) {
  const { askWingman, closeThread } = useGameStore();
  const thread = threadFor(game, WINGMAN.id);
  const canAsk = canAskWingman(game);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{WINGMAN.name}</h1>
          <p className="text-xs text-ink-500">{WINGMAN.bio}</p>
        </div>
        <Button variant="quiet" onClick={closeThread}>
          Back
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {thread.messages.length === 0 && (
          <p className="panel-flat px-4 py-6 text-center text-sm text-ink-500">
            Ask him about someone. He will be confidently right about two thirds of it.
          </p>
        )}
        {thread.messages.map((message) => (
          <p key={message.id} className="panel-flat px-3 py-2 text-sm text-ink-300">
            {message.text}
          </p>
        ))}
      </div>

      <div className="safe-bottom flex flex-col gap-2">
        <p className="text-xs text-ink-600">
          {canAsk ? 'One tip a day. Who do you want the read on?' : 'He has given you today’s tip. Ask again tomorrow.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {CHARACTER_LIST.map((character) => (
            <Button
              key={character.id}
              variant="ghost"
              disabled={!canAsk}
              onClick={() => askWingman(character.id)}
            >
              {character.name}
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ThreadScreen({ game, threadId }: { game: GameState; threadId: string }) {
  const { sendTextTo, askOutWith, closeThread } = useGameStore();
  const [showIdeas, setShowIdeas] = useState(false);

  if (threadId === WINGMAN.id) return <WingmanThread game={game} />;

  const characterId = threadId as CharacterId;
  const character = getCharacter(characterId);
  const memory = memoryFor(game.characters, characterId);
  const thread = threadFor(game, characterId);

  // Fresh phrasing each time the thread renders, seeded so it is stable per turn.
  const options = useMemo(
    () => composeOptions(game, characterId, createRng(game.rngSeed + thread.messages.length)),
    [game, characterId, thread.messages.length],
  );
  const ideas = useMemo(() => dateIdeasFor(game, character), [game, character]);

  const pending = hasPendingDate(game, characterId);
  const askLock = !memory.hasNumber
    ? ASK_OUT_LOCKED.noNumber
    : pending
      ? ASK_OUT_LOCKED.alreadyPlanned
      : memory.interest < 45
        ? ASK_OUT_LOCKED.notInterested
        : null;

  return (
    <main className="flex min-h-[100dvh] flex-col gap-3 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{character.name}</h1>
          <p className="text-xs text-ink-500">{character.tagline}</p>
        </div>
        <Button variant="quiet" onClick={closeThread}>
          Back
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {thread.messages.length === 0 && (
          <p className="panel-flat px-4 py-6 text-center text-sm text-ink-500">
            Nothing here yet. Say something that is not "hey".
          </p>
        )}
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              message.from === 'you'
                ? 'self-end bg-neon-500/20 text-ink-100'
                : 'self-start bg-night-800 text-ink-100'
            }`}
          >
            {message.text}
            {message.delta !== undefined && message.delta !== 0 && (
              <span className={`ml-2 text-[0.65rem] ${message.delta > 0 ? 'text-lime-400' : 'text-alarm-400'}`}>
                {message.delta > 0 ? `+${Math.round(message.delta)}` : Math.round(message.delta)}
              </span>
            )}
          </div>
        ))}
      </div>

      {showIdeas ? (
        <section className="panel flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
              Where to
            </h2>
            <Button variant="quiet" onClick={() => setShowIdeas(false)}>
              Cancel
            </Button>
          </div>
          {ideas.map((idea) => (
            <button
              key={idea.id}
              disabled={!idea.available}
              onClick={() => {
                askOutWith(characterId, idea.id);
                setShowIdeas(false);
              }}
              className={`tap rounded-xl border p-3 text-left ${
                idea.available
                  ? 'border-ink-500/20 bg-night-850/80 hover:border-glow-400/50'
                  : 'border-ink-600/15 bg-night-900/60 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm">{idea.name}</span>
                {idea.appeals && <Chip tone="good">her kind of thing</Chip>}
              </div>
              <p className="text-xs text-ink-500">{idea.blurb}</p>
              <p className="mt-1 text-[0.7rem] text-gold-400">
                ${idea.cost}
                {idea.lockReason ? ` · ${idea.lockReason}` : ''}
              </p>
            </button>
          ))}
        </section>
      ) : (
        <section className="safe-bottom flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.tone}
              disabled={!option.available}
              onClick={() => sendTextTo(characterId, option.tone, option.text)}
              className={`tap rounded-2xl border p-3 text-left ${
                option.available
                  ? 'border-ink-500/20 bg-night-850/80 hover:border-glow-400/50'
                  : 'border-ink-600/15 bg-night-900/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-glow-400">
                  {TONE_LABELS[option.tone]}
                </span>
                <span className="text-[0.62rem] text-ink-600">{TONE_HINTS[option.tone]}</span>
              </div>
              <p className={`mt-1 text-sm ${option.available ? 'text-ink-100' : 'text-ink-500'}`}>
                {option.text}
              </p>
              {option.lockReason && <p className="text-[0.7rem] text-alarm-400">{option.lockReason}</p>}
            </button>
          ))}

          <Button
            variant="primary"
            disabled={askLock !== null}
            onClick={() => setShowIdeas(true)}
          >
            {askLock ?? 'Ask her out'}
          </Button>
        </section>
      )}
    </main>
  );
}
