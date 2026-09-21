import { useRef, useState } from 'react';
import type { CharacterId, Expression } from '@/content/ids';
import { EXPRESSIONS } from '@/content/ids';
import { CHARACTER_LIST } from '@/content/characters';
import { portraitSource, slotFor } from '@/engine/artStore';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { CharacterPortrait } from '@/ui/components/CharacterPortrait';

/**
 * Bring real art in.
 *
 * One slot per character and expression. Neutral is the one that matters —
 * every other expression falls back to it — so a character is transformed by a
 * single image, and the rest are improvements rather than requirements.
 */
export function ArtImportScreen() {
  const { artMap, artImportable, importArt, acknowledgeDay, notice, dismissNotice } = useGameStore();
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [openCharacter, setOpenCharacter] = useState<CharacterId | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const pick = async (character: CharacterId, expression: Expression, file: File | undefined) => {
    if (!file) return;
    const slot = slotFor(character, expression);
    setBusySlot(slot);
    await importArt(slot, file);
    setBusySlot(null);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-5 py-6">
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight">Import art</h1>
        <p className="mt-1 text-sm text-ink-500">
          Drop in real portraits and they replace the placeholders everywhere — conversations, the
          venue, the phone, the gallery. Start with <strong className="text-ink-300">neutral</strong>{' '}
          for each character; every other expression falls back to it until you add one.
        </p>
      </header>

      {!artImportable && (
        <p className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm text-gold-400">
          This copy of the game cannot store art — importing works in the published version, opened
          by the person who owns it. Running from the repo? Put the files in
          <code className="mx-1">public/art/characters/&lt;name&gt;/</code>instead.
        </p>
      )}

      {notice && (
        <button onClick={dismissNotice} className="panel-flat px-3 py-2 text-left text-sm text-alarm-400">
          {notice}
        </button>
      )}

      {CHARACTER_LIST.map((character) => {
        const done = EXPRESSIONS.filter((expression) => artMap[slotFor(character.id, expression)]).length;
        const open = openCharacter === character.id;
        return (
          <section key={character.id} className="panel p-4">
            <button
              onClick={() => setOpenCharacter(open ? null : character.id)}
              className="tap flex w-full items-center gap-4 text-left"
            >
              <CharacterPortrait character={character} expression="neutral" width={72} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold">{character.name}</h2>
                <p className="text-xs text-ink-500">
                  {done === 0
                    ? 'Placeholder art'
                    : `${done} of ${EXPRESSIONS.length} expressions imported`}
                </p>
              </div>
              <span className="text-xs text-ink-600">{open ? 'close' : 'open'}</span>
            </button>

            {open && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {EXPRESSIONS.map((expression) => {
                  const slot = slotFor(character.id, expression);
                  const source = artMap[slot]
                    ? portraitSource({ [slot]: artMap[slot] }, character.id, expression)
                    : null;
                  const busy = busySlot === slot;
                  return (
                    <div
                      key={expression}
                      className={`rounded-xl border p-2 ${
                        source ? 'border-lime-400/40 bg-lime-400/5' : 'border-ink-500/20 bg-night-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {source ? (
                          <img
                            src={source}
                            alt=""
                            className="h-10 w-7 rounded object-cover object-top"
                          />
                        ) : (
                          <span className="flex h-10 w-7 items-center justify-center rounded bg-night-700 text-[0.6rem] text-ink-600">
                            —
                          </span>
                        )}
                        <span className="text-xs capitalize text-ink-300">{expression}</span>
                      </div>
                      <input
                        ref={(element) => {
                          inputs.current[slot] = element;
                        }}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          void pick(character.id, expression, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                      <button
                        disabled={!artImportable || busy}
                        onClick={() => inputs.current[slot]?.click()}
                        className="tap mt-2 w-full rounded-lg border border-ink-500/25 px-2 py-1.5 text-[0.7rem] text-ink-300 disabled:opacity-50"
                      >
                        {busy ? 'Uploading...' : source ? 'Replace' : 'Choose file'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <div className="safe-bottom mt-auto pt-2">
        <Button variant="ghost" className="w-full" onClick={acknowledgeDay}>
          Done
        </Button>
      </div>
    </main>
  );
}
