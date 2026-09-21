import type { ActivityPreview } from '@/engine/activities';
import { Chip } from '@/ui/components/Chip';

interface ActivityCardProps {
  preview: ActivityPreview;
  onPick: () => void;
}

export function ActivityCard({ preview, onPick }: ActivityCardProps) {
  const { activity, cost, effects, availability } = preview;
  const locked = !availability.ok;

  return (
    <button
      onClick={onPick}
      aria-disabled={locked}
      className={`tap w-full rounded-2xl border p-4 text-left ${
        locked
          ? 'border-ink-600/15 bg-night-900/50 opacity-70'
          : 'border-ink-500/20 bg-night-850/80 hover:border-glow-400/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`font-display text-base font-semibold ${locked ? 'text-ink-500' : 'text-ink-100'}`}>
            {activity.name}
          </h3>
          <p className="mt-0.5 text-sm leading-snug text-ink-500">{activity.blurb}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="font-display text-xs text-ink-500">
            {cost.slots > 1 ? `${cost.slots} slots` : '1 slot'}
          </span>
          {cost.energy > 0 && <span className="text-[0.7rem] text-glow-400">-{cost.energy} energy</span>}
          {cost.money > 0 && <span className="text-[0.7rem] text-gold-400">-${cost.money}</span>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {locked
          ? availability.reasons.map((reason) => (
              <Chip key={reason} tone="lock">
                {reason}
              </Chip>
            ))
          : effects.map((effect) => (
              <Chip key={effect} tone="good">
                {effect}
              </Chip>
            ))}
      </div>
    </button>
  );
}
