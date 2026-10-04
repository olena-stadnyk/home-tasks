import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { db } from './db';
import { tasksInList } from './tasks';

describe('міграція бази v1 → v2', () => {
  it('справи з Inbox безпечно переходять у «Пізніше», решта даних без змін', async () => {
    // Стан, який був у застосунку до прибирання Inbox.
    db.close();
    await Dexie.delete('home-tasks');
    const old = new Dexie('home-tasks');
    old.version(1).stores({ tasks: 'id, status, updatedAt' });
    const t = Date.parse('2026-10-01T10:00:00Z');
    const base = { createdAt: t, movedAt: t, updatedAt: t, completedAt: null, prevStatus: null, deletedAt: null };
    await old.table('tasks').bulkAdd([
      { ...base, id: 'i1', title: 'Inbox 1', status: 'inbox', movedAt: t + 5 },
      { ...base, id: 'i2', title: 'Inbox 2', status: 'inbox', movedAt: t + 1 },
      { ...base, id: 't1', title: 'Сьогодні', status: 'today' },
      { ...base, id: 'l1', title: 'Пізніше', status: 'later', movedAt: t + 3 },
      { ...base, id: 'd1', title: 'Виконана з Inbox', status: 'done', completedAt: t, prevStatus: 'inbox' },
      { ...base, id: 'd2', title: 'Виконана з Сьогодні', status: 'done', completedAt: t, prevStatus: 'today' },
    ]);
    old.close();

    await db.open();
    expect(db.verno).toBe(2);
    const all = await db.tasks.toArray();
    expect(all).toHaveLength(6);
    expect(all.some((x) => (x.status as string) === 'inbox' || (x.prevStatus as string) === 'inbox')).toBe(false);

    // Колишні справи Inbox — у «Пізніше» за часом потрапляння в Inbox.
    expect(tasksInList(all, 'later').map((x) => x.id)).toEqual(['i2', 'l1', 'i1']);
    expect(tasksInList(all, 'today').map((x) => x.id)).toEqual(['t1']);

    const byId = Object.fromEntries(all.map((x) => [x.id, x]));
    expect(byId.d1).toMatchObject({ status: 'done', prevStatus: 'later' });
    expect(byId.d2).toMatchObject({ status: 'done', prevStatus: 'today' });
    // Змінені записи позначені як оновлені (для майбутньої синхронізації), незмінені — ні.
    expect(byId.i1.updatedAt).toBeGreaterThan(t);
    expect(byId.t1.updatedAt).toBe(t);
    expect(byId.i1.title).toBe('Inbox 1');
  });
});
