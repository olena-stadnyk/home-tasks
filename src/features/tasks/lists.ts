import type { TaskStatus } from '../../data/types';

export const TAB_ORDER: readonly TaskStatus[] = ['today', 'inbox', 'later', 'done'];

export const LIST_LABELS: Record<TaskStatus, string> = {
  today: 'Сьогодні',
  inbox: 'Inbox',
  later: 'Пізніше',
  done: 'Готово',
};

export const EMPTY_TEXT: Record<TaskStatus, string> = {
  today: 'На сьогодні нічого немає',
  inbox: 'Усе розібрано',
  later: 'Тут поки порожньо',
  done: 'Ще нічого не виконано',
};
