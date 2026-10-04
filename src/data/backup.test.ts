import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { addTask, deleteTask, renameTask } from './tasks';
import {
  BACKUP_VERSION,
  BackupError,
  createBackup,
  describeBackup,
  mergeBackup,
  parseBackup,
  restoreBackup,
} from './backup';

beforeEach(async () => {
  await db.tasks.clear();
});

describe('backup', () => {
  it('копія містить формат, версію і дату; опис рахує тільки невидалені справи', async () => {
    await addTask('A', 'inbox');
    const b = (await addTask('B', 'inbox'))!;
    await deleteTask(b);

    const backup = parseBackup(JSON.stringify(await createBackup()));
    expect(backup.format).toBe('home-tasks-backup');
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(describeBackup(backup).taskCount).toBe(1);
  });

  it('відновлення повністю замінює поточні дані станом із копії', async () => {
    const a = (await addTask('Старе', 'inbox'))!;
    const text = JSON.stringify(await createBackup());

    // Після копії: змінена назва і нова справа — обидві зміни мають зникнути.
    await renameTask(a, 'Нове');
    const later = (await addTask('Додано після копії', 'inbox'))!;

    await restoreBackup(parseBackup(text));
    expect(await db.tasks.count()).toBe(1);
    expect((await db.tasks.get(a))!.title).toBe('Старе');
    expect(await db.tasks.get(later)).toBeUndefined();
  });

  it('внутрішнє об\'єднання (для майбутньої синхронізації) лишає новішу версію', async () => {
    const a = (await addTask('Старе', 'inbox'))!;
    const text = JSON.stringify(await createBackup());
    await renameTask(a, 'Нове');

    expect(await mergeBackup(parseBackup(text))).toBe(0);
    expect((await db.tasks.get(a))!.title).toBe('Нове');
  });

  it('відхиляє не-JSON, чужий формат, новішу версію і пошкоджені дані', () => {
    const valid = { format: 'home-tasks-backup', version: BACKUP_VERSION, exportedAt: new Date().toISOString() };
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ hello: 1 }))).toThrow('Це не файл копії');
    expect(() =>
      parseBackup(JSON.stringify({ ...valid, version: BACKUP_VERSION + 1, data: { tasks: [] } })),
    ).toThrow('новішою версією');
    expect(() => parseBackup(JSON.stringify({ ...valid, data: { tasks: [{ id: 1 }] } }))).toThrow('пошкоджено');
    expect(() => parseBackup(JSON.stringify({ ...valid, exportedAt: 'вчора', data: { tasks: [] } }))).toThrow(
      'пошкоджено',
    );
  });
});
