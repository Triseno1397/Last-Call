import type { AiModel } from '@/engine/dialogue/llmProvider';
import type { ContentRating } from '@/types/core';
import type { PromptCharacter, PromptSituation } from '../../../server/prompt.mjs';
import { buildSampleTurns } from '../../../server/prompt.mjs';

/**
 * Where a dialogue turn comes from.
 *
 * Two of them ship. `service` posts to the local dialogue service, which holds
 * the API key — that is the path when you run the game yourself. `sample` asks
 * Claude through the page's own runtime, which is how AI dialogue works in a
 * published artifact: no key, no server, billed to whoever is playing.
 */
export interface TurnRequest {
  character: PromptCharacter;
  situation: PromptSituation;
  beats: readonly { speaker: 'her' | 'you'; text: string }[];
  playerSaid: string | null;
  contentRating: ContentRating;
  model: AiModel;
}

export interface DialogueTransport {
  readonly id: 'service' | 'sample';
  request(payload: TurnRequest, signal?: AbortSignal): Promise<unknown>;
}

export class TransportError extends Error {
  readonly code: string;
  constructor(message: string, code = 'unknown') {
    super(message);
    this.name = 'TransportError';
    this.code = code;
  }
}

/** The viewer-facing message for each way sampling can fail. */
const SAMPLE_MESSAGES: Record<string, string> = {
  not_granted: 'You have not allowed this page to use Claude, so she is on the written script.',
  sampling_disabled: 'Claude is not available on this account — she is on the written script.',
  rate_limited: 'Too many messages too quickly. Give her a moment.',
  session_expired: 'Your Claude session expired. Sign in again to keep talking.',
  refused: 'She would not answer that one. Try saying something else.',
  invalid_json: 'She said something the game could not read. Try again.',
  prompt_too_large: 'That conversation has got too long to send. Start a fresh one.',
  cancelled: 'Cancelled.',
};

function sampleMessage(code: string, fallback: string): string {
  return SAMPLE_MESSAGES[code] ?? fallback;
}

/** How the page's model tiers map onto the models chosen in settings. */
const TIER_FOR_MODEL: Record<AiModel, 'quick' | 'default' | 'complex'> = {
  'claude-opus-5': 'complex',
  'claude-sonnet-5': 'default',
  'claude-haiku-4-5': 'quick',
};

interface SampleNamespace {
  json<T>(
    input: { role: 'user' | 'assistant'; content: string }[],
    options?: { modelTier?: string; cache?: boolean; signal?: AbortSignal },
  ): Promise<T>;
}

interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

function runtime(): ClaudeRuntime | null {
  const candidate = (globalThis as { claude?: ClaudeRuntime }).claude;
  return candidate && typeof candidate.use === 'function' ? candidate : null;
}

/** True when the page is running somewhere it can ask Claude directly. */
export async function sampleAvailable(): Promise<boolean> {
  const claude = runtime();
  if (!claude) return false;
  try {
    return (await claude.use('sample')) !== null;
  } catch {
    return false;
  }
}

export function createSampleTransport(): DialogueTransport {
  return {
    id: 'sample',
    async request(payload, signal) {
      const claude = runtime();
      if (!claude) throw new TransportError('This page cannot reach Claude.', 'not_declared');

      const sample = (await claude.use('sample')) as SampleNamespace | null;
      if (!sample) throw new TransportError('This page cannot reach Claude.', 'not_declared');

      const turns = buildSampleTurns(
        payload.character,
        payload.situation,
        payload.beats,
        payload.playerSaid,
        payload.contentRating,
      );

      try {
        // Never cached: every turn of a conversation must be a fresh answer.
        return await sample.json<unknown>(turns, {
          modelTier: TIER_FOR_MODEL[payload.model],
          cache: false,
          ...(signal ? { signal } : {}),
        });
      } catch (error) {
        const failure = error as { code?: string; message?: string };
        throw new TransportError(
          sampleMessage(failure.code ?? 'unknown', failure.message ?? 'Claude did not answer.'),
          failure.code ?? 'unknown',
        );
      }
    },
  };
}

export function createServiceTransport(endpoint: string, apiKey?: string | null): DialogueTransport {
  return {
    id: 'service',
    async request(payload, signal) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { 'x-dialogue-key': apiKey } : {}),
        },
        body: JSON.stringify(payload),
        ...(signal ? { signal } : {}),
      });

      const text = await response.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        throw new TransportError('The dialogue service replied with something unreadable.', 'bad_response');
      }

      if (!response.ok) {
        const message =
          typeof body === 'object' && body !== null && 'error' in body
            ? String((body as { error: unknown }).error)
            : `Dialogue service error ${response.status}`;
        throw new TransportError(message, `http_${response.status}`);
      }

      return (body as { turn?: unknown }).turn;
    },
  };
}

/**
 * Prefer the page's own Claude runtime when it is there (a published artifact),
 * otherwise the local service. Resolved once per provider.
 */
export async function resolveTransport(
  endpoint: string,
  apiKey?: string | null,
): Promise<DialogueTransport> {
  if (await sampleAvailable()) return createSampleTransport();
  return createServiceTransport(endpoint, apiKey);
}

/**
 * Ask Claude for one plain line of speech.
 *
 * The dating conversations need a scored, structured turn; a passer-by needs a
 * voice and nothing else. This is the light path for those: raw turns in, one
 * string out, and `null` anywhere the page cannot reach a model — which the
 * caller is expected to treat as "use the authored line instead" rather than
 * as an error worth showing anyone.
 */
export async function sampleText(
  turns: readonly { role: 'user' | 'assistant'; content: string }[],
  signal?: AbortSignal,
): Promise<string | null> {
  const claude = runtime();
  if (!claude) return null;

  try {
    const sample = (await claude.use('sample')) as SampleNamespace | null;
    if (!sample) return null;

    // Asked for as JSON rather than prose: the sampler is a JSON API, and a
    // single named field is the smallest shape that keeps it honest.
    const result = await sample.json<{ line?: unknown }>(
      [
        ...turns,
        { role: 'user', content: 'Answer as JSON: {"line": "<the line, plain text>"}' },
      ],
      { modelTier: 'default', cache: false, ...(signal ? { signal } : {}) },
    );
    const line = result?.line;
    return typeof line === 'string' && line.trim() ? line.trim() : null;
  } catch {
    return null;
  }
}
