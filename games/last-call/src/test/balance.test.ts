import { describe, expect, it } from 'vitest';
import type { ActivityId, CharacterId } from '@/content/ids';
import type { GameState } from '@/types/game';
import type { EncounterState } from '@/types/dialogue';
import { performActivity, checkAvailability, skipSlot } from '@/engine/activities';
import { getActivity } from '@/content/activities';
import { VENUES } from '@/content/venues';
import { advanceSlots, appendLog, currentSlot } from '@/engine/calendar';
import { crowdAt } from '@/engine/characters';
import { beginEncounter, chooseOption, concludeEncounter } from '@/engine/encounter';
import { createScriptedDialogueProvider } from '@/engine/dialogue/scriptedProvider';
import { onDayRolled } from '@/engine/dayTick';
import { createRng } from '@/engine/rng';
import { createNewGame } from '@/engine/newGame';
import { choices } from '@/test/helpers';
import { BALANCE } from '@/config/gameConfig';

const provider = createScriptedDialogueProvider();

/**
 * A "sensible player": works on weekdays, trains or reads in the afternoon,
 * goes out when someone is around, and in conversation picks the reply type she
 * is known to like. Not optimal — just someone paying attention.
 *
 * This is the balance harness. If the numbers stop supporting a player like
 * this, these tests fail and the constants need another look.
 */
const SELF_IMPROVEMENT: readonly ActivityId[] = [
  'gym_session',
  'read_a_book',
  'improv_class',
  'practice_guitar',
];

function firstAvailable(state: GameState, ids: readonly ActivityId[]): ActivityId | null {
  for (const id of ids) {
    if (checkAvailability(state, getActivity(id)).ok) return id;
  }
  return null;
}

async function runEncounter(
  state: GameState,
  characterId: CharacterId,
  venueId: keyof typeof VENUES,
): Promise<{ state: GameState; encounter: EncounterState }> {
  const rng = createRng(state.rngSeed, state.rngCursor);
  let encounter = await beginEncounter(state, characterId, venueId, 0, provider);
  const character = encounter.characterId;

  for (let turn = 0; turn < 10 && !encounter.outcome; turn += 1) {
    const options = encounter.options.filter((option) => option.available && option.type !== 'exit');
    if (options.length === 0) break;

    // Pick the reply type she likes most; ignore bold moves until late.
    const def = (await import('@/content/characters')).getCharacter(character as CharacterId);
    const ranked = [...options].sort(
      (a, b) => (def.preferences[b.type] ?? 1) - (def.preferences[a.type] ?? 1),
    );
    const bold = options.find((option) => option.type === 'bold');
    const pick = encounter.interest >= 58 && bold ? bold : ranked[0];
    if (!pick) break;
    encounter = await chooseOption(state, encounter, pick.id, provider, rng);
  }

  const concluded = concludeEncounter({ ...state, rngCursor: rng.cursor }, encounter, rng);
  return { state: { ...concluded.state, rngCursor: rng.cursor }, encounter };
}

interface SimResult {
  state: GameState;
  numbers: number;
  brokeWeeks: number;
}

async function simulate(weeks: number, seed: number): Promise<SimResult> {
  let state = createNewGame(choices({ perks: ['quick_wit', 'good_listener'], flaw: 'overthinker' }), seed);
  let numbers = 0;
  let brokeWeeks = 0;
  let guard = 0;

  while (state.clock.week <= weeks && guard < 400) {
    guard += 1;
    const slot = currentSlot(state.clock);
    const rng = createRng(state.rngSeed, state.rngCursor);

    // Evening: go out if there is someone to meet.
    if (slot === 'evening') {
      const venueId = (['neon_last_call', 'ironhaus', 'margin_notes'] as const).find((id) => {
        const activity = getActivity(`go_out_${id}` as ActivityId);
        return (
          checkAvailability(state, activity).ok &&
          crowdAt(VENUES[id], state.clock, state.characters).length > 0
        );
      });

      if (venueId) {
        const visit = performActivity(state, `go_out_${venueId}` as ActivityId, rng, { deferClock: true });
        if (visit.ok) {
          state = { ...visit.state, rngCursor: rng.cursor };
          const crowd = crowdAt(VENUES[venueId], state.clock, state.characters);
          for (const member of crowd) {
            if (member.memory.dealbroken || member.memory.stage === 'not_interested') continue;
            const result = await runEncounter(state, member.character.id, venueId);
            state = result.state;
            if (result.encounter.outcome === 'number' || result.encounter.outcome === 'date_planned') {
              numbers += 1;
            }
            break;
          }
          const after = advanceSlots(state, 1, rng);
          const ticked = after.dayRolled ? onDayRolled(after.state, rng) : { state: after.state, entries: [] };
          state = { ...appendLog(ticked.state, [...after.entries, ...ticked.entries]), rngCursor: rng.cursor };
          continue;
        }
      }
    }

    const choice =
      slot === 'morning'
        ? firstAvailable(state, ['work_shift', ...SELF_IMPROVEMENT, 'rest'])
        : firstAvailable(state, [...SELF_IMPROVEMENT, 'work_shift', 'rest']);

    const result = choice ? performActivity(state, choice, rng) : skipSlot(state, rng);
    const ticked = result.dayRolled
      ? onDayRolled(result.state, rng)
      : { state: result.state, entries: [] };
    state = { ...appendLog(ticked.state, ticked.entries), rngCursor: rng.cursor };
    if (state.player.money <= 0) brokeWeeks += 1;
  }

  return { state, numbers, brokeWeeks };
}

describe('balance: a sensible player over three weeks', () => {
  it('keeps the lights on and gets somewhere', async () => {
    const { state, numbers } = await simulate(3, 4242);
    const stats = state.player.stats;

    if (process.env['BALANCE_REPORT']) {
      // eslint-disable-next-line no-console
      console.log({
        week: state.clock.week,
        money: state.player.money,
        job: state.player.career.jobId,
        awareness: state.player.awareness.level,
        stats: Object.fromEntries(Object.entries(stats).map(([id, value]) => [id, value.value])),
        numbers,
        met: Object.entries(state.characters).map(([id, memory]) => [id, memory?.interest]),
      });
    }

    // Money: rent is paid, the player is not destitute.
    expect(state.player.money).toBeGreaterThan(0);
    expect(state.player.flags['behind_on_rent']).toBeUndefined();

    // Progression: three weeks of effort should be visible.
    const grown = Object.values(stats).filter((stat) => stat.value > BALANCE.stats.startingValue);
    expect(grown.length).toBeGreaterThanOrEqual(3);

    // Awareness: the meters should have started to fade in by now.
    expect(state.player.awareness.level).toBeGreaterThanOrEqual(1);

    // Social: paying attention should produce at least one number in three weeks.
    expect(numbers).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('is not trivially winnable: nobody hands out numbers on night one', async () => {
    const { numbers } = await simulate(1, 99);
    expect(numbers).toBeLessThanOrEqual(2);
  }, 30000);
});
