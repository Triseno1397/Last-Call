import type { RelationshipStage } from '@/content/ids';
import type { MoodBand } from '@/types/character';
import type {
  DialogueLine,
  DialogueNode,
  DialogueOptionDef,
  DialogueProvider,
  DialogueRequirement,
  EncounterContext,
  EncounterProgress,
  PresentedOption,
  ProviderTurn,
} from '@/types/dialogue';
import { HOBBIES } from '@/content/hobbies';
import { PERKS } from '@/content/traits';
import { STAT_LABELS } from '@/engine/activities';
import { scoreOption } from '@/engine/dialogue/scoring';

export function describeDialogueRequirement(requirement: DialogueRequirement): string {
  switch (requirement.kind) {
    case 'stat':
      return `Needs ${STAT_LABELS[requirement.stat]} ${requirement.min}`;
    case 'hobby':
      return `Needs ${HOBBIES[requirement.hobby].name} level ${requirement.minLevel}`;
    case 'perk':
      return `Needs ${PERKS[requirement.perk].name}`;
    case 'fact':
      return 'Needs something you have not learned about her yet';
    case 'interest':
      return 'She is not interested enough for that yet';
    case 'comfort':
      return 'She is not relaxed enough for that yet';
    case 'stage':
      return 'Not where the two of you are right now';
  }
}

function meetsRequirement(
  requirement: DialogueRequirement,
  context: EncounterContext,
  interest: number,
  comfort: number,
): boolean {
  const { player, memory } = context;
  switch (requirement.kind) {
    case 'stat':
      return player.stats[requirement.stat].value >= requirement.min;
    case 'hobby':
      return player.hobbies[requirement.hobby].level >= requirement.minLevel;
    case 'perk':
      return player.perks.includes(requirement.perk);
    case 'fact':
      return memory.knownFacts.includes(requirement.fact);
    case 'interest':
      return interest >= requirement.min;
    case 'comfort':
      return comfort >= requirement.min;
    case 'stage':
      return requirement.stages.includes(memory.stage);
  }
}

/** The first line whose filters all pass; the last line is the safety net. */
export function selectLine(
  node: DialogueNode,
  mood: MoodBand,
  interest: number,
  encounters: number,
): DialogueLine {
  const match = node.lines.find((line) => {
    if (line.mood && line.mood !== mood) return false;
    if (line.minInterest !== undefined && interest < line.minInterest) return false;
    if (line.maxInterest !== undefined && interest > line.maxInterest) return false;
    if (line.minEncounters !== undefined && encounters < line.minEncounters) return false;
    return true;
  });
  const fallback = node.lines[node.lines.length - 1];
  if (!match && !fallback) throw new Error(`Dialogue node ${node.id} has no lines`);
  return match ?? (fallback as DialogueLine);
}

export function presentOptions(
  node: DialogueNode,
  context: EncounterContext,
  interest: number,
  comfort: number,
): readonly PresentedOption[] {
  const tree =
    context.mode === 'date' && context.character.dateDialogue
      ? context.character.dateDialogue
      : context.character.dialogue;

  return (node.options ?? []).map((option: DialogueOptionDef) => {
    const failed = (option.requires ?? []).filter(
      (requirement) => !meetsRequirement(requirement, context, interest, comfort),
    );

    // Asking for a number you already have is not a move.
    const leadsToNumber = tree.nodes[option.next]?.outcome === 'number';
    if (leadsToNumber && context.memory.hasNumber) {
      return {
        id: option.id,
        type: option.type,
        text: option.text,
        available: false,
        lockReason: 'You already have her number — use it.',
      };
    }

    return {
      id: option.id,
      type: option.type,
      text: option.text,
      available: failed.length === 0,
      lockReason: failed.length === 0 ? null : describeDialogueRequirement(failed[0] as DialogueRequirement),
    };
  });
}

function openingNodeId(stage: RelationshipStage, openings: Record<string, string | undefined>): string {
  return openings[stage] ?? openings['stranger'] ?? 'open_stranger';
}

function treeOf(context: EncounterContext) {
  return context.mode === 'date' && context.character.dateDialogue
    ? context.character.dateDialogue
    : context.character.dialogue;
}

function nodeOrThrow(context: EncounterContext, id: string): DialogueNode {
  const node = treeOf(context).nodes[id];
  if (!node) throw new Error(`${context.character.name}: dialogue node "${id}" does not exist`);
  return node;
}

/**
 * The shipped provider: authored dialogue trees from the character's content
 * file, scored against her preferences and the player's stats.
 */
export function createScriptedDialogueProvider(): DialogueProvider {
  return {
    id: 'scripted',

    async open(context: EncounterContext): Promise<ProviderTurn> {
      const startId = openingNodeId(context.memory.stage, treeOf(context).openings);
      const node = nodeOrThrow(context, startId);
      const { startingInterest: interest, startingComfort: comfort } = context;
      const line = selectLine(node, context.mood, interest, context.memory.encounters);

      return {
        line: line.text,
        expression: line.expression,
        cue: line.cue ?? null,
        interestDelta: 0,
        comfortDelta: 0,
        options: presentOptions(node, context, interest, comfort),
        learned: [],
        told: [],
        topics: node.topics ?? [],
        outcome: node.outcome ?? null,
        notes: [],
        dealbroken: false,
        cursor: { value: node.id, turn: 1 },
      };
    },

    async respond(
      context: EncounterContext,
      progress: EncounterProgress,
      optionId: string,
    ): Promise<ProviderTurn> {
      const current = nodeOrThrow(context, progress.cursor.value);
      const option = (current.options ?? []).find((candidate) => candidate.id === optionId);
      if (!option) throw new Error(`Option "${optionId}" is not on node "${current.id}"`);

      const score = scoreOption({
        option,
        character: context.character,
        memory: context.memory,
        player: context.player,
        venue: context.venue,
        mood: context.moodValue,
        interest: progress.interest,
        comfort: progress.comfort,
        turn: progress.cursor.turn,
        openingBonus: context.openingBonus,
      });

      const interest = progress.interest + score.interestDelta;
      const comfort = progress.comfort + score.comfortDelta;
      const next = nodeOrThrow(context, option.next);
      const line = selectLine(next, context.mood, interest, context.memory.encounters);

      return {
        line: line.text,
        expression: line.expression,
        cue: line.cue ?? null,
        interestDelta: score.interestDelta,
        comfortDelta: score.comfortDelta,
        options: next.outcome ? [] : presentOptions(next, context, interest, comfort),
        learned: option.learn ?? [],
        told: option.tell ?? [],
        topics: [...(option.tags ?? []), ...(next.topics ?? [])],
        outcome: next.outcome ?? null,
        notes: score.notes,
        dealbroken: score.dealbroken,
        cursor: { value: next.id, turn: progress.cursor.turn + 1 },
      };
    },
  };
}
