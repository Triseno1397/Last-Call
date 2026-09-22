import { useEffect, useRef, useState } from 'react';
import type { EncounterState } from '@/types/dialogue';
import { OUTCOME_LINES } from '@/content/encounterCopy';
import { useGameStore } from '@/state/gameStore';

/**
 * The conversation controls, docked under the street while a conversation is
 * running on the map.
 *
 * Two ways to say something, side by side rather than in separate modes: the
 * preset replies the dialogue engine offers for this moment, and a box you can
 * type anything into when the running provider takes free text. Both go
 * through the same scoring, so typing your own line is not a way around the
 * game's rules — it is just the other way to play it.
 */
export function TalkBar({ encounter, name }: { encounter: EncounterState; name: string }) {
  const { pickOption, sayTo, walkAway, endEncounter, canSpeakFreely } = useGameStore();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const freeText = canSpeakFreely();
  const over = encounter.outcome !== null;
  const locked = encounter.busy || over;

  // A new line from her means it is your turn again; put the caret back.
  useEffect(() => {
    if (!locked && freeText) inputRef.current?.focus();
  }, [encounter.line, locked, freeText]);

  const send = () => {
    const text = draft.trim();
    if (!text || locked) return;
    setDraft('');
    void sayTo(text);
  };

  if (over) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-ink-500/20 bg-night-850/90 p-3">
        <p className="font-display text-sm font-semibold text-gold-400">
          {OUTCOME_LINES[encounter.outcome!] ?? 'That is that.'}
        </p>
        {encounter.outcome === 'you_left' && (
          <p className="text-xs italic text-ink-500">{encounter.line}</p>
        )}
        {/* Always through endEncounter: that is what writes the conversation
            into her memory and pays out the experience. */}
        <button
          onClick={endEncounter}
          className="tap rounded-xl border border-neon-400/70 bg-neon-500/20 px-3 py-2 text-sm font-semibold text-ink-100"
        >
          See how that went
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-ink-500/20 bg-night-850/90 p-3">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neon-400">
          Talking to {name}
        </p>
        <button
          onClick={walkAway}
          className="tap text-xs text-ink-500 underline underline-offset-4"
          disabled={encounter.busy}
        >
          Walk away
        </button>
      </div>

      {encounter.cue && <p className="text-xs italic text-ink-500">{encounter.cue}</p>}

      {/* Presets first: they are the fastest way to keep a conversation moving. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {encounter.options.map((option) => (
          <button
            key={option.id}
            onClick={() => (option.available ? void pickOption(option.id) : undefined)}
            title={option.lockReason ?? undefined}
            className={`tap shrink-0 max-w-[72vw] rounded-xl border px-3 py-2 text-left text-xs ${
              option.available
                ? 'border-ink-500/30 bg-night-800/80 text-ink-200'
                : 'border-ink-600/20 bg-night-900/60 text-ink-600'
            } ${encounter.busy ? 'opacity-50' : ''}`}
          >
            {option.text}
            {!option.available && option.lockReason && (
              <span className="mt-1 block text-[0.65rem] text-alarm-400">{option.lockReason}</span>
            )}
          </button>
        ))}
      </div>

      {freeText ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={locked}
            maxLength={240}
            placeholder={encounter.busy ? 'She is thinking…' : 'Say anything…'}
            className="min-w-0 flex-1 rounded-xl border border-ink-500/30 bg-night-900/80 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:border-neon-400/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={locked || draft.trim().length === 0}
            className="tap shrink-0 rounded-xl border border-neon-400/70 bg-neon-500/20 px-4 py-2 text-sm font-semibold text-ink-100 disabled:border-ink-600/30 disabled:bg-night-800 disabled:text-ink-600"
          >
            Say
          </button>
        </form>
      ) : (
        <p className="text-[0.7rem] text-ink-600">
          Scripted mode — pick a reply above. Turn on AI dialogue in Settings to type your own.
        </p>
      )}
    </div>
  );
}
