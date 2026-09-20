import type { EncounterState } from '@/types/dialogue';
import type { GameState } from '@/types/game';
import type { CharacterId } from '@/content/ids';
import { getCharacter } from '@/content/characters';
import { OUTCOME_LINES, OUTCOME_TONE } from '@/content/encounterCopy';
import { STAGE_LABELS, memoryFor } from '@/engine/characters';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';

export function EncounterEndScreen({
  game,
  encounter,
}: {
  game: GameState;
  encounter: EncounterState | null;
}) {
  const { closeEncounterSummary } = useGameStore();
  if (!encounter) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <Button variant="primary" onClick={closeEncounterSummary}>
          Back to the room
        </Button>
      </main>
    );
  }

  const characterId = encounter.characterId as CharacterId;
  const character = getCharacter(characterId);
  const memory = memoryFor(game.characters, characterId);
  const outcome = encounter.outcome ?? 'you_left';
  const learnedFacts = character.facts.filter((fact) => encounter.learned.includes(fact.id));

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between gap-5 py-8">
      <div className="rise-in flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <CharacterPortrait character={character} expression={encounter.expression} width={88} />
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-glow-400">
              {character.name}
            </p>
            <h1
              className={`font-display text-2xl font-bold leading-tight ${
                OUTCOME_TONE[outcome] === 'good'
                  ? 'text-lime-400'
                  : OUTCOME_TONE[outcome] === 'bad'
                    ? 'text-alarm-400'
                    : 'text-ink-100'
              }`}
            >
              {OUTCOME_LINES[outcome]}
            </h1>
            <Chip tone={memory.stage === 'not_interested' ? 'lock' : 'good'}>
              {STAGE_LABELS[memory.stage]}
            </Chip>
          </div>
        </div>

        {learnedFacts.length > 0 && (
          <section className="panel p-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
              What you learned
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {learnedFacts.map((fact) => (
                <li key={fact.id} className="text-sm text-ink-300">
                  · {fact.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
            How it went
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {encounter.beats.slice(-6).map((beat, index) => (
              <p
                key={`${beat.speaker}-${index}`}
                className={`text-sm leading-snug ${
                  beat.speaker === 'her' ? 'text-ink-100' : 'pl-4 text-ink-500'
                }`}
              >
                {beat.speaker === 'her' ? `${character.name}: ` : 'You: '}
                {beat.text}
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="safe-bottom">
        <Button variant="primary" className="w-full" onClick={closeEncounterSummary}>
          Back to the room
        </Button>
      </div>
    </main>
  );
}
