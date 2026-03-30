import type { LLMProvider, LLMConfig } from '@/types';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMCompleteOptions {
  maxTokens?: number;
  temperature?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o',
  groq: 'llama-3.3-70b-versatile',
};

export class LLMClient {
  private readonly provider: LLMProvider;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODELS[config.provider];
  }

  /**
   * Sends a completion request to the LLM with retry logic.
   * @param messages - Array of message objects with role and content
   * @param options - Optional parameters for maxTokens and temperature
   * @returns Promise resolving to the assistant's response content
   */
  async complete(
    messages: LLMMessage[],
    options?: LLMCompleteOptions
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (this.provider === 'anthropic') {
          return await this.requestAnthropic(messages, options);
        } else if (this.provider === 'openai') {
          return await this.requestOpenAI(messages, options);
        } else {
          return await this.requestGroq(messages, options);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(lastError);
        if (isRetryable && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new Error('Unknown error occurred');
  }

  private isRetryableError(error: Error): boolean {
    const statusMatch = error.message.match(/\b(429|500|502|503|529)\b/);
    return statusMatch !== null;
  }

  private async requestAnthropic(
    messages: LLMMessage[],
    options?: LLMCompleteOptions
  ): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    if (!data.content || data.content.length === 0) {
      throw new Error('Anthropic returned empty response');
    }

    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      throw new Error('Anthropic response has no text content');
    }

    return textContent.text;
  }

  private async requestOpenAI(
    messages: LLMMessage[],
    options?: LLMCompleteOptions
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI returned empty response');
    }

    return data.choices[0].message.content;
  }

  private async requestGroq(
    messages: LLMMessage[],
    options?: LLMCompleteOptions
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Groq returned empty response');
    }

    return data.choices[0].message.content;
  }
}
