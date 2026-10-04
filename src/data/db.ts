import Dexie, { type EntityTable } from 'dexie';
import type { Task } from './types';

export class AppDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;

  constructor() {
    super('home-tasks');
    // Версії схеми бази. Існуючі версії не змінюємо — для нових таблиць
    // (наприклад, activities і activity_entries для Tracker) додається
    // this.version(2).stores({...}) з потрібною міграцією через .upgrade().
    this.version(1).stores({
      tasks: 'id, status, updatedAt',
    });
  }
}

export const db = new AppDB();
