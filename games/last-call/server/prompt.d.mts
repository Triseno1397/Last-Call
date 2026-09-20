/** Types for the server-side prompt builder, so the game's tests can use it. */
import type { ContentRating } from '../src/types/core';

export interface PromptCharacter {
  name: string;
  age: number;
  archetype: string;
  tagline: string;
  bio: string;
  personality: readonly string[];
  voiceRules?: readonly string[];
  sampleLines?: readonly string[];
  likes: readonly string[];
  dislikes: readonly string[];
  dealbreaker: { tag: string; line: string };
  interests: readonly string[];
}

export interface PromptSituation {
  venue: { name: string; tagline: string; atmosphere?: string };
  mood: string;
  mode: 'encounter' | 'date';
  meters: { interest: number; comfort: number };
  memory: {
    stage: string;
    encounters: number;
    knownFacts?: readonly string[];
    toldFacts?: readonly string[];
    discussedTopics?: readonly string[];
    outcomes?: readonly string[];
  };
  turn: number;
  patience: number;
  openingNotes?: readonly string[];
}

export interface PromptBeat {
  speaker: 'her' | 'you';
  text: string;
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const EXPRESSIONS: readonly string[];
export const RESPONSE_TYPES: readonly string[];
export const TOPIC_TAGS: readonly string[];

export function buildSystemPrompt(character: PromptCharacter, rating?: ContentRating): string;
export function buildSituation(situation: PromptSituation): string;
export function buildMessages(
  situation: PromptSituation,
  beats: readonly PromptBeat[],
  playerSaid: string | null,
): PromptMessage[];
