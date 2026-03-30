export const MAX_QUERY_ROWS = 500;
export const QUERY_TIMEOUT_MS = 10000;
export const SCHEMA_CACHE_TTL_MS = 600000;
export const CONNECTION_REGISTRY_TTL_MS = 1800000;
export const MAX_CONVERSATION_HISTORY = 10;

export const RATE_LIMIT_QUERIES = 20;
export const RATE_LIMIT_CONNECT = 5;
export const RATE_LIMIT_WINDOW_MS = 60000;

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B · recommended' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B · fastest' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B · long context' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
] as const;

export const OPENAI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o · recommended' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini · faster' },
] as const;

export const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 · recommended' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 · fastest' },
] as const;

export const PROVIDER_INFO = {
  anthropic: {
    name: 'Anthropic',
    tagline: 'Best SQL accuracy',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    color: '#8b5cf6',
  },
  openai: {
    name: 'OpenAI',
    tagline: 'Most reliable',
    keyUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    color: '#22c55e',
  },
  groq: {
    name: 'Groq',
    tagline: 'Free tier · fastest inference',
    keyUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    color: '#f97316',
  },
} as const;

export type ProviderId = keyof typeof PROVIDER_INFO;
