interface MeterProps {
  value: number;
  max: number;
  /** Tailwind background class for the fill. */
  tone?: string;
  label?: string;
  trailing?: string;
  compact?: boolean;
}

export function Meter({ value, max, tone = 'bg-glow-500', label, trailing, compact }: MeterProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || trailing) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label && (
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {label}
            </span>
          )}
          {trailing && <span className="font-display text-xs text-ink-300">{trailing}</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-night-700 ${compact ? 'h-1.5' : 'h-2'}`}
      >
        <div
          className={`h-full origin-left rounded-full ${tone} transition-transform duration-300`}
          style={{ transform: `scaleX(${pct / 100})`, width: '100%' }}
        />
      </div>
    </div>
  );
}
