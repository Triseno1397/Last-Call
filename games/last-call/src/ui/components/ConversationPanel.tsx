import { useEffect, useState } from 'react';
import type { CharacterDef } from '@/types/character';
import type { EncounterState } from '@/types/dialogue';
import type { GameState } from '@/types/game';
import { meterVisibility, readComfort, readInterest, showsReasons } from '@/engine/awareness';
import { portraitSource } from '@/engine/artStore';
import { useGameStore } from '@/state/gameStore';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';
import { MeterReadoutView } from '@/ui/components/MeterReadoutView';

/**
 * Talking to one of the leads, face to face.
 *
 * The whole panel is her: the full key-art portrait down one side, the place
 * you are standing behind it, and beside her the things a conversation is
 * made of — what she just said, what her face is doing, how it is going, and
 * what you said a moment ago. It sits where the world was; the world is still
 * there underneath and comes back the moment you walk away.
 *
 * Her bubble is keyed to her line, so every new line pops in fresh; yours is
 * keyed to what you said and shows the instant you say it, before she has
 * answered, because a reply that appears a turn late reads as a broken game.
 */
export function ConversationPanel({
  encounter,
  character,
  backdrop,
  game,
}: {
  encounter: EncounterState;
  character: CharacterDef;
  backdrop: string | null;
  game: GameState;
}) {
  const artMap = useGameStore((store) => store.artMap);
  const imported = portraitSource(artMap, character.id, encounter.expression);
  const keyArt = imported ?? character.portrait ?? null;
  const [broken, setBroken] = useState<string | null>(null);
  const [backdropBroken, setBackdropBroken] = useState(false);
  const reduced = game.settings.reducedMotion;

  // A different image means a fresh chance to load.
  useEffect(() => setBroken(null), [keyArt]);

  const visibility = meterVisibility(game.player, game.settings.alwaysShowMeters);
  const interest = readInterest(encounter.interest, encounter.lastInterestDelta, visibility);
  const comfort = readComfort(encounter.comfort, encounter.lastComfortDelta, visibility);
  const lastYou = [...encounter.beats].reverse().find((beat) => beat.speaker === 'you');
  const mine = encounter.pending ?? lastYou?.text ?? null;
  const left = encounter.outcome === 'you_left';
  const pop = reduced ? '' : 'bubble-pop';

  return (
    <section
      className="panel relative min-h-[42vh] flex-1 overflow-hidden rounded-2xl"
      aria-label={`Talking to ${character.name}`}
    >
      {/* The place, behind everything. */}
      {backdrop && !backdropBroken ? (
        <img
          src={backdrop}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          onError={() => setBackdropBroken(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 30% 20%, ${character.palette.accent}33, #07060f 70%)` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-night-950/30 via-night-950/60 to-night-950/85" />

      <div className="relative grid h-full min-h-[42vh] grid-cols-[minmax(0,42%)_minmax(0,1fr)] gap-3 p-3">
        {/* Her, full height. */}
        <div className="relative flex items-end justify-center">
          {keyArt && broken !== keyArt ? (
            <img
              src={keyArt}
              alt={`${character.name}, looking ${encounter.expression}`}
              className="absolute inset-0 h-full w-full rounded-xl object-cover object-top"
              onError={() => setBroken(keyArt)}
            />
          ) : (
            <div className="absolute inset-0 flex items-end justify-center">
              <CharacterPortrait character={character} expression={encounter.expression} width={220} className="max-h-full" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-night-950/90 to-transparent px-3 pb-2 pt-8">
            <p className="font-display text-base font-bold leading-tight text-ink-100">{character.name}</p>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-400">
              {encounter.mood} · {encounter.expression}
            </p>
          </div>
        </div>

        {/* The conversation, beside her. */}
        <div className="flex min-w-0 flex-col justify-between gap-2">
          <div className="flex flex-col gap-2">
            {encounter.busy ? (
              <div className="relative w-fit max-w-full rounded-2xl rounded-bl-sm border border-ink-500/30 bg-night-850/90 px-4 py-3">
                <span className="inline-flex gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="thinking-dot inline-block h-2 w-2 rounded-full bg-ink-300"
                      style={{ animationDelay: `${dot * 0.16}s` }}
                    />
                  ))}
                </span>
                <span className="absolute -left-2 bottom-2 h-2.5 w-2.5 rounded-full border border-ink-500/30 bg-night-850/90" />
                <span className="absolute -left-4 bottom-0 h-1.5 w-1.5 rounded-full border border-ink-500/30 bg-night-850/90" />
              </div>
            ) : (
              <div
                key={`${encounter.beats.length}:${encounter.line}`}
                className={`relative w-fit max-w-full rounded-2xl rounded-bl-sm border border-ink-500/30 bg-night-850/95 px-4 py-3 ${pop}`}
                style={{ transformOrigin: 'left bottom' }}
              >
                <p className={`text-sm leading-snug ${left ? 'italic text-ink-500' : 'text-ink-100'}`}>
                  {encounter.line}
                </p>
                <span className="absolute -left-2 bottom-2 h-2.5 w-2.5 rounded-full border border-ink-500/30 bg-night-850/95" />
                <span className="absolute -left-4 bottom-0 h-1.5 w-1.5 rounded-full border border-ink-500/30 bg-night-850/95" />
              </div>
            )}
            {encounter.cue && !encounter.busy && (
              <p className="text-xs italic text-ink-400">{encounter.cue}</p>
            )}
            {showsReasons(visibility) && encounter.notes.length > 0 && !encounter.busy && (
              <ul className="text-[0.68rem] text-ink-500">
                {encounter.notes.slice(0, 3).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-3 rounded-xl border border-ink-500/20 bg-night-900/80 px-3 py-2">
              <MeterReadoutView readout={interest} label="Interest" tone="bg-neon-400" />
              <MeterReadoutView readout={comfort} label="Comfort" tone="bg-glow-400" />
            </div>
            {mine && (
              <div className="flex justify-end">
                <div
                  key={mine}
                  className={`relative max-w-[92%] rounded-2xl rounded-br-sm border border-neon-400/40 bg-neon-500/15 px-3 py-2 ${pop}`}
                  style={{ transformOrigin: 'right bottom' }}
                >
                  <p className="text-xs leading-snug text-ink-100">{mine}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
