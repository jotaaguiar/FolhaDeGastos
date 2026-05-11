import { prisma } from './db.js';

const TTL_MS = 60_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

function cacheGet<T>(userId: string, key: string): T | undefined {
  const entry = cache.get(cacheKey(userId, key));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(userId, key));
    return undefined;
  }
  return entry.data as T;
}

function cacheSet(userId: string, key: string, data: unknown): void {
  cache.set(cacheKey(userId, key), { data, expiresAt: Date.now() + TTL_MS });
}

export async function writeFile<T>(userId: string, key: string, data: T): Promise<void> {
  await prisma.userStore.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
  cacheSet(userId, key, data);
}

export async function readFile<T>(userId: string, key: string, defaultValue: T): Promise<T> {
  const hit = cacheGet<T>(userId, key);
  if (hit !== undefined) return hit;

  const record = await prisma.userStore.findUnique({
    where: { userId_key: { userId, key } },
  });

  if (!record) {
    cacheSet(userId, key, defaultValue);
    return defaultValue;
  }

  let parsed: T;
  try {
    parsed = JSON.parse(record.data) as T;
  } catch {
    parsed = defaultValue;
  }
  cacheSet(userId, key, parsed);
  return parsed;
}

export async function fileExists(userId: string, key: string): Promise<boolean> {
  const hit = cacheGet(userId, key);
  if (hit !== undefined) return true;

  const count = await prisma.userStore.count({
    where: { userId, key },
  });
  return count > 0;
}

// Busca múltiplos arquivos em uma única query ao banco
export async function readFiles<T extends Record<string, unknown>>(
  userId: string,
  defaults: T,
): Promise<T> {
  const keys = Object.keys(defaults) as (keyof T & string)[];

  const result = {} as T;
  const missing: string[] = [];

  for (const key of keys) {
    const hit = cacheGet(userId, key);
    if (hit !== undefined) {
      result[key as keyof T] = hit as T[keyof T];
    } else {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const records = await prisma.userStore.findMany({
      where: { userId, key: { in: missing } },
    });

    const byKey = new Map(records.map(r => [r.key, r.data]));

    for (const key of missing) {
      const raw = byKey.get(key);
      let parsed: unknown;
      if (raw !== undefined) {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = defaults[key as keyof T];
        }
      } else {
        parsed = defaults[key as keyof T];
      }
      cacheSet(userId, key, parsed);
      result[key as keyof T] = parsed as T[keyof T];
    }
  }

  return result;
}
