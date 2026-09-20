import type { GameState } from '@/types/game';
import type { VenueVisit } from '@/state/gameStore';
import { VENUES } from '@/content/venues';
import { DAY_LABELS, SLOT_LABELS, currentDay, currentSlot } from '@/engine/calendar';
import { STAGE_LABELS, crowdAt, moodBand, moodValueFor, MOOD_CUES } from '@/engine/characters';
import { absoluteDay } from '@/engine/calendar';
import { effectiveAwareness } from '@/engine/awareness';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';
import { DartsGame } from '@/ui/components/DartsGame';

export function VenueScreen({ game, visit }: { game: GameState; visit: VenueVisit }) {
  const { talkTo, leaveVenue, recordDarts, notice, dismissNotice } = useGameStore();
  const venue = VENUES[visit.venueId];
  const crowd = crowdAt(venue, game.clock, game.characters);
  const awareness = effectiveAwareness(game.player);

  return (
    <main className="flex min-h-[100dvh] flex-col gap-5 py-6">
      <header className="rise-in">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-glow-400">
          {DAY_LABELS[currentDay(game.clock)]} · {SLOT_LABELS[currentSlot(game.clock)].toLowerCase()}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight">{venue.name}</h1>
        <p className="text-sm text-ink-500">{venue.tagline}</p>
      </header>

      <p className="panel-flat px-4 py-3 text-sm italic text-ink-300">{visit.atmosphere}</p>

      {notice && (
        <button onClick={dismissNotice} className="panel-flat px-3 py-2 text-left text-sm text-gold-400">
          {notice}
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
          Who is here
        </h2>

        {crowd.length === 0 && (
          <p className="panel-flat px-4 py-6 text-center text-sm text-ink-500">
            Nobody you know. You drink half of it and watch the door do nothing.
          </p>
        )}

        {crowd.map(({ character, memory }) => {
          const moodValue = moodValueFor(game.rngSeed, character.id, absoluteDay(game.clock));
          const mood = moodBand(moodValue);
          const outfit = character.outfits.find((item) => item.worn.includes(venue.id));
          return (
            <div key={character.id} className="panel flex gap-4 p-4">
              <CharacterPortrait
                character={character}
                expression={mood === 'bad' ? 'bored' : memory.interest > 50 ? 'interested' : 'neutral'}
                outfit={outfit}
                width={96}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{character.name}</h3>
                    <Chip tone={memory.stage === 'not_interested' ? 'lock' : 'neutral'}>
                      {STAGE_LABELS[memory.stage]}
                    </Chip>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{character.tagline}</p>
                  {awareness >= 2 && <p className="mt-2 text-xs italic text-glow-400">{MOOD_CUES[mood]}</p>}
                  {memory.knownFacts.length > 0 && (
                    <p className="mt-1 text-xs text-ink-600">
                      You know {memory.knownFacts.length} thing
                      {memory.knownFacts.length === 1 ? '' : 's'} about her.
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  className="mt-3 w-full"
                  onClick={() => void talkTo(character.id)}
                >
                  {memory.met ? 'Go and say something' : 'Introduce yourself'}
                </Button>
              </div>
            </div>
          );
        })}
      </section>

      {venue.miniGame === 'darts' && !visit.dartsPlayed && (
        <DartsGame
          player={game.player}
          reducedMotion={game.settings.reducedMotion}
          onFinish={recordDarts}
        />
      )}

      {visit.dartsPlayed && visit.bonus > 0 && (
        <p className="panel-flat px-4 py-3 text-sm text-lime-400">
          {visit.dartsLine} That will carry into the next conversation.
        </p>
      )}

      <div className="safe-bottom mt-auto pt-4">
        <Button variant="ghost" className="w-full" onClick={leaveVenue}>
          Call it a night
        </Button>
      </div>
    </main>
  );
}
