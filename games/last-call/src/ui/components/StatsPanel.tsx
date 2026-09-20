import type { GameState } from '@/types/game';
import { STAT_LABELS } from '@/engine/activities';
import { xpForNextAwarenessLevel, xpForNextHobbyLevel, xpForNextStatPoint } from '@/engine/progression';
import { careerReadout, statReadouts } from '@/state/selectors';
import { HOBBIES } from '@/content/hobbies';
import { APARTMENTS, WARDROBE } from '@/content/lifestyle';
import { FLAWS, PERKS } from '@/content/traits';
import { HOBBY_IDS } from '@/content/ids';
import { BALANCE } from '@/config/gameConfig';
import { AWARENESS_BLURBS, effectiveAwareness } from '@/engine/awareness';
import { Chip } from '@/ui/components/Chip';
import { Meter } from '@/ui/components/Meter';
import { PlayerPortrait } from '@/ui/components/PlayerPortrait';

export function StatsPanel({ game }: { game: GameState }) {
  const { player } = game;
  const career = careerReadout(game);
  const awareness = player.awareness;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex items-center gap-4 p-4">
        <PlayerPortrait appearance={player.appearance} size={88} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">{player.name}</h2>
          <p className="text-sm text-ink-500">{career.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {player.perks.map((perk) => (
              <Chip key={perk} tone="good">
                {PERKS[perk].name}
              </Chip>
            ))}
            <Chip tone="lock">{FLAWS[player.flaw].name}</Chip>
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Stats
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          {statReadouts(game).map((stat) => (
            <div key={stat.id}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-300">{STAT_LABELS[stat.id]}</span>
                <span className="font-display text-sm">
                  {stat.effective}
                  {stat.effective !== stat.base && (
                    <span className="ml-1 text-xs text-lime-400">(+{stat.effective - stat.base})</span>
                  )}
                </span>
              </div>
              <Meter value={stat.base} max={BALANCE.stats.max} tone="bg-neon-500" compact />
              <div className="mt-1 opacity-80">
                <Meter value={stat.xp} max={xpForNextStatPoint(stat.base)} tone="bg-glow-500/70" compact />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Social awareness
        </h3>
        <p className="mt-2 text-sm text-ink-300">
          Level {awareness.level}. {AWARENESS_BLURBS[effectiveAwareness(player)] ?? AWARENESS_BLURBS[0]}
        </p>
        <div className="mt-2">
          <Meter
            value={awareness.xp}
            max={xpForNextAwarenessLevel(awareness.level)}
            tone="bg-glow-500"
            compact
          />
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Career
        </h3>
        <p className="mt-2 text-sm text-ink-300">
          {career.title} · tier {career.tier}
        </p>
        <div className="mt-2">
          <Meter
            value={career.xp}
            max={Number.isFinite(career.xpToPromote) ? career.xpToPromote : career.xp || 1}
            tone="bg-gold-400"
            trailing={
              Number.isFinite(career.xpToPromote) ? `${career.xp} / ${career.xpToPromote}` : 'top of the ladder'
            }
            compact
          />
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Hobbies
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          {HOBBY_IDS.map((id) => {
            const progress = player.hobbies[id];
            return (
              <div key={id}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-300">{HOBBIES[id].name}</span>
                  <span className="font-display text-xs text-ink-500">level {progress.level}</span>
                </div>
                <Meter
                  value={progress.xp}
                  max={xpForNextHobbyLevel(progress.level)}
                  tone="bg-lime-400"
                  compact
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Life
        </h3>
        <p className="mt-2 text-sm text-ink-300">{APARTMENTS[player.apartmentId].name}</p>
        <p className="text-xs text-ink-500">{APARTMENTS[player.apartmentId].blurb}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {player.wardrobe.map((item) => (
            <Chip key={item} tone={player.outfitId === item ? 'good' : 'neutral'}>
              {WARDROBE[item].name}
              {player.outfitId === item ? ' · worn' : ''}
            </Chip>
          ))}
        </div>
        {player.temporaryEffects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {player.temporaryEffects.map((effect) => (
              <Chip key={effect.id} tone="good">
                {effect.label} +{effect.amount}
              </Chip>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
