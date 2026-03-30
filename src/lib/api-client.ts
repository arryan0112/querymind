import type { LLMConfig } from '@/types';

/**
 * Returns headers required for API routes that need LLM access.
 */
export function getLLMHeaders(llmConfig: LLMConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-llm-config': JSON.stringify(llmConfig),
  };
}
