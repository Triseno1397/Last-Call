import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import type { ScheduledDate } from '@/types/phone';
import {
  beginDate,
  concludeDate,
  dateDueNow,
  payForDate,
  resolveMissedDates,
  upcomingDates,
} from '@/engine/dates';
import { createScriptedDialogueProvider } from '@/engine/dialogue/scriptedProvider';
import { chooseOption } from '@/engine/encounter';
import { canAskWingman, tipFor, wingmanIsAround } from '@/engine/wingman';
import { threadFor } from '@/engine/phone';
import { emptyMemory } from '@/engine/characters';
import { createRng } from '@/engine/rng';
import { DATE_IDEAS } from '@/content/dateIdeas';
import { newTestGame } from '@/test/helpers';

const provider = createScriptedDialogueProvider();
const rng = () => createRng(21);

function planned(overrides: Partial<ScheduledDate> = {}): ScheduledDate {
  return {
    characterId: 'wren',
    ideaId: 'late_dinner',
    week: 1,
    dayIndex: 3,
    slotIndex: 2,
    resolved: false,
    ...overrides,
  };
}

function withDate(date = planned(), clock = { week: 1, dayIndex: 3, slotIndex: 2 }): GameState {
  const game = newTestGame();
  return {
    ...game,
    clock,
    dates: [date],
    characters: {
      wren: {
        ...emptyMemory(),
        met: true,
        hasNumber: true,
        interest: 60,
        stage: 'interested',
        encounters: 3,
      },
    },
  };
}

describe('the diary', () => {
  it('finds the date that is happening right now', () => {
    expect(dateDueNow(withDate())?.characterId).toBe('wren');
    expect(dateDueNow(withDate(planned(), { week: 1, dayIndex: 3, slotIndex: 1 }))).toBeNull();
  });

  it('lists what is still ahead', () => {
    const game = withDate(planned({ dayIndex: 5 }), { week: 1, dayIndex: 3, slotIndex: 0 });
    expect(upcomingDates(game)).toHaveLength(1);
  });

  it('charges for the evening up front', () => {
    const game = withDate();
    const paid = payForDate(game, planned());
    expect(paid.player.money).toBe(game.player.money - DATE_IDEAS.late_dinner.cost);
    expect(paid.player.energy).toBe(game.player.energy - DATE_IDEAS.late_dinner.energy);
  });
});

describe('standing her up', () => {
  it('costs a lot of interest and she says so', () => {
    const game = withDate(planned(), { week: 1, dayIndex: 4, slotIndex: 0 });
    const result = resolveMissedDates(game, rng());
    const memory = result.state.characters.wren;
    expect(memory?.interest).toBeLessThan(60);
    expect(memory?.standUps).toBe(1);
    expect(result.state.dates[0]?.resolved).toBe(true);
    expect(threadFor(result.state, 'wren').messages.length).toBeGreaterThan(0);
    expect(threadFor(result.state, 'wren').unread).toBe(true);
  });

  it('ends it entirely the second time', () => {
    const game = withDate(planned(), { week: 1, dayIndex: 4, slotIndex: 0 });
    const once: GameState = {
      ...game,
      characters: { wren: { ...(game.characters.wren ?? emptyMemory()), standUps: 1 } },
    };
    const result = resolveMissedDates(once, rng());
    expect(result.state.characters.wren?.stage).toBe('not_interested');
  });

  it('leaves a date that has not happened yet alone', () => {
    const game = withDate(planned({ dayIndex: 5 }), { week: 1, dayIndex: 3, slotIndex: 0 });
    expect(resolveMissedDates(game, rng()).state.dates[0]?.resolved).toBe(false);
  });
});

describe('playing the date', () => {
  it('opens her date tree, not her venue tree', async () => {
    const game = withDate();
    const encounter = await beginDate(game, planned(), provider);
    expect(encounter.mode).toBe('date');
    expect(encounter.cursor.value).toBe('arrive');
    expect(encounter.line).toContain('changed four times');
  });

  it('goes somewhere: a good run ends the night well', async () => {
    const game = withDate();
    let encounter = await beginDate(game, planned(), provider);
    encounter = await chooseOption(game, encounter, 'arrive_match', provider, rng());
    encounter = await chooseOption(game, encounter, 'one_real', provider, rng());
    encounter = await chooseOption(game, encounter, 'real_sit', provider, rng());
    encounter = await chooseOption(game, encounter, 'two_match', provider, rng());
    encounter = await chooseOption(game, encounter, 'home_soon', provider, rng());
    expect(encounter.outcome).toBe('date_planned');
  });

  it('writes a great date into her memory and unlocks the gallery entry', async () => {
    const game = withDate();
    const encounter = await beginDate(game, planned(), provider);
    const result = concludeDate(
      game,
      { ...encounter, outcome: 'date_planned', interest: 78, comfort: 70 },
      planned(),
      rng(),
    );
    const memory = result.state.characters.wren;
    expect(result.went).toBe('great');
    expect(memory?.stage).toBe('dating');
    expect(memory?.dates).toBe(1);
    expect(memory?.unlockedCgs).toContain('cg_first_date');
    expect(memory?.seenOutfits.length).toBeGreaterThan(0);
    expect(result.state.dates[0]?.resolved).toBe(true);
  });

  it('records a bad night without ending the world', async () => {
    const game = withDate();
    const encounter = await beginDate(game, planned(), provider);
    const result = concludeDate(
      game,
      { ...encounter, outcome: 'rejected', interest: 30, comfort: 20 },
      planned(),
      rng(),
    );
    expect(result.went).toBe('badly');
    expect(result.state.characters.wren?.stage).not.toBe('dating');
  });
});

describe('the wingman', () => {
  it('gives one tip a day and does not repeat himself', () => {
    const game = newTestGame();
    expect(canAskWingman(game)).toBe(true);
    const first = tipFor(game, 'sable', rng());
    expect(canAskWingman(first.state)).toBe(false);
    expect(first.text.length).toBeGreaterThan(20);

    const second = tipFor({ ...first.state, phone: { ...first.state.phone, lastTipDay: null } }, 'sable', rng());
    expect(second.text).not.toBe(first.text);
  });

  it('can hand over a fact the player has not discovered', () => {
    const game = newTestGame();
    let state = game;
    let unlocked = false;
    for (let i = 0; i < 6 && !unlocked; i += 1) {
      const result = tipFor({ ...state, phone: { ...state.phone, lastTipDay: null } }, 'nadia', createRng(i + 1));
      state = result.state;
      unlocked = (state.characters.nadia?.knownFacts ?? []).includes('nadia_physio');
    }
    expect(unlocked).toBe(true);
  });

  it('is only at his bar on his nights', () => {
    const friday = { ...newTestGame(), clock: { week: 1, dayIndex: 4, slotIndex: 2 } };
    const tuesday = { ...newTestGame(), clock: { week: 1, dayIndex: 1, slotIndex: 2 } };
    expect(wingmanIsAround(friday, 'neon_last_call')).toBe(true);
    expect(wingmanIsAround(friday, 'ironhaus')).toBe(false);
    expect(wingmanIsAround(tuesday, 'neon_last_call')).toBe(false);
  });
});
