import type { EncounterState } from '@/types/dialogue';
import type { GameState } from '@/types/game';
import type { CharacterId, ResponseType, VenueId } from '@/content/ids';
import { getCharacter } from '@/content/characters';
import { VENUES } from '@/content/venues';
import { OUTCOME_LINES } from '@/content/encounterCopy';
import { meterVisibility, readComfort, readInterest, showsReasons } from '@/engine/awareness';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';
import { MeterReadoutView } from '@/ui/components/MeterReadoutView';

const TYPE_LABELS: Record<ResponseType, string> = {
  joke: 'joke',
  compliment: 'compliment',
  question: 'question',
  story: 'story',
  tease: 'tease',
  sincere: 'sincere',
  bold: 'bold move',
  exit: 'leave',
};

const TYPE_TONE: Record<ResponseType, string> = {
  joke: 'text-gold-400',
  compliment: 'text-neon-400',
  question: 'text-glow-400',
  story: 'text-ink-300',
  tease: 'text-gold-400',
  sincere: 'text-lime-400',
  bold: 'text-neon-400',
  exit: 'text-ink-500',
};

export function EncounterScreen({ game, encounter }: { game: GameState; encounter: EncounterState | null }) {
  const { pickOption, endEncounter } = useGameStore();

  if (!encounter) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-sm text-ink-500">You walk over...</p>
      </main>
    );
  }

  const character = getCharacter(encounter.characterId as CharacterId);
  const venue = VENUES[encounter.venueId as VenueId];
  const outfit = character.outfits.find((item) => item.worn.includes(venue.id));
  const visibility = meterVisibility(game.player, game.settings.alwaysShowMeters);
  const interest = readInterest(encounter.interest, encounter.lastInterestDelta, visibility);
  const comfort = readComfort(encounter.comfort, encounter.lastComfortDelta, visibility);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-4 py-6">
      <div className="flex items-start gap-4">
        <CharacterPortrait
          character={character}
          expression={encounter.expression}
          outfit={outfit}
          width={124}
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-none">{character.name}</h1>
          <p className="text-xs text-ink-500">{venue.name}</p>

          {(interest.visibility !== 'hidden' || comfort.visibility !== 'hidden') && (
            <div className="mt-3 flex gap-3">
              <MeterReadoutView readout={interest} label="Interest" tone="bg-neon-500" />
              <MeterReadoutView readout={comfort} label="Comfort" tone="bg-glow-500" />
            </div>
          )}
          {visibility === 'hidden' && (
            <p className="mt-3 text-xs italic text-ink-600">
              You cannot read her yet. Watch what she does with her hands.
            </p>
          )}
        </div>
      </div>

      <section className="panel rise-in p-4">
        <p className="font-display text-lg leading-snug text-ink-100">&ldquo;{encounter.line}&rdquo;</p>
        {encounter.cue && <p className="mt-3 text-sm italic text-glow-400">{encounter.cue}</p>}
        {showsReasons(visibility) && encounter.notes.length > 0 && (
          <ul className="mt-3 border-t hairline pt-2 text-xs text-ink-500">
            {encounter.notes.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        )}
      </section>

      {encounter.outcome ? (
        <div className="safe-bottom mt-auto flex flex-col gap-3">
          <p className="panel-flat px-4 py-3 text-center text-sm text-gold-400">
            {OUTCOME_LINES[encounter.outcome]}
          </p>
          <Button variant="primary" onClick={endEncounter}>
            Leave it there
          </Button>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-2 pb-2">
          {encounter.options.map((option) => (
            <button
              key={option.id}
              disabled={!option.available || encounter.busy}
              onClick={() => void pickOption(option.id)}
              className={`tap rounded-2xl border p-3.5 text-left ${
                option.available
                  ? 'border-ink-500/20 bg-night-850/80 hover:border-glow-400/50'
                  : 'border-ink-600/15 bg-night-900/50 opacity-70'
              }`}
            >
              <span
                className={`font-display text-[0.62rem] uppercase tracking-[0.18em] ${
                  option.available ? TYPE_TONE[option.type] : 'text-ink-600'
                }`}
              >
                {TYPE_LABELS[option.type]}
              </span>
              <p className={`mt-1 text-sm leading-snug ${option.available ? 'text-ink-100' : 'text-ink-500'}`}>
                {option.text}
              </p>
              {!option.available && option.lockReason && (
                <p className="mt-1 text-[0.7rem] text-alarm-400">{option.lockReason}</p>
              )}
            </button>
          ))}
          <div className="safe-bottom" />
        </div>
      )}
    </main>
  );
}
