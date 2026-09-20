import { describe, expect, it } from 'vitest';
import type { GameState } from '@/types/game';
import { beginEncounter, buildContext, chooseOption, concludeEncounter } from '@/engine/encounter';
import { createScriptedDialogueProvider, selectLine } from '@/engine/dialogue/scriptedProvider';
import { SABLE } from '@/content/characters/sable';
import { decayInterest, emptyMemory, moodBand, moodValueFor, nextStage } from '@/engine/characters';
import { createRng } from '@/engine/rng';
import { newTestGame } from '@/test/helpers';

const provider = createScriptedDialogueProvider();
const rng = () => createRng(5);

/** Thursday evening at the bar: Sable is on shift. */
function atTheBar(overrides: Partial<GameState> = {}): GameState {
  const game = newTestGame();
  return { ...game, clock: { week: 1, dayIndex: 3, slotIndex: 2 }, ...overrides };
}

describe('opening an encounter', () => {
  it('opens on the stranger node with replies to pick from', async () => {
    const encounter = await beginEncounter(atTheBar(), 'sable', 'neon_last_call', 0, provider);
    expect(encounter.cursor.value).toBe('open_stranger');
    expect(encounter.options.length).toBeGreaterThan(2);
    expect(encounter.line.length).toBeGreaterThan(0);
    expect(encounter.interest).toBe(SABLE.baseInterest);
  });

  it('locks replies the player has not earned and says why', async () => {
    const encounter = await beginEncounter(atTheBar(), 'sable', 'neon_last_call', 0, provider);
    const withFlattery = encounter.options.find((option) => option.id === 'open_flattery');
    expect(withFlattery?.available).toBe(true);

    const game = atTheBar();
    const branch = await chooseOption(game, encounter, 'open_direct', provider, rng());
    const hub = await chooseOption(game, branch, 'direct_silence', provider, rng());
    const cookTogether = hub.options.find((option) => option.id === 'hub_cook_together');
    expect(cookTogether?.available).toBe(false);
    expect(cookTogether?.lockReason).toContain('Cooking');
  });

  it('unlocks the hobby reply for a player who cooks', async () => {
    const game = atTheBar();
    const cook: GameState = {
      ...game,
      player: { ...game.player, hobbies: { ...game.player.hobbies, cooking: { level: 2, xp: 0 } } },
    };
    const encounter = await beginEncounter(cook, 'sable', 'neon_last_call', 0, provider);
    const branch = await chooseOption(cook, encounter, 'open_direct', provider, rng());
    const hub = await chooseOption(cook, branch, 'direct_silence', provider, rng());
    expect(hub.options.find((option) => option.id === 'hub_cook_together')?.available).toBe(true);
  });
});

describe('the conversation rules', () => {
  it('ends the moment comfort hits the floor, however interested she was', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, comfort: 2, interest: 90 };
    const next = await chooseOption(game, encounter, 'open_flattery', provider, rng());
    expect(next.outcome).toBe('she_left');
    expect(next.options).toHaveLength(0);
  });

  it('ends politely when her patience runs out', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, cursor: { value: 'open_stranger', turn: SABLE.patience + 1 } };
    const next = await chooseOption(game, encounter, 'open_joke', provider, rng());
    expect(next.outcome).toBe('friendly');
  });

  it('gives up the number when interest and comfort are both there', async () => {
    const context = buildContext(atTheBar(), 'sable', 'neon_last_call', 0);
    const turn = await provider.respond(
      context,
      { cursor: { value: 'hub', turn: 4 }, interest: 70, comfort: 70 },
      'hub_number',
    );
    expect(turn.outcome).toBe('number');
  });

  it('is winnable: a switched-on player can get there inside her patience', async () => {
    const base = atTheBar();
    const game: GameState = {
      ...base,
      player: {
        ...base.player,
        stats: {
          charm: { value: 62, xp: 0 },
          humor: { value: 68, xp: 0 },
          confidence: { value: 64, xp: 0 },
          fitness: { value: 45, xp: 0 },
          style: { value: 58, xp: 0 },
          culture: { value: 55, xp: 0 },
        },
        outfitId: 'leather_jacket',
      },
    };

    const path = [
      'open_direct',
      'direct_silence',
      'hub_food',
      'food_curious',
      'hub_read_room',
      'read_honest',
      'hub_jukebox',
      'jukebox_culture',
      'hub_number',
    ];

    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    for (const step of path) {
      if (encounter.outcome) break;
      encounter = await chooseOption(game, encounter, step, provider, rng());
    }
    expect(encounter.outcome).toBe('number');
  });

  it('turns down a bold move that arrives too early', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = await chooseOption(game, encounter, 'open_joke', provider, rng());
    encounter = await chooseOption(game, encounter, 'joke_drink_good', provider, rng());
    expect(encounter.cursor.value).toBe('hub');
    encounter = await chooseOption(game, encounter, 'hub_number_early', provider, rng());
    expect(encounter.outcome).toBe('rejected');
  });
});

describe('memory', () => {
  it('writes the encounter into her memory', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = await chooseOption(game, encounter, 'open_question', provider, rng());
    encounter = await chooseOption(game, encounter, 'question_honest', provider, rng());
    encounter = { ...encounter, outcome: 'friendly' };

    const { state } = concludeEncounter(game, encounter, rng());
    const memory = state.characters.sable;
    expect(memory?.met).toBe(true);
    expect(memory?.encounters).toBe(1);
    expect(memory?.knownFacts).toContain('sable_reads_people');
    expect(memory?.stage).toBe('acquaintance');
    expect(memory?.seenOutfits).toContain('bar_shift');
  });

  it('records her number and moves the stage on', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, outcome: 'number', interest: 70 };
    const { state } = concludeEncounter(game, encounter, rng());
    expect(state.characters.sable?.hasNumber).toBe(true);
    expect(state.characters.sable?.stage).toBe('interested');
  });

  it('pays confidence for a win and awareness for everything', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, outcome: 'number', interest: 70 };
    const { state } = concludeEncounter(game, encounter, rng());
    expect(state.player.stats.confidence.value).toBeGreaterThan(game.player.stats.confidence.value);
    expect(state.player.awareness.xp).toBeGreaterThan(game.player.awareness.xp);
  });

  it('still pays XP for a rejection, because failure is progress', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, outcome: 'rejected', interest: 20 };
    const { state } = concludeEncounter(game, encounter, rng());
    expect(state.player.awareness.xp).toBeGreaterThan(game.player.awareness.xp);
  });

  it('closes the door permanently on a dealbreaker', async () => {
    const game = atTheBar();
    let encounter = await beginEncounter(game, 'sable', 'neon_last_call', 0, provider);
    encounter = { ...encounter, outcome: 'she_left', dealbroken: true, interest: 80 };
    const { state } = concludeEncounter(game, encounter, rng());
    expect(state.characters.sable?.dealbroken).toBe(true);
    expect(state.characters.sable?.stage).toBe('not_interested');
    expect(state.characters.sable?.interest).toBe(0);
  });

  it('opens differently once she knows you', async () => {
    const game = atTheBar();
    const known: GameState = {
      ...game,
      characters: {
        sable: { ...emptyMemory(), met: true, stage: 'acquaintance', interest: 40, encounters: 2 },
      },
    };
    const encounter = await beginEncounter(known, 'sable', 'neon_last_call', 0, provider);
    expect(encounter.cursor.value).toBe('open_acquaintance');
    expect(encounter.interest).toBe(40);
  });

  it('lets her interest fade if you vanish for a fortnight', () => {
    const memory = { ...emptyMemory(), met: true, interest: 60, lastSeenAbsoluteDay: 0 };
    expect(decayInterest(memory, 8).interest).toBe(60);
    expect(decayInterest(memory, 24).interest).toBeLessThan(60);
  });
});

describe('her day', () => {
  it('is the same every time for a given day, and varies across days', () => {
    const monday = moodValueFor(99, 'sable', 3);
    expect(moodValueFor(99, 'sable', 3)).toBe(monday);
    const week = [0, 1, 2, 3, 4, 5, 6].map((day) => moodBand(moodValueFor(99, 'sable', day)));
    expect(new Set(week).size).toBeGreaterThan(1);
  });

  it('changes which line she opens with', () => {
    const node = SABLE.dialogue.nodes['open_stranger'];
    if (!node) throw new Error('missing node');
    expect(selectLine(node, 'bad', 0, 0).text).not.toBe(selectLine(node, 'good', 0, 0).text);
  });
});

describe('relationship stages', () => {
  it('never moves back once she is done', () => {
    const memory = { ...emptyMemory(), stage: 'not_interested' as const };
    expect(nextStage(memory, 'number', 90)).toBe('not_interested');
  });

  it('takes a second hard no as final', () => {
    const memory = {
      ...emptyMemory(),
      met: true,
      stage: 'acquaintance' as const,
      outcomes: [{ week: 1, dayIndex: 1, outcome: 'rejected' as const, interest: 20, comfort: 40 }],
    };
    expect(nextStage(memory, 'rejected', 20)).toBe('not_interested');
  });

  it('settles into friends after enough warm but flat conversations', () => {
    const friendly = { week: 1, dayIndex: 1, outcome: 'friendly' as const, interest: 30, comfort: 70 };
    const memory = {
      ...emptyMemory(),
      met: true,
      stage: 'acquaintance' as const,
      outcomes: [friendly, friendly, friendly],
    };
    expect(nextStage(memory, 'friendly', 30)).toBe('friend');
  });
});
