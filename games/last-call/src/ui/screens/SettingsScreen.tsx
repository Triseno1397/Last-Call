import { useEffect, useState } from 'react';
import type { GameState } from '@/types/game';
import { AI_MODELS } from '@/engine/dialogue/llmProvider';
import { checkService, readStoredKey, storeKey } from '@/engine/dialogue/providers';
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

const MODEL_LABELS: Record<string, string> = {
  'claude-opus-5': 'Opus 5 — sharpest, slowest',
  'claude-sonnet-5': 'Sonnet 5 — quick and good',
  'claude-haiku-4-5': 'Haiku 4.5 — fastest, cheapest',
};

export function SettingsScreen({ game }: { game: GameState }) {
  const { updateSettings, resetTips, acknowledgeDay } = useGameStore();
  const { settings, player } = game;
  const tipsSeen = TIP_ORDER.filter((id) => player.flags[`tip_${id}`]).length;

  const [service, setService] = useState<{
    ok: boolean;
    hasKey: boolean;
    inPage: boolean;
    reason?: string;
  } | null>(null);
  const [key, setKey] = useState(() => readStoredKey() ?? '');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void checkService().then((result) => {
      if (!cancelled) setService(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

      <section className="panel flex flex-col gap-3 p-4">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
            Conversation
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Written dialogue is hand-authored and always works. AI dialogue lets you say anything and
            has her answer in character — she is still scored by the game, not by the model.
          </p>
        </div>

        <div className="flex gap-2">
          {(['scripted', 'ai'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ dialogueMode: mode })}
              className={`tap flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                settings.dialogueMode === mode
                  ? 'border-neon-400 bg-neon-500/15 text-ink-100'
                  : 'border-ink-500/20 bg-night-800/60 text-ink-300'
              }`}
            >
              {mode === 'scripted' ? 'Written' : 'AI — say anything'}
            </button>
          ))}
        </div>

        {settings.dialogueMode === 'ai' && (
          <>
            <div className="flex flex-col gap-1.5">
              {AI_MODELS.map((model) => (
                <button
                  key={model}
                  onClick={() => updateSettings({ aiModel: model })}
                  className={`tap rounded-xl border px-3 py-2 text-left text-xs ${
                    settings.aiModel === model
                      ? 'border-glow-400/70 bg-glow-500/10 text-ink-100'
                      : 'border-ink-500/15 bg-night-900/60 text-ink-500'
                  }`}
                >
                  {MODEL_LABELS[model] ?? model}
                </button>
              ))}
            </div>

            <p className="text-xs">
              {service === null ? (
                <span className="text-ink-600">Checking whether she can answer...</span>
              ) : service.inPage ? (
                <span className="text-lime-400">
                  Claude is available in this page — no key needed. Conversations run on your own
                  Claude account, and it will ask you the first time.
                </span>
              ) : service.ok && service.hasKey ? (
                <span className="text-lime-400">Dialogue service running with a key. Ready.</span>
              ) : service.ok ? (
                <span className="text-gold-400">
                  Service running but no ANTHROPIC_API_KEY on it. Paste a key below, or restart it with
                  the key set.
                </span>
              ) : (
                <span className="text-gold-400">
                  No dialogue service ({service.reason}). Run <code>npm run dev</code> with
                  ANTHROPIC_API_KEY set, or <code>npm run serve:ai</code>, or paste a key below.
                </span>
              )}
            </p>

            <div className={`flex flex-col gap-2 ${service?.inPage ? 'hidden' : ''}`}>
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Your own API key (optional)
              </label>
              <input
                value={key}
                onChange={(event) => {
                  setKey(event.target.value);
                  setKeySaved(false);
                }}
                type="password"
                placeholder="sk-ant-..."
                className="rounded-xl border border-ink-500/20 bg-night-900/80 px-3 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-glow-400/60"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    storeKey(key.trim() || null);
                    setKeySaved(true);
                  }}
                >
                  {keySaved ? 'Saved' : 'Save key'}
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    storeKey(null);
                    setKey('');
                    setKeySaved(false);
                  }}
                >
                  Clear
                </Button>
              </div>
              <p className="text-[0.68rem] text-ink-600">
                Stored in this browser only, never in your save file, and sent to the local dialogue
                service rather than to Anthropic directly. Leave it empty on a machine you do not own.
              </p>
            </div>
          </>
        )}
      </section>

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
