import { db } from './db';
import type { ActiveStatus, Task, TaskStatus } from './types';
import { newId } from '../shared/utils/id';

// Строго зростаючий час: дві дії в одну мілісекунду все одно мають чіткий порядок.
let lastTime = 0;
function now(): number {
  lastTime = Math.max(Date.now(), lastTime + 1);
  return lastTime;
}

async function patch(id: string, changes: Partial<Task>): Promise<void> {
  await db.tasks.update(id, { ...changes, updatedAt: now() });
}

/** Додає справу в указаний список. Повертає id або null для порожньої назви. */
export async function addTask(title: string, status: ActiveStatus): Promise<string | null> {
  const clean = title.trim();
  if (!clean) return null;
  const t = now();
  const task: Task = {
    id: newId(),
    title: clean,
    status,
    createdAt: t,
    movedAt: t,
    completedAt: null,
    prevStatus: null,
    updatedAt: t,
    deletedAt: null,
  };
  await db.tasks.add(task);
  return task.id;
}

export async function moveTask(id: string, status: ActiveStatus): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task || task.status === status) return;
  await patch(id, { status, movedAt: now(), completedAt: null, prevStatus: null });
}

export async function completeTask(id: string): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task || task.status === 'done') return;
  await patch(id, { status: 'done', completedAt: now(), prevStatus: task.status });
}

/** Повертає виконану справу в попередній список. movedAt не змінюється — справа стає на своє місце. */
export async function restoreTask(id: string): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task || task.status !== 'done') return;
  await patch(id, { status: task.prevStatus ?? 'inbox', completedAt: null, prevStatus: null });
}

/** Порожня назва ігнорується — залишається попередня. */
export async function renameTask(id: string, title: string): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  const task = await db.tasks.get(id);
  if (!task || task.title === clean) return;
  await patch(id, { title: clean });
}

export async function deleteTask(id: string): Promise<void> {
  await patch(id, { deletedAt: now() });
}

export async function undeleteTask(id: string): Promise<void> {
  await patch(id, { deletedAt: null });
}

/** Справи одного списку в порядку показу. */
export function tasksInList(all: Task[], status: TaskStatus): Task[] {
  const list = all.filter((t) => t.deletedAt === null && t.status === status);
  switch (status) {
    case 'inbox':
      return list.sort((a, b) => b.movedAt - a.movedAt);
    case 'today':
    case 'later':
      return list.sort((a, b) => a.movedAt - b.movedAt);
    case 'done':
      return list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  }
}

export function countByStatus(all: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { today: 0, inbox: 0, later: 0, done: 0 };
  for (const t of all) if (t.deletedAt === null) counts[t.status]++;
  return counts;
}
