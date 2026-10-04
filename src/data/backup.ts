import { db } from './db';
import type { Task } from './types';
import { inboxToLater } from './migrations';
import { toLocalDateKey } from '../shared/utils/date';

export const BACKUP_FORMAT = 'home-tasks-backup';

/**
 * Версія формату файлу копії (незалежна від версії схеми бази).
 * Коли структура даних змінюється: збільшити BACKUP_VERSION і додати крок в `upgrades`,
 * щоб старі копії й далі відновлювались.
 */
export const BACKUP_VERSION = 2;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: { tasks: Task[] };
}

/**
 * Перетворення копії версії N у версію N + 1. Приклад на майбутнє (Tracker):
 *   2: (b) => ({ ...b, version: 3, data: { ...b.data, activities: [], activity_entries: [] } }),
 */
type RawBackup = { version: number; [key: string]: unknown };
const upgrades: Record<number, (backup: RawBackup) => RawBackup> = {
  // v1 → v2: Inbox прибрано, його справи переходять у «Пізніше» (так само, як при міграції бази).
  1: (b) => {
    const data = isObject(b.data) ? b.data : {};
    const now = Date.now();
    const tasks = Array.isArray(data.tasks)
      ? data.tasks.map((t) => {
          if (!isObject(t)) return t;
          const copy = { ...t };
          inboxToLater(copy, now);
          return copy;
        })
      : data.tasks;
    return { ...b, version: 2, data: { ...data, tasks } };
  },
};

export class BackupError extends Error {}

export async function createBackup(): Promise<Backup> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // Включно з видаленими (deletedAt), щоб відновлення не повертало видалене.
    data: { tasks: await db.tasks.toArray() },
  };
}

export function backupFileName(date = new Date()): string {
  return `home-tasks-${toLocalDateKey(date)}.json`;
}

export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('Це не файл копії');
  }
  if (!isObject(raw) || raw.format !== BACKUP_FORMAT || typeof raw.version !== 'number') {
    throw new BackupError('Це не файл копії');
  }
  if (raw.version > BACKUP_VERSION) {
    throw new BackupError('Копію створено новішою версією застосунку');
  }
  let backup = raw as RawBackup;
  while (backup.version < BACKUP_VERSION) {
    const upgrade = upgrades[backup.version];
    if (!upgrade) throw new BackupError('Ця версія копії не підтримується');
    backup = upgrade(backup);
  }
  const data = backup.data;
  if (
    typeof backup.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(backup.exportedAt)) ||
    !isObject(data) ||
    !Array.isArray(data.tasks) ||
    !data.tasks.every(isTask)
  ) {
    throw new BackupError('Файл копії пошкоджено');
  }
  return backup as unknown as Backup;
}

/** Короткий опис копії для підтвердження перед відновленням (видалені справи не рахуються). */
export function describeBackup(backup: Backup): { exportedAt: Date; taskCount: number } {
  return {
    exportedAt: new Date(backup.exportedAt),
    taskCount: backup.data.tasks.filter((t) => t.deletedAt === null).length,
  };
}

/** «Відновити з копії»: повністю замінює поточні дані даними з копії. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.clear();
    await db.tasks.bulkPut(backup.data.tasks);
  });
}

/**
 * Внутрішня функція для майбутньої синхронізації (у v1 з інтерфейсу не викликається):
 * об'єднує дані, для кожного запису лишається новіша версія за updatedAt.
 * Повертає кількість записів, які змінилися.
 */
export async function mergeBackup(backup: Backup): Promise<number> {
  let changed = 0;
  await db.transaction('rw', db.tasks, async () => {
    for (const task of backup.data.tasks) {
      const existing = await db.tasks.get(task.id);
      if (!existing || task.updatedAt > existing.updatedAt) {
        await db.tasks.put(task);
        changed++;
      }
    }
  });
  return changed;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const STATUSES = ['today', 'later', 'done'];
const ACTIVE = ['today', 'later'];
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const isNumOrNull = (v: unknown) => v === null || isNum(v);

function isTask(v: unknown): v is Task {
  return (
    isObject(v) &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    STATUSES.includes(v.status as string) &&
    isNum(v.createdAt) &&
    isNum(v.movedAt) &&
    isNum(v.updatedAt) &&
    isNumOrNull(v.completedAt) &&
    isNumOrNull(v.deletedAt) &&
    (v.prevStatus === null || ACTIVE.includes(v.prevStatus as string))
  );
}
