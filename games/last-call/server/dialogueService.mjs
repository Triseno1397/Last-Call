import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { EXPRESSIONS, RESPONSE_TYPES, TOPIC_TAGS, buildMessages, buildSystemPrompt } from './prompt.mjs';

/** Models this service will talk to, whatever the client asks for. */
export const ALLOWED_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'];
export const DEFAULT_MODEL = 'claude-opus-5';

/**
 * Her reply, as structured data. The game reads every field; the model does not
 * get to write prose anywhere except `line` and `cue`.
 */
const TurnSchema = z.object({
  line: z.string().describe('What she says. One to three sentences, in her voice.'),
  cue: z
    .string()
    .describe('One short sentence of body language. No numbers, no meta, no stage directions.'),
  expression: z.enum(EXPRESSIONS).describe('Her face right now.'),
  interestDelta: z.number().describe('How the last thing he said moved her interest, -12 to 12.'),
  comfortDelta: z.number().describe('How it moved her comfort, -12 to 12.'),
  tags: z
    .array(z.enum(TOPIC_TAGS))
    .describe('What the last thing he said was, in game terms. Empty if nothing fits.'),
  dealbroken: z.boolean().describe('True only if he did the one thing she will not forgive.'),
  learnedFactIds: z
    .array(z.string())
    .describe('Ids of facts about her she just revealed, from the list given. Usually empty.'),
  outcome: z
    .enum(['none', 'number', 'date_planned', 'friendly', 'rejected', 'she_left', 'you_left'])
    .describe('Whether the conversation has just ended, and how.'),
  suggestions: z
    .array(
      z.object({
        type: z.enum(RESPONSE_TYPES),
        text: z.string().describe("What he could say next, in his voice. One sentence."),
      }),
    )
    .describe('Three suggested replies for the player, varied in type.'),
});

export class DialogueError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'DialogueError';
    this.status = status;
  }
}

let cachedClient = null;

/** True when this process has something to authenticate with. */
export function hasCredentials() {
  return Boolean(process.env['ANTHROPIC_API_KEY'] || process.env['ANTHROPIC_AUTH_TOKEN']);
}

function clientFor(apiKey) {
  if (apiKey) return new Anthropic({ apiKey });
  if (!hasCredentials()) {
    throw new DialogueError(
      'No API key on the dialogue service. Start it with ANTHROPIC_API_KEY set, or paste your own key into the game settings.',
      401,
    );
  }
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

function assertShape(body) {
  if (!body || typeof body !== 'object') throw new DialogueError('Missing request body', 400);
  const { character, situation, beats } = body;
  if (!character?.name || !character?.age) throw new DialogueError('Missing character', 400);
  if (character.age < 21) throw new DialogueError('Characters must be 21 or older', 400);
  if (!situation?.venue?.name) throw new DialogueError('Missing situation', 400);
  if (!Array.isArray(beats)) throw new DialogueError('Missing beats', 400);
  if (body.playerSaid !== null && body.playerSaid !== undefined) {
    if (typeof body.playerSaid !== 'string') throw new DialogueError('playerSaid must be text', 400);
    if (body.playerSaid.length > 600) throw new DialogueError('That is a speech, not a line', 400);
  }
}

/**
 * One turn of conversation.
 *
 * Latency matters more than depth here, so this runs at low effort: adaptive
 * thinking stays on (disabling it on Opus 5 is a known footgun) but stays short.
 * The character sheet is cached — it is identical on every turn of every
 * conversation with her.
 */
export async function generateTurn(body, { apiKey } = {}) {
  assertShape(body);

  const model = ALLOWED_MODELS.includes(body.model) ? body.model : DEFAULT_MODEL;
  const client = clientFor(apiKey);
  const system = buildSystemPrompt(body.character, body.contentRating);
  const messages = buildMessages(body.situation, body.beats, body.playerSaid ?? null);

  const response = await client.messages.parse({
    model,
    max_tokens: 2000,
    output_config: {
      effort: 'low',
      format: zodOutputFormat(TurnSchema),
    },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
  });

  if (response.stop_reason === 'refusal') {
    throw new DialogueError('The model declined to continue this conversation.', 422);
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new DialogueError('The model returned something unreadable.', 502);

  return {
    turn: parsed,
    usage: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
      cacheRead: response.usage?.cache_read_input_tokens ?? 0,
      model: response.model ?? model,
    },
  };
}

export function describeError(error) {
  if (error instanceof DialogueError) return { status: error.status, message: error.message };
  if (error instanceof Anthropic.AuthenticationError) {
    return { status: 401, message: 'ANTHROPIC_API_KEY is missing or invalid on the server.' };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 429, message: 'Rate limited. She will be back in a moment.' };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: error.status ?? 502, message: `Claude API error: ${error.message}` };
  }
  return { status: 500, message: error instanceof Error ? error.message : 'Unknown error' };
}
