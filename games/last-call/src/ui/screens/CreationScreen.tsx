import { useMemo, useState } from 'react';
import type { FlawId, Gender, HobbyId, PerkId } from '@/content/ids';
import type { Appearance } from '@/types/player';
import type { AppearanceChoice } from '@/types/player';
import { BUILDS, DEFAULT_APPEARANCE, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, VIBES } from '@/content/appearance';
import { FLAW_LIST, PERK_LIST } from '@/content/traits';
import { HOBBY_LIST } from '@/content/hobbies';
import { STAT_IDS } from '@/content/ids';
import { PERKS_TO_PICK, createPlayer, validateCreation } from '@/engine/newGame';
import { maxEnergy } from '@/engine/traits';
import { STAT_LABELS } from '@/engine/activities';
import { useGameStore } from '@/state/gameStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { PlayerPortrait } from '@/ui/components/PlayerPortrait';

function OptionRow({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly AppearanceChoice[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              onClick={() => onPick(option.id)}
              className={`tap flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                active
                  ? 'border-neon-400 bg-neon-500/15 text-ink-100'
                  : 'border-ink-500/20 bg-night-800/60 text-ink-300'
              }`}
            >
              {option.swatch && (
                <span
                  className="h-3 w-3 rounded-full border border-white/20"
                  style={{ backgroundColor: option.swatch }}
                />
              )}
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CreationScreen() {
  const { beginGame, goToTitle } = useGameStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('man');
  const [appearance, setAppearance] = useState<Appearance>({ ...DEFAULT_APPEARANCE });
  const [perks, setPerks] = useState<readonly PerkId[]>([]);
  const [flaw, setFlaw] = useState<FlawId | null>(null);
  const [hobby, setHobby] = useState<HobbyId>('guitar');

  const choices = useMemo(
    () => ({
      name,
      gender,
      appearance,
      perks,
      flaw: (flaw ?? 'overthinker') as FlawId,
      startingHobby: hobby,
    }),
    [name, gender, appearance, perks, flaw, hobby],
  );

  const problems = useMemo(() => {
    const found = [...validateCreation(choices)];
    if (!flaw) found.push('Pick a flaw. Everyone has one.');
    return found;
  }, [choices, flaw]);

  const preview = useMemo(() => (problems.length === 0 ? createPlayer(choices) : null), [choices, problems]);

  const togglePerk = (id: PerkId) => {
    setPerks((current) => {
      if (current.includes(id)) return current.filter((perk) => perk !== id);
      if (current.length >= PERKS_TO_PICK) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  return (
    <main className="flex flex-col gap-6 py-8">
      <header className="rise-in">
        <button onClick={goToTitle} className="text-xs text-ink-600 hover:text-ink-300">
          back
        </button>
        <h1 className="font-display text-3xl font-bold tracking-tight">Who are you, then?</h1>
        <p className="mt-1 text-sm text-ink-500">
          Two things you are good at, one thing that gets in your way. Both matter.
        </p>
      </header>

      <section className="panel flex items-center gap-4 p-4">
        <PlayerPortrait appearance={appearance} size={96} />
        <div className="min-w-0 flex-1">
          <label className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            placeholder="Your name"
            className="mt-1 w-full rounded-xl border border-ink-500/20 bg-night-900/80 px-3 py-2.5 font-display text-lg text-ink-100 outline-none placeholder:text-ink-600 focus:border-glow-400/60"
          />
          <div className="mt-3 flex gap-2">
            {(['man', 'woman'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setGender(option)}
                className={`tap flex-1 rounded-xl border px-3 py-2 text-xs font-semibold capitalize ${
                  gender === option
                    ? 'border-glow-400 bg-glow-500/15 text-ink-100'
                    : 'border-ink-500/20 bg-night-800/60 text-ink-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {preview && (
            <p className="mt-2 text-xs text-ink-500">
              Starting out: ${preview.money} · {maxEnergy(preview)} max energy
            </p>
          )}
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-4">
        <h2 className="font-display text-lg font-semibold">Look</h2>
        <OptionRow
          label="Hair"
          options={HAIR_STYLES}
          value={appearance.hairStyle}
          onPick={(id) => setAppearance((a) => ({ ...a, hairStyle: id }))}
        />
        <OptionRow
          label="Colour"
          options={HAIR_COLORS}
          value={appearance.hairColor}
          onPick={(id) => setAppearance((a) => ({ ...a, hairColor: id }))}
        />
        <OptionRow
          label="Eyes"
          options={EYE_COLORS}
          value={appearance.eyeColor}
          onPick={(id) => setAppearance((a) => ({ ...a, eyeColor: id }))}
        />
        <OptionRow
          label="Build"
          options={BUILDS}
          value={appearance.build}
          onPick={(id) => setAppearance((a) => ({ ...a, build: id }))}
        />
        <OptionRow
          label="Vibe"
          options={VIBES}
          value={appearance.vibe}
          onPick={(id) => setAppearance((a) => ({ ...a, vibe: id }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Perks</h2>
          <span className="text-xs text-ink-500">
            {perks.length} / {PERKS_TO_PICK} picked
          </span>
        </div>
        <div className="grid gap-2">
          {PERK_LIST.map((perk) => {
            const active = perks.includes(perk.id);
            return (
              <button
                key={perk.id}
                onClick={() => togglePerk(perk.id)}
                className={`tap rounded-2xl border p-4 text-left ${
                  active
                    ? 'border-glow-400/70 bg-glow-500/10'
                    : 'border-ink-500/15 bg-night-850/70 hover:border-ink-500/35'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-semibold">{perk.name}</span>
                  {active && <Chip tone="good">picked</Chip>}
                </div>
                <p className="mt-1 text-sm text-ink-300">{perk.blurb}</p>
                <p className="mt-2 text-xs text-glow-400">{perk.mechanics}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Flaw</h2>
        <div className="grid gap-2">
          {FLAW_LIST.map((item) => {
            const active = flaw === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFlaw(item.id)}
                className={`tap rounded-2xl border p-4 text-left ${
                  active
                    ? 'border-neon-400/70 bg-neon-500/10'
                    : 'border-ink-500/15 bg-night-850/70 hover:border-ink-500/35'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-semibold">{item.name}</span>
                  {active && <Chip tone="lock">yours</Chip>}
                </div>
                <p className="mt-1 text-sm text-ink-300">{item.blurb}</p>
                <p className="mt-2 text-xs text-neon-400">{item.mechanics}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Something you already do</h2>
        <p className="-mt-2 text-sm text-ink-500">Starts at level one. It will come up.</p>
        <div className="flex flex-wrap gap-2">
          {HOBBY_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => setHobby(item.id)}
              className={`tap rounded-full border px-3 py-2 text-xs font-medium ${
                hobby === item.id
                  ? 'border-gold-400 bg-gold-400/15 text-ink-100'
                  : 'border-ink-500/20 bg-night-800/60 text-ink-300'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      {preview && (
        <section className="panel p-4">
          <h2 className="font-display text-lg font-semibold">Starting out</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {STAT_IDS.map((stat) => (
              <div key={stat} className="flex items-baseline justify-between gap-2 border-b hairline pb-1">
                <span className="text-xs text-ink-500">{STAT_LABELS[stat]}</span>
                <span className="font-display text-sm text-ink-100">{preview.stats[stat].value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 bg-gradient-to-t from-night-950 via-night-950/95 to-transparent px-4 pt-6">
        {problems.length > 0 && (
          <ul className="mb-2 text-xs text-alarm-400">
            {problems.slice(0, 2).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
        <Button
          variant="primary"
          className="w-full"
          disabled={problems.length > 0}
          onClick={() => beginGame(choices)}
        >
          Start the week
        </Button>
      </div>
    </main>
  );
}
