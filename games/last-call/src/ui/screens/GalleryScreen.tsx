import { useState } from 'react';
import type { Expression } from '@/content/ids';
import type { GameState } from '@/types/game';
import { EXPRESSIONS } from '@/content/ids';
import { CHARACTER_LIST } from '@/content/characters';
import { STAGE_LABELS, memoryFor } from '@/engine/characters';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';

/**
 * Unlocked outfits and milestone illustrations. Locked entries show their hint
 * rather than hiding, so the gallery doubles as a list of things to go and do.
 */
export function GalleryScreen({ game }: { game: GameState }) {
  const { acknowledgeDay } = useGameStore();
  const [expression, setExpression] = useState<Expression>('neutral');
  const met = CHARACTER_LIST.filter((character) => memoryFor(game.characters, character.id).met);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-5 py-6">
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight">Gallery</h1>
        <p className="text-sm text-ink-500">Everyone you have actually met, and what you have seen.</p>
      </header>

      {met.length === 0 && (
        <p className="panel-flat px-4 py-8 text-center text-sm text-ink-500">
          Nothing here yet. Go out and talk to somebody.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {EXPRESSIONS.map((item) => (
          <button
            key={item}
            onClick={() => setExpression(item)}
            className={`tap rounded-full border px-2.5 py-1 text-[0.68rem] capitalize ${
              expression === item
                ? 'border-neon-400 bg-neon-500/15 text-ink-100'
                : 'border-ink-500/20 bg-night-800/60 text-ink-500'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {met.map((character) => {
        const memory = memoryFor(game.characters, character.id);
        return (
          <section key={character.id} className="panel p-4">
            <div className="flex gap-4">
              <CharacterPortrait character={character} expression={expression} width={110} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold">{character.name}</h2>
                <p className="text-xs text-ink-500">
                  {character.age} · {character.archetype}
                </p>
                <Chip tone="neutral">{STAGE_LABELS[memory.stage]}</Chip>
                <p className="mt-2 text-xs text-ink-500">
                  {memory.encounters} conversation{memory.encounters === 1 ? '' : 's'} ·{' '}
                  {memory.knownFacts.length} thing{memory.knownFacts.length === 1 ? '' : 's'} learned
                </p>
              </div>
            </div>

            <h3 className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              Outfits
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {character.outfits.map((outfit) => {
                const unlocked = memory.seenOutfits.includes(outfit.id);
                return (
                  <div
                    key={outfit.id}
                    className={`rounded-xl border p-2 ${
                      unlocked ? 'border-lime-400/30 bg-lime-400/5' : 'border-ink-600/20 bg-night-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-md border border-white/10"
                        style={{
                          background: unlocked
                            ? `linear-gradient(135deg, ${outfit.palette.primary}, ${outfit.palette.accent})`
                            : '#171429',
                        }}
                      />
                      <span className={`text-xs ${unlocked ? 'text-ink-100' : 'text-ink-600'}`}>
                        {unlocked ? outfit.name : 'Locked'}
                      </span>
                    </div>
                    {!unlocked && outfit.unlockHint && (
                      <p className="mt-1 text-[0.68rem] text-ink-600">{outfit.unlockHint}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              Moments
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              {memory.unlockedCgs.length === 0
                ? 'No milestone illustrations yet. Dates unlock the first one.'
                : `${memory.unlockedCgs.length} unlocked.`}
            </p>

            {memory.knownFacts.length > 0 && (
              <>
                <h3 className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                  What you know
                </h3>
                <ul className="mt-1 flex flex-col gap-1">
                  {character.facts
                    .filter((fact) => memory.knownFacts.includes(fact.id))
                    .map((fact) => (
                      <li key={fact.id} className="text-xs text-ink-300">
                        · {fact.text}
                      </li>
                    ))}
                </ul>
              </>
            )}
          </section>
        );
      })}

      <div className="safe-bottom mt-auto pt-2">
        <Button variant="ghost" className="w-full" onClick={acknowledgeDay}>
          Back
        </Button>
      </div>
    </main>
  );
}
