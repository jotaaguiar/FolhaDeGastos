import { prisma } from './db.js';

export async function writeFile<T>(userId: string, key: string, data: T): Promise<void> {
  await prisma.userStore.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
}

export async function readFile<T>(userId: string, key: string, defaultValue: T): Promise<T> {
  const record = await prisma.userStore.findUnique({
    where: { userId_key: { userId, key } },
  });
  if (!record) return defaultValue;
  try { return JSON.parse(record.data) as T; } catch { return defaultValue; }
}

export async function fileExists(userId: string, key: string): Promise<boolean> {
  const count = await prisma.userStore.count({
    where: { userId_key: { userId, key } },
  });
  return count > 0;
}
