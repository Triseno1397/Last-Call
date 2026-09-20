import { useEffect, useRef, useState } from 'react';
import type { PlayerState } from '@/types/player';
import { DARTS_THROWS, dartsVerdict, scoreThrow, sweetSpot } from '@/engine/darts';
import { Button } from '@/ui/components/Button';

/**
 * Darts. A marker sweeps the board; stop it in the middle. Fitness and
 * confidence widen the sweet spot. With reduced motion on, the sweep is
 * replaced by a single throw resolved from the same numbers.
 */
export function DartsGame({
  player,
  reducedMotion,
  onFinish,
}: {
  player: PlayerState;
  reducedMotion: boolean;
  onFinish: (total: number) => void;
}) {
  const [throwsLeft, setThrowsLeft] = useState(DARTS_THROWS);
  const [total, setTotal] = useState(0);
  const [marker, setMarker] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [running, setRunning] = useState(!reducedMotion);
  const frame = useRef<number>(0);
  const start = useRef<number>(0);
  const spot = sweetSpot(player);

  useEffect(() => {
    if (!running || reducedMotion) return;
    start.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start.current) / 900;
      setMarker(Math.sin(elapsed * Math.PI * 2));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [running, reducedMotion, throwsLeft]);

  const resolve = (accuracy: number) => {
    const score = scoreThrow(accuracy, player);
    const nextTotal = total + score;
    const remaining = throwsLeft - 1;
    setLastScore(score);
    setTotal(nextTotal);
    setThrowsLeft(remaining);
    if (remaining <= 0) {
      setRunning(false);
      onFinish(nextTotal);
    }
  };

  const throwDart = () => {
    if (throwsLeft <= 0) return;
    if (reducedMotion) {
      resolve((Math.random() * 2 - 1) * (1 - spot));
      return;
    }
    cancelAnimationFrame(frame.current);
    resolve(marker);
  };

  const pct = 50 + marker * 46;
  const bandWidth = spot * 92;

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-base font-semibold">Darts</h3>
        <span className="text-xs text-ink-500">
          {throwsLeft > 0 ? `${throwsLeft} left` : dartsVerdict(total)}
        </span>
      </div>

      <div className="relative mt-4 h-10 overflow-hidden rounded-xl border border-ink-500/20 bg-night-900">
        <div
          className="absolute inset-y-0 bg-lime-400/20"
          style={{ left: `${50 - bandWidth / 2}%`, width: `${bandWidth}%` }}
        />
        <div
          className="absolute inset-y-0 bg-lime-400/40"
          style={{ left: `${50 - bandWidth / 6}%`, width: `${bandWidth / 3}%` }}
        />
        {!reducedMotion && (
          <div
            className="absolute inset-y-1 w-1 rounded-full bg-neon-400"
            style={{ transform: `translateX(${pct * 3.6}px)` }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center font-display text-sm text-ink-300">
          {total}
        </div>
      </div>

      {lastScore !== null && (
        <p className="mt-2 text-xs text-ink-500">
          {lastScore >= 60 ? 'Bullseye.' : lastScore >= 40 ? 'Good dart.' : lastScore > 0 ? 'On the board.' : 'The wall again.'}
        </p>
      )}

      {throwsLeft > 0 ? (
        <Button variant="primary" className="mt-3 w-full" onClick={throwDart}>
          Throw
        </Button>
      ) : (
        <p className="mt-3 text-sm text-lime-400">{dartsVerdict(total)}</p>
      )}
    </div>
  );
}
