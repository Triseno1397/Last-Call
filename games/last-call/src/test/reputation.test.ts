import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import {
  REPUTATION_CEILING,
  REPUTATION_FLOOR,
  adjustReputation,
  gossipFor,
  reputationAt,
  reputationComfortBonus,
  reputationLabel,
} from '@/engine/reputation';
import { beginEncounter, buildContext, concludeEncounter } from '@/engine/encounter';
import { createScriptedDialogueProvider } from '@/engine/dialogue/scriptedProvider';
import { NADIA } from '@/content/characters/nadia';
import { emptyMemory } from '@/engine/characters';
import { createRng } from '@/engine/rng';
import { newTestGame } from '@/test/helpers';

const provider = createScriptedDialogueProvider();
const rng = () => createRng(3);

function atTheGym(overrides: Partial<GameState> = {}): GameState {
  const game = newTestGame();
  return { ...game, clock: { week: 1, dayIndex: 0, slotIndex: 0 }, ...overrides };
}

describe('venue reputation', () => {
  it('starts at nothing and stays inside its bounds', () => {
    const game = newTestGame();
    expect(reputationAt(game, 'neon_last_call')).toBe(0);
    const high = adjustReputation(game, 'neon_last_call', 999);
    expect(reputationAt(high, 'neon_last_call')).toBe(REPUTATION_CEILING);
    const low = adjustReputation(game, 'neon_last_call', -999);
    expect(reputationAt(low, 'neon_last_call')).toBe(REPUTATION_FLOOR);
  });

  it('rises for a good night and falls when she walks off', async () => {
    const game = atTheGym();
    const encounter = await beginEncounter(game, 'nadia', 'ironhaus', 0, provider);

    const good = concludeEncounter(game, { ...encounter, outcome: 'number', interest: 70 }, rng());
    expect(reputationAt(good.state, 'ironhaus')).toBeGreaterThan(0);

    const bad = concludeEncounter(game, { ...encounter, outcome: 'she_left', interest: 10 }, rng());
    expect(reputationAt(bad.state, 'ironhaus')).toBeLessThan(0);
  });

  it('makes people relax around a regular', () => {
    expect(reputationComfortBonus(12)).toBeGreaterThan(reputationComfortBonus(0));
    expect(reputationComfortBonus(-20)).toBeLessThan(0);
    expect(reputationLabel(20)).toContain('furniture');
  });

  it('feeds into where an encounter starts', async () => {
    const plain = atTheGym();
    const regular = adjustReputation(plain, 'ironhaus', 14);
    const plainStart = buildContext(plain, 'nadia', 'ironhaus').startingComfort;
    const regularStart = buildContext(regular, 'nadia', 'ironhaus').startingComfort;
    expect(regularStart).toBeGreaterThan(plainStart);
  });
});

describe('gossip', () => {
  it('costs you with her friends when you burn one of them', () => {
    const burned = {
      sable: { ...emptyMemory(), met: true, dealbroken: true, stage: 'not_interested' as const },
    };
    const result = gossipFor(NADIA, burned);
    expect(result.interest).toBeLessThan(0);
    expect(result.comfort).toBeLessThan(0);
    expect(result.notes.join(' ')).toContain('Word travels');
  });

  it('warms the room when a friend likes you', () => {
    const liked = { sable: { ...emptyMemory(), met: true, interest: 70, encounters: 3 } };
    const result = gossipFor(NADIA, liked);
    expect(result.comfort).toBeGreaterThan(0);
  });

  it('says nothing about people the player has never met', () => {
    expect(gossipFor(NADIA, {})).toEqual({ interest: 0, comfort: 0, notes: [] });
  });

  it('changes how an encounter opens', async () => {
    const clean = atTheGym();
    const messy: GameState = {
      ...clean,
      characters: {
        sable: { ...emptyMemory(), met: true, dealbroken: true, stage: 'not_interested' },
      },
    };
    const cleanStart = buildContext(clean, 'nadia', 'ironhaus');
    const messyStart = buildContext(messy, 'nadia', 'ironhaus');
    expect(messyStart.startingComfort).toBeLessThan(cleanStart.startingComfort);
    expect(messyStart.startingInterest).toBeLessThan(cleanStart.startingInterest);

    const encounter = await beginEncounter(messy, 'nadia', 'ironhaus', 0, provider);
    expect(encounter.cue).toContain('Word travels');
  });
});
