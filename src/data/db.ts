import Dexie, { type EntityTable } from 'dexie';
import type { Task } from './types';
import { inboxToLater } from './migrations';

export class AppDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;

  constructor() {
    super('home-tasks');
    // Версії схеми бази. Існуючі версії не змінюємо — кожна зміна даних додається новою
    // версією з міграцією в .upgrade(). Наступна (Tracker) — version(3) з таблицями
    // activities і activity_entries.
    this.version(1).stores({
      tasks: 'id, status, updatedAt',
    });
    // v2: Inbox прибрано — його справи переходять у «Пізніше».
    this.version(2)
      .stores({
        tasks: 'id, status, updatedAt',
      })
      .upgrade((tx) => {
        const now = Date.now();
        return tx
          .table('tasks')
          .toCollection()
          .modify((task) => {
            inboxToLater(task, now);
          });
      });
  }
}

export const db = new AppDB();
