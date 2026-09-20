import type { DialogueProvider, EncounterContext, EncounterProgress, ProviderTurn } from '@/types/dialogue';

/**
 * LLM-backed dialogue — a documented stub, not wired up.
 *
 * WHY IT CAN EXIST AT ALL
 * The rest of the game never reads a dialogue tree. It calls `open()` and
 * `respond()` on a DialogueProvider, gets back a line, an expression, a cue,
 * interest/comfort deltas and the next set of replies, and carries on. Swapping
 * providers is a one-line change in engine/encounter.ts.
 *
 * WHAT AN IMPLEMENTATION WOULD DO
 *
 * 1. Build a system prompt from character content, not from prose written here:
 *      - name, age (always 21+), archetype, bio, personality traits
 *      - likes / dislikes / the one dealbreaker
 *      - her voice rules (Sable: short sentences, never explains twice)
 *      - CONTENT_RATING from config: at 'suggestive' the model is told that
 *        romance is innuendo and fade-to-black, and that nothing explicit is
 *        ever generated.
 *
 * 2. Build a state message per turn:
 *      - what she remembers (memory.knownFacts, toldFacts, discussedTopics,
 *        past outcomes, days since she last saw him)
 *      - her mood band for the day and the venue she is in
 *      - current interest and comfort, and the turn number against her patience
 *      - the last few beats of this conversation
 *
 * 3. Ask for structured JSON only, e.g.
 *      {
 *        "line": "...",                     // her reply, in character
 *        "expression": "amused",            // one of the eight portrait states
 *        "cue": "She glances at the door.", // body language, no numbers
 *        "interestDelta": -2.5,             // her honest read of the reply
 *        "comfortDelta": 1,
 *        "learned": ["sable_cooks"],        // facts the player just uncovered
 *        "options": [                       // 3-4 replies for the player
 *          { "id": "o1", "type": "tease", "text": "..." }
 *        ],
 *        "outcome": null                    // or number|date_planned|friendly|
 *                                           // rejected|she_left|you_left
 *      }
 *    and validate it against the same types the scripted provider satisfies.
 *
 * 4. Clamp the model's deltas (it will be generous) and re-run the local
 *    scoring pass for stats, venue weights and dealbreakers, so the mechanical
 *    rules stay in the engine rather than in the model's judgement. The model
 *    writes the words; the game decides what they are worth.
 *
 * 5. Fall back to the scripted provider on a timeout, a refusal, a malformed
 *    response or a rating violation. An encounter must never dead-end.
 *
 * Cost and latency note: one call per turn, ~8 turns per encounter. Cache the
 * character system prompt; only the state message changes turn to turn.
 */
export function createLlmDialogueProvider(): DialogueProvider {
  return {
    id: 'llm-stub',
    async open(_context: EncounterContext): Promise<ProviderTurn> {
      throw new Error('LLMDialogueProvider is not implemented yet. See the notes in this file.');
    },
    async respond(
      _context: EncounterContext,
      _progress: EncounterProgress,
      _optionId: string,
    ): Promise<ProviderTurn> {
      throw new Error('LLMDialogueProvider is not implemented yet. See the notes in this file.');
    },
  };
}
