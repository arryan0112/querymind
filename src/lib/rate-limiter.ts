import { RATE_LIMIT_QUERIES, RATE_LIMIT_CONNECT, RATE_LIMIT_WINDOW_MS } from './constants';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

export function checkRateLimit(
  userId: string,
  endpoint: 'query' | 'connect'
): { allowed: boolean; retryAfterMs?: number } {
  const limit = endpoint === 'query' ? RATE_LIMIT_QUERIES : RATE_LIMIT_CONNECT;
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfterMs = entry.windowStart + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}
