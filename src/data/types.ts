export type ActiveStatus = 'today' | 'later';
export type TaskStatus = ActiveStatus | 'done';

export const ACTIVE_STATUSES: readonly ActiveStatus[] = ['today', 'later'];

/**
 * Службові поля, однакові для всіх таблиць (зараз tasks, пізніше activities і activity_entries).
 * Потрібні для майбутньої синхронізації: випадковий id не конфліктує між пристроями,
 * updatedAt показує новішу версію, deletedAt — м'яке видалення замість стирання.
 */
export interface SyncFields {
  id: string;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Task extends SyncFields {
  title: string;
  status: TaskStatus;
  createdAt: number;
  /** Коли справа потрапила в поточний активний список — визначає порядок у ньому. */
  movedAt: number;
  completedAt: number | null;
  /** Список, з якого справу виконали, щоб повернути її туди ж. */
  prevStatus: ActiveStatus | null;
}
