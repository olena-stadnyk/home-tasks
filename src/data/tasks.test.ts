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
  it('назва обрізається, порожня ігнорується', async () => {
    expect(await addTask('   ', 'today')).toBeNull();
    expect(await db.tasks.count()).toBe(0);
    const id = await addTask('  Купити хліб  ', 'later');
    const task = await db.tasks.get(id!);
    expect(task).toMatchObject({ title: 'Купити хліб', status: 'later', deletedAt: null });
  });

  it('нова справа потрапляє саме в той список, у який її додали', async () => {
    await addTask('У сьогодні', 'today');
    await addTask('На пізніше', 'later');
    expect(await titles('today')).toEqual(['У сьогодні']);
    expect(await titles('later')).toEqual(['На пізніше']);
    expect(await titles('done')).toEqual([]);
  });

  it('Сьогодні і Пізніше: нові та перенесені справи стають у кінець списку', async () => {
    await addTask('T1', 'today');
    await addTask('T2', 'today');
    const l = (await addTask('L1', 'later'))!;
    await addTask('L2', 'later');
    expect(await titles('today')).toEqual(['T1', 'T2']);
    expect(await titles('later')).toEqual(['L1', 'L2']);

    await moveTask(l, 'today');
    expect(await titles('today')).toEqual(['T1', 'T2', 'L1']);
    expect(await titles('later')).toEqual(['L2']);
  });

  it('перенесення today ↔ later в обидва боки', async () => {
    const id = (await addTask('A', 'today'))!;
    await moveTask(id, 'later');
    expect((await db.tasks.get(id))!.status).toBe('later');
    await moveTask(id, 'today');
    expect((await db.tasks.get(id))!.status).toBe('today');
  });

  it('справу з «Пізніше» можна виконати напряму і вона повертається в «Пізніше»', async () => {
    await addTask('A', 'later');
    const b = (await addTask('B', 'later'))!;
    await addTask('C', 'later');

    await completeTask(b);
    expect(await titles('later')).toEqual(['A', 'C']);
    expect(await titles('today')).toEqual([]);
    expect(await titles('done')).toEqual(['B']);
    expect((await db.tasks.get(b))!.prevStatus).toBe('later');

    await restoreTask(b);
    expect(await titles('later')).toEqual(['A', 'B', 'C']);
    expect(await titles('done')).toEqual([]);
  });

  it('справа з «Сьогодні» після виконання і повернення знову в «Сьогодні» на своєму місці', async () => {
    await addTask('A', 'today');
    const b = (await addTask('B', 'today'))!;
    await addTask('C', 'today');
    await completeTask(b);
    await restoreTask(b);
    expect(await titles('today')).toEqual(['A', 'B', 'C']);
  });

  it('Готово: останні виконані зверху', async () => {
    const a = (await addTask('A', 'today'))!;
    const b = (await addTask('B', 'later'))!;
    await completeTask(a);
    await completeTask(b);
    expect(await titles('done')).toEqual(['B', 'A']);
  });

  it('видалення м\'яке і скасовується', async () => {
    const a = (await addTask('A', 'today'))!;
    await deleteTask(a);
    expect(await titles('today')).toEqual([]);
    expect((await db.tasks.get(a))!.deletedAt).not.toBeNull();
    await undeleteTask(a);
    expect(await titles('today')).toEqual(['A']);
  });

  it('перейменування: порожня назва залишає попередню', async () => {
    const a = (await addTask('A', 'today'))!;
    await renameTask(a, '  ');
    expect((await db.tasks.get(a))!.title).toBe('A');
    await renameTask(a, ' Б ');
    expect((await db.tasks.get(a))!.title).toBe('Б');
  });

  it('лічильники: три списки, видалені не враховуються', async () => {
    const a = (await addTask('A', 'today'))!;
    await addTask('B', 'today');
    await addTask('C', 'later');
    await deleteTask(a);
    expect(countByStatus(await db.tasks.toArray())).toEqual({ today: 1, later: 1, done: 0 });
  });
});
