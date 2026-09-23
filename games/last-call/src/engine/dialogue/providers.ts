import type { GameState } from '@/types/game';
import type { DialogueProvider } from '@/types/dialogue';
import type { AiModel, FreeTextProvider } from '@/engine/dialogue/llmProvider';
import { createScriptedDialogueProvider } from '@/engine/dialogue/scriptedProvider';
import { createLlmDialogueProvider } from '@/engine/dialogue/llmProvider';
import { sampleAvailable } from '@/engine/dialogue/transports';

/**
 * Which voice is answering.
 *
 * Scripted is the default and always works offline. AI mode needs the dialogue
 * service (`npm run dev` with ANTHROPIC_API_KEY set, or `npm run serve:ai`), or
 * a key the player has pasted in themselves.
 */
export const KEY_STORAGE = 'last-call:ai-key';

export const scriptedProvider: DialogueProvider = createScriptedDialogueProvider();

export function readStoredKey(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function storeKey(key: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Storage disabled: AI mode falls back to the server key for this session.
  }
}

export function createAiProvider(model: AiModel): FreeTextProvider {
  const apiKey = readStoredKey();
  return createLlmDialogueProvider(apiKey ? { model, apiKey } : { model });
}

/**
 * The provider for this game's current settings.
 *
 * `pageCanSample` answers the only question 'auto' depends on: can this page
 * reach Claude by itself? It is passed in rather than probed here because the
 * probe is asynchronous and the caller already has to await it — deciding at
 * game-creation time is what let a slow runtime strand a new game in scripted
 * mode with no way back.
 */
export function providerFor(state: GameState, pageCanSample = false): DialogueProvider {
  const mode = state.settings.dialogueMode;
  if (mode === 'scripted') return scriptedProvider;
  if (mode === 'ai') return createAiProvider(state.settings.aiModel);
  return pageCanSample ? createAiProvider(state.settings.aiModel) : scriptedProvider;
}

export function supportsFreeText(provider: DialogueProvider): provider is FreeTextProvider {
  return typeof provider.say === 'function';
}

export interface ServiceStatus {
  ok: boolean;
  hasKey: boolean;
  /** True when the page can ask Claude directly — a published artifact. */
  inPage: boolean;
  model?: string;
  reason?: string;
}

/**
 * Can this page talk to Claude, and how? Either the page has its own runtime
 * (published artifact: no key needed, billed to whoever is playing) or there is
 * a local dialogue service holding a key.
 */
export async function checkService(endpoint = '/api/dialogue'): Promise<ServiceStatus> {
  if (await sampleAvailable()) {
    return { ok: true, hasKey: true, inPage: true };
  }
  // Opened straight from disk there is no origin to fetch from, and trying
  // logs a CORS failure for a service that cannot exist there.
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    return { ok: false, hasKey: false, inPage: false, reason: 'Opened from a file — no dialogue service.' };
  }
  try {
    const response = await fetch(endpoint, { method: 'GET' });
    if (!response.ok) {
      return { ok: false, hasKey: false, inPage: false, reason: `Service returned ${response.status}` };
    }
    const body = (await response.json()) as { hasKey?: boolean; model?: string };
    return {
      ok: true,
      hasKey: Boolean(body.hasKey),
      inPage: false,
      ...(body.model ? { model: body.model } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      hasKey: false,
      inPage: false,
      reason: error instanceof Error ? error.message : 'Service unreachable',
    };
  }
}
