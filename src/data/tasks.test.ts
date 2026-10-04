import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  addTask,
  completeTask,
  countByStatus,
  deleteTask,
  moveTask,
  renameTask,
  restoreTask,
  tasksInList,
  undeleteTask,
} from './tasks';
import type { TaskStatus } from './types';

const titles = async (status: TaskStatus) => tasksInList(await db.tasks.toArray(), status).map((t) => t.title);

beforeEach(async () => {
  await db.tasks.clear();
});

describe('tasks', () => {
  it('нова справа йде в Inbox, назва обрізається, порожня ігнорується', async () => {
    expect(await addTask('   ')).toBeNull();
    const id = await addTask('  Купити хліб  ');
    const task = await db.tasks.get(id!);
    expect(task).toMatchObject({ title: 'Купити хліб', status: 'inbox', deletedAt: null });
  });

  it('Inbox: нові зверху; Сьогодні: у порядку перенесення', async () => {
    const a = (await addTask('A'))!;
    const b = (await addTask('B'))!;
    const c = (await addTask('C'))!;
    expect(await titles('inbox')).toEqual(['C', 'B', 'A']);

    await moveTask(b, 'today');
    await moveTask(a, 'today');
    await moveTask(c, 'today');
    expect(await titles('today')).toEqual(['B', 'A', 'C']);
  });

  it('виконання і повернення: справа стає на попереднє місце у своєму списку', async () => {
    const a = (await addTask('A'))!;
    const b = (await addTask('B'))!;
    const c = (await addTask('C'))!;
    for (const id of [a, b, c]) await moveTask(id, 'later');

    await completeTask(b);
    expect(await titles('later')).toEqual(['A', 'C']);
    expect(await titles('done')).toEqual(['B']);

    await restoreTask(b);
    expect(await titles('later')).toEqual(['A', 'B', 'C']);
    expect(await titles('done')).toEqual([]);
  });

  it('Готово: останні виконані зверху', async () => {
    const a = (await addTask('A'))!;
    const b = (await addTask('B'))!;
    await completeTask(a);
    await completeTask(b);
    expect(await titles('done')).toEqual(['B', 'A']);
  });

  it('видалення м\'яке і скасовується', async () => {
    const a = (await addTask('A'))!;
    await deleteTask(a);
    expect(await titles('inbox')).toEqual([]);
    expect((await db.tasks.get(a))!.deletedAt).not.toBeNull();
    await undeleteTask(a);
    expect(await titles('inbox')).toEqual(['A']);
  });

  it('перейменування: порожня назва залишає попередню', async () => {
    const a = (await addTask('A'))!;
    await renameTask(a, '  ');
    expect((await db.tasks.get(a))!.title).toBe('A');
    await renameTask(a, ' Б ');
    expect((await db.tasks.get(a))!.title).toBe('Б');
  });

  it('лічильники не враховують видалені', async () => {
    const a = (await addTask('A'))!;
    await addTask('B');
    await deleteTask(a);
    expect(countByStatus(await db.tasks.toArray())).toEqual({ today: 0, inbox: 1, later: 0, done: 0 });
  });
});
