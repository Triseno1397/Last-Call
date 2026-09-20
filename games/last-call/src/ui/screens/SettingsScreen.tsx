import type { GameState } from '@/types/game';
import { CONTENT_RATING } from '@/config/gameConfig';
import { TIP_ORDER } from '@/content/onboarding';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="tap flex w-full items-center justify-between gap-4 rounded-2xl border border-ink-500/20 bg-night-850/70 p-4 text-left"
    >
      <span className="min-w-0">
        <span className="font-display text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>
      </span>
      <span
        className={`h-6 w-11 shrink-0 rounded-full border transition-colors ${
          value ? 'border-lime-400/60 bg-lime-400/30' : 'border-ink-500/30 bg-night-700'
        }`}
      >
        <span
          className={`mt-0.5 block h-4 w-4 rounded-full bg-ink-100 transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsScreen({ game }: { game: GameState }) {
  const { updateSettings, resetTips, acknowledgeDay } = useGameStore();
  const { settings, player } = game;
  const tipsSeen = TIP_ORDER.filter((id) => player.flags[`tip_${id}`]).length;

  return (
    <main className="flex min-h-[100dvh] flex-col gap-4 py-6">
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight">Settings</h1>
        <p className="text-sm text-ink-500">Everything here is saved with your game.</p>
      </header>

      <div className="flex flex-col gap-2">
        <Toggle
          label="Sound"
          hint="Audio cues, when there is audio to play."
          value={settings.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <Toggle
          label="Reduced motion"
          hint="Turns off screen transitions and the moving dartboard."
          value={settings.reducedMotion}
          onChange={(reducedMotion) => updateSettings({ reducedMotion })}
        />
        <Toggle
          label="Always show meters"
          hint="Skips the awareness mechanic and shows her interest and comfort as numbers from the start."
          value={settings.alwaysShowMeters}
          onChange={(alwaysShowMeters) => updateSettings({ alwaysShowMeters })}
        />
        <Toggle
          label="Show tips"
          hint={`First-run coaching. ${tipsSeen} of ${TIP_ORDER.length} seen.`}
          value={settings.showTips}
          onChange={(showTips) => updateSettings({ showTips })}
        />
      </div>

      <section className="panel p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Content
        </h2>
        <p className="mt-2 text-sm text-ink-300">
          Rating: {CONTENT_RATING}. Romance is suggestive and fades to black. Every character in the
          game is 21 or older.
        </p>
      </section>

      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-2">
        <Button variant="ghost" onClick={resetTips}>
          Show the tips again
        </Button>
        <Button variant="ghost" onClick={acknowledgeDay}>
          Back
        </Button>
      </div>
    </main>
  );
}
