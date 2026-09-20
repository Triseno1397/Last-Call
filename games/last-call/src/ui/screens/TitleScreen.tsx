import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { CONTENT_RATING } from '@/config/gameConfig';

export function TitleScreen() {
  const { saveExists, notice, startCreation, continueGame, deleteSave, dismissNotice } = useGameStore();

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between py-10">
      <div className="rise-in pt-10">
        <p className="font-display text-xs uppercase tracking-[0.5em] text-glow-400">prototype</p>
        <h1 className="neon-text mt-3 font-display text-6xl leading-[0.9] font-bold tracking-tight sm:text-7xl">
          LAST
          <br />
          CALL
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-300">
          One city, one week at a time. Work, get interesting, go out, and try to say something
          worth remembering before the lights come up.
        </p>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        {notice && (
          <button
            onClick={dismissNotice}
            className="panel-flat px-4 py-3 text-left text-sm text-gold-400"
          >
            {notice}
            <span className="ml-2 text-ink-600">(tap to dismiss)</span>
          </button>
        )}
        <Button variant="primary" onClick={startCreation}>
          New game
        </Button>
        <Button variant="ghost" onClick={continueGame} disabled={!saveExists}>
          {saveExists ? 'Continue' : 'No save on this device'}
        </Button>
        {saveExists && (
          <Button variant="danger" onClick={deleteSave}>
            Delete save
          </Button>
        )}
        <p className="pt-2 text-center text-[0.7rem] text-ink-600">
          Everyone here is 21 or older. Content rating: {CONTENT_RATING} — romance fades to black.
        </p>
      </div>
    </main>
  );
}
