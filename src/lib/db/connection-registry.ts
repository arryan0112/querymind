import type pg from 'pg';
import type { SchemaAnalysis } from '@/types';

interface RegistryEntry {
  pool: pg.Pool;
  schemaAnalysis: SchemaAnalysis;
  expiresAt: number;
}

/**
 * In-memory connection registry.
 * NOTE: In production, this should be replaced with Redis for persistence and cross-instance sharing.
 */
const registry = new Map<string, RegistryEntry>();

function makeKey(userId: string, connectionId: string): string {
  return `${userId}:${connectionId}`;
}

export function registrySet(
  userId: string,
  connectionId: string,
  entry: RegistryEntry
): void {
  registry.set(makeKey(userId, connectionId), entry);
}

export function registryGet(
  userId: string,
  connectionId: string
): { pool: pg.Pool; schemaAnalysis: SchemaAnalysis } | null {
  const entry = registry.get(makeKey(userId, connectionId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    registry.delete(makeKey(userId, connectionId));
    return null;
  }
  return { pool: entry.pool, schemaAnalysis: entry.schemaAnalysis };
}

export function registryClear(userId: string, connectionId: string): void {
  registry.delete(makeKey(userId, connectionId));
}
