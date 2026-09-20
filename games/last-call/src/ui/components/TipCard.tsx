import { TIPS } from '@/content/onboarding';
import { useGameStore } from '@/state/gameStore';

/**
 * A single first-run tip. Renders nothing once it has been read, or if the
 * player has turned tips off.
 */
export function TipCard({ id }: { id: keyof typeof TIPS }) {
  const game = useGameStore((store) => store.game);
  const dismissTip = useGameStore((store) => store.dismissTip);
  const tip = TIPS[id];

  if (!game || !tip) return null;
  if (!game.settings.showTips) return null;
  if (game.player.flags[`tip_${id}`]) return null;

  return (
    <section className="rise-in rounded-2xl border border-glow-400/40 bg-glow-500/10 p-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-glow-400">
        {tip.title}
      </h3>
      <p className="mt-1.5 text-sm leading-snug text-ink-300">{tip.body}</p>
      <button
        onClick={() => dismissTip(id)}
        className="tap mt-3 rounded-lg border border-glow-400/40 px-3 py-1.5 text-xs font-semibold text-ink-100"
      >
        Got it
      </button>
    </section>
  );
}
