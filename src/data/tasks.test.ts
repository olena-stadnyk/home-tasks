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
    const id = await addTask('  Купити хліб  ', 'inbox');
    const task = await db.tasks.get(id!);
    expect(task).toMatchObject({ title: 'Купити хліб', status: 'inbox', deletedAt: null });
  });

  it('нова справа потрапляє саме в той список, у який її додали', async () => {
    await addTask('У сьогодні', 'today');
    await addTask('В Inbox', 'inbox');
    await addTask('На пізніше', 'later');
    expect(await titles('today')).toEqual(['У сьогодні']);
    expect(await titles('inbox')).toEqual(['В Inbox']);
    expect(await titles('later')).toEqual(['На пізніше']);
    expect(await titles('done')).toEqual([]);
  });

  it('додана в «Сьогодні» чи «Пізніше» стає в кінець списку, в Inbox — нагору', async () => {
    const a = (await addTask('A', 'inbox'))!;
    await moveTask(a, 'today');
    await addTask('Нова сьогодні', 'today');
    expect(await titles('today')).toEqual(['A', 'Нова сьогодні']);

    await addTask('L1', 'later');
    await addTask('L2', 'later');
    expect(await titles('later')).toEqual(['L1', 'L2']);

    await addTask('I1', 'inbox');
    await addTask('I2', 'inbox');
    expect(await titles('inbox')).toEqual(['I2', 'I1']);
  });

  it('справу, додану в «Сьогодні», після виконання і повернення видно знову в «Сьогодні»', async () => {
    const id = (await addTask('A', 'today'))!;
    await completeTask(id);
    await restoreTask(id);
    expect(await titles('today')).toEqual(['A']);
  });

  it('Inbox: нові зверху; Сьогодні: у порядку перенесення', async () => {
    const a = (await addTask('A', 'inbox'))!;
    const b = (await addTask('B', 'inbox'))!;
    const c = (await addTask('C', 'inbox'))!;
    expect(await titles('inbox')).toEqual(['C', 'B', 'A']);

    await moveTask(b, 'today');
    await moveTask(a, 'today');
    await moveTask(c, 'today');
    expect(await titles('today')).toEqual(['B', 'A', 'C']);
  });

  it('виконання і повернення: справа стає на попереднє місце у своєму списку', async () => {
    const a = (await addTask('A', 'inbox'))!;
    const b = (await addTask('B', 'inbox'))!;
    const c = (await addTask('C', 'inbox'))!;
    for (const id of [a, b, c]) await moveTask(id, 'later');

    await completeTask(b);
    expect(await titles('later')).toEqual(['A', 'C']);
    expect(await titles('done')).toEqual(['B']);

    await restoreTask(b);
    expect(await titles('later')).toEqual(['A', 'B', 'C']);
    expect(await titles('done')).toEqual([]);
  });

  it('Готово: останні виконані зверху', async () => {
    const a = (await addTask('A', 'inbox'))!;
    const b = (await addTask('B', 'inbox'))!;
    await completeTask(a);
    await completeTask(b);
    expect(await titles('done')).toEqual(['B', 'A']);
  });

  it('видалення м\'яке і скасовується', async () => {
    const a = (await addTask('A', 'inbox'))!;
    await deleteTask(a);
    expect(await titles('inbox')).toEqual([]);
    expect((await db.tasks.get(a))!.deletedAt).not.toBeNull();
    await undeleteTask(a);
    expect(await titles('inbox')).toEqual(['A']);
  });

  it('перейменування: порожня назва залишає попередню', async () => {
    const a = (await addTask('A', 'inbox'))!;
    await renameTask(a, '  ');
    expect((await db.tasks.get(a))!.title).toBe('A');
    await renameTask(a, ' Б ');
    expect((await db.tasks.get(a))!.title).toBe('Б');
  });

  it('лічильники не враховують видалені', async () => {
    const a = (await addTask('A', 'inbox'))!;
    await addTask('B', 'inbox');
    await deleteTask(a);
    expect(countByStatus(await db.tasks.toArray())).toEqual({ today: 0, inbox: 1, later: 0, done: 0 });
  });
});
