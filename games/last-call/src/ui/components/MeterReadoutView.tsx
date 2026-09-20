import type { MeterReadout } from '@/engine/awareness';

/**
 * The awareness mechanic, on screen. At level 0 this renders nothing at all —
 * the player has her face and the cue line and that is it.
 */
export function MeterReadoutView({
  readout,
  label,
  tone,
}: {
  readout: MeterReadout;
  label: string;
  tone: string;
}) {
  if (readout.visibility === 'hidden') return null;

  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-600">
          {label}
        </span>
        {readout.delta && (
          <span
            className={`font-display text-[0.7rem] ${
              readout.delta === 'up' || readout.delta.startsWith('+') ? 'text-lime-400' : 'text-alarm-400'
            }`}
          >
            {readout.delta === 'up' ? '▲' : readout.delta === 'down' ? '▼' : readout.delta}
          </span>
        )}
      </div>

      {readout.segments !== null ? (
        <div className="mt-1 flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index < (readout.segments ?? 0) ? tone : 'bg-night-700'}`}
            />
          ))}
        </div>
      ) : null}

      <p className="mt-1 text-xs text-ink-300">
        {readout.label}
        {readout.value !== null && <span className="ml-1 text-ink-600">({readout.value})</span>}
      </p>
    </div>
  );
}
