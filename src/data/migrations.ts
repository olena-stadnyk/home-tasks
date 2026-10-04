/**
 * Перетворення даних між версіями. Спільні для міграції бази (db.ts) і старих резервних копій (backup.ts),
 * щоб обидва шляхи давали однаковий результат.
 */

/**
 * v1 → v2: список Inbox прибрано. Справи з Inbox переходять у «Пізніше»; виконані справи,
 * які повернулися б в Inbox, тепер повертаються в «Пізніше». movedAt не змінюється —
 * колишні справи Inbox стають у «Пізніше» за часом, коли потрапили в Inbox.
 * Повертає true, якщо запис змінено.
 */
export function inboxToLater(task: Record<string, unknown>, now: number): boolean {
  let changed = false;
  if (task.status === 'inbox') {
    task.status = 'later';
    changed = true;
  }
  if (task.prevStatus === 'inbox') {
    task.prevStatus = 'later';
    changed = true;
  }
  if (changed) task.updatedAt = Math.max(now, typeof task.updatedAt === 'number' ? task.updatedAt + 1 : 0);
  return changed;
}
