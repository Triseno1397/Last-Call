import { describe, expect, it } from 'vitest';
import {
  addHobbyXp,
  addStatXp,
  adjustStat,
  effectiveStat,
  grantStatXp,
  registerSocialOutcome,
  xpForNextStatPoint,
} from '@/engine/progression';
import { BALANCE } from '@/config/gameConfig';
import { newTestGame } from '@/test/helpers';

describe('stat progression', () => {
  it('needs more XP per point as the stat rises', () => {
    expect(xpForNextStatPoint(10)).toBeLessThan(xpForNextStatPoint(60));
  });

  it('banks XP and converts it into points', () => {
    const cost = xpForNextStatPoint(25);
    const { stat, pointsGained } = addStatXp({ value: 25, xp: 0 }, cost - 1);
    expect(pointsGained).toBe(0);
    expect(stat.xp).toBe(cost - 1);

    const next = addStatXp(stat, 1);
    expect(next.pointsGained).toBe(1);
    expect(next.stat.value).toBe(26);
    expect(next.stat.xp).toBe(0);
  });

  it('can gain several points from one big grant', () => {
    const { pointsGained } = addStatXp({ value: 10, xp: 0 }, 1000);
    expect(pointsGained).toBeGreaterThan(3);
  });

  it('never exceeds the stat ceiling', () => {
    const { stat } = addStatXp({ value: 99, xp: 0 }, 100000);
    expect(stat.value).toBe(BALANCE.stats.max);
    expect(stat.xp).toBe(0);
  });

  it('ignores zero and negative XP', () => {
    const start = { value: 40, xp: 12 };
    expect(addStatXp(start, 0).stat).toEqual(start);
    expect(addStatXp(start, -50).stat).toEqual(start);
  });

  it('applies perk multipliers to granted XP', () => {
    const witty = newTestGame({ perks: ['quick_wit', 'thick_skin'] }).player;
    const plain = newTestGame({ perks: ['hustler', 'night_owl'] }).player;
    const wittyResult = grantStatXp(witty, 'humor', 100);
    const plainResult = grantStatXp(plain, 'humor', 100);
    expect(wittyResult.player.stats.humor.xp).toBeGreaterThan(plainResult.player.stats.humor.xp);
  });

  it('clamps direct stat adjustments', () => {
    const player = newTestGame().player;
    expect(adjustStat(player, 'charm', -999).stats.charm.value).toBe(BALANCE.stats.min);
    expect(adjustStat(player, 'charm', 999).stats.charm.value).toBe(BALANCE.stats.max);
  });
});

describe('hobby progression', () => {
  it('levels up and stops at the cap', () => {
    const { hobby, levelsGained } = addHobbyXp({ level: 0, xp: 0 }, 100000);
    expect(hobby.level).toBe(BALANCE.hobbies.maxLevel);
    expect(levelsGained).toBe(BALANCE.hobbies.maxLevel);
  });
});

describe('effective stats', () => {
  it('adds temporary bonuses and the worn outfit', () => {
    const base = newTestGame().player;
    const withBonus = {
      ...base,
      temporaryEffects: [
        { id: 'cut', label: 'Fresh Cut', stat: 'style' as const, amount: 6, expiresOnAbsoluteDay: 7 },
      ],
    };
    expect(effectiveStat(withBonus, 'style')).toBe(
      effectiveStat(base, 'style') + 6,
    );
  });
});

describe('confidence', () => {
  it('rises on a success and resets the failure streak', () => {
    const player = { ...newTestGame().player, confidence: { successes: 0, failures: 2 } };
    const result = registerSocialOutcome(player, 'success');
    expect(result.confidenceDelta).toBe(BALANCE.confidence.successGain);
    expect(result.player.confidence.failures).toBe(0);
  });

  it('rewards surviving a rejection with confidence and awareness XP', () => {
    const player = newTestGame({ perks: ['hustler', 'night_owl'] }).player;
    const result = registerSocialOutcome(player, 'rejection');
    expect(result.confidenceDelta).toBe(BALANCE.confidence.rejectionGain);
    expect(result.player.awareness.xp).toBeGreaterThan(player.awareness.xp);
  });

  it('pays Thick Skin a bonus on rejection', () => {
    const tough = newTestGame({ perks: ['thick_skin', 'hustler'] }).player;
    const result = registerSocialOutcome(tough, 'rejection');
    expect(result.confidenceDelta).toBeGreaterThan(BALANCE.confidence.rejectionGain);
  });

  it('only dips confidence once a failure streak builds up', () => {
    let player = newTestGame({ perks: ['hustler', 'night_owl'] }).player;
    const start = player.stats.confidence.value;

    for (let i = 0; i < BALANCE.confidence.failureStreakThreshold - 1; i += 1) {
      player = registerSocialOutcome(player, 'failure').player;
    }
    expect(player.stats.confidence.value).toBe(start);

    player = registerSocialOutcome(player, 'failure').player;
    expect(player.stats.confidence.value).toBe(start - BALANCE.confidence.failureStreakLoss);
    expect(player.confidence.failures).toBe(0);
  });

  it('halves the streak dip for Thick Skin', () => {
    let player = newTestGame({ perks: ['thick_skin', 'hustler'] }).player;
    const start = player.stats.confidence.value;
    for (let i = 0; i < BALANCE.confidence.failureStreakThreshold; i += 1) {
      player = registerSocialOutcome(player, 'failure').player;
    }
    expect(start - player.stats.confidence.value).toBe(
      Math.round(BALANCE.confidence.failureStreakLoss * 0.5),
    );
  });
});
