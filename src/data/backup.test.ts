import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { addTask, deleteTask, renameTask, restoreTask, tasksInList } from './tasks';
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
    await addTask('A', 'today');
    const b = (await addTask('B', 'today'))!;
    await deleteTask(b);

    const backup = parseBackup(JSON.stringify(await createBackup()));
    expect(backup.format).toBe('home-tasks-backup');
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(describeBackup(backup).taskCount).toBe(1);
  });

  it('відновлення повністю замінює поточні дані станом із копії', async () => {
    const a = (await addTask('Старе', 'today'))!;
    const text = JSON.stringify(await createBackup());

    // Після копії: змінена назва і нова справа — обидві зміни мають зникнути.
    await renameTask(a, 'Нове');
    const later = (await addTask('Додано після копії', 'today'))!;

    await restoreBackup(parseBackup(text));
    expect(await db.tasks.count()).toBe(1);
    expect((await db.tasks.get(a))!.title).toBe('Старе');
    expect(await db.tasks.get(later)).toBeUndefined();
  });

  it('внутрішнє об\'єднання (для майбутньої синхронізації) лишає новішу версію', async () => {
    const a = (await addTask('Старе', 'today'))!;
    const text = JSON.stringify(await createBackup());
    await renameTask(a, 'Нове');

    expect(await mergeBackup(parseBackup(text))).toBe(0);
    expect((await db.tasks.get(a))!.title).toBe('Нове');
  });

  it('стара копія v1 з Inbox відновлюється: Inbox → «Пізніше», нічого не губиться', async () => {
    const t = Date.parse('2026-10-01T10:00:00Z');
    const base = { createdAt: t, movedAt: t, updatedAt: t, completedAt: null, prevStatus: null, deletedAt: null };
    const v1 = {
      format: 'home-tasks-backup',
      version: 1,
      exportedAt: '2026-10-02T10:00:00.000Z',
      data: {
        tasks: [
          { ...base, id: 'i1', title: 'З Inbox', status: 'inbox' },
          { ...base, id: 't1', title: 'Сьогоднішня', status: 'today' },
          { ...base, id: 'l1', title: 'Пізніша', status: 'later', movedAt: t + 1 },
          { ...base, id: 'd1', title: 'Виконана з Inbox', status: 'done', completedAt: t, prevStatus: 'inbox' },
          { ...base, id: 'x1', title: 'Видалена в Inbox', status: 'inbox', deletedAt: t },
        ],
      },
    };

    const backup = parseBackup(JSON.stringify(v1));
    expect(backup.version).toBe(BACKUP_VERSION);
    await restoreBackup(backup);

    expect(await db.tasks.count()).toBe(5);
    expect((await db.tasks.get('i1'))!.status).toBe('later');
    expect((await db.tasks.get('t1'))!.status).toBe('today');
    expect((await db.tasks.get('d1'))!).toMatchObject({ status: 'done', prevStatus: 'later' });
    expect((await db.tasks.get('x1'))!).toMatchObject({ status: 'later', deletedAt: t });
    // Колишня справа Inbox стає в «Пізніше» за своїм часом, перед новішою.
    expect(tasksInList(await db.tasks.toArray(), 'later').map((x) => x.id)).toEqual(['i1', 'l1']);
    // Повернення виконаної колишньої справи Inbox — у «Пізніше».
    await restoreTask('d1');
    expect((await db.tasks.get('d1'))!.status).toBe('later');
  });

  it('копія v2 не приймає статус inbox', () => {
    const t = Date.now();
    const bad = {
      format: 'home-tasks-backup',
      version: 2,
      exportedAt: new Date(t).toISOString(),
      data: {
        tasks: [
          { id: 'a', title: 'A', status: 'inbox', createdAt: t, movedAt: t, updatedAt: t, completedAt: null, prevStatus: null, deletedAt: null },
        ],
      },
    };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('пошкоджено');
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
