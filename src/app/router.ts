import { useEffect, useState } from 'react';
import type { TaskStatus } from '../data/types';

/**
 * Адреси розділів: #/tasks/today, #/tasks/inbox, …
 * Tracker пізніше додається як ще один варіант Route (наприклад, { section: 'tracker' }).
 */
export type Route = { section: 'tasks'; list: TaskStatus };

const DEFAULT_ROUTE: Route = { section: 'tasks', list: 'today' };

export function parseHash(hash: string): Route | null {
  const m = /^#\/tasks\/(today|inbox|later|done)$/.exec(hash);
  return m ? { section: 'tasks', list: m[1] as TaskStatus } : null;
}

/** Перехід без нового запису в історії: кнопка «Назад» на Android закриває застосунок, а не гортає вкладки. */
export function navigate(path: string): void {
  location.replace(`#${path}`);
}

export function useRoute(): Route {
  const [hash, setHash] = useState(location.hash);

  useEffect(() => {
    const onChange = () => setHash(location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const route = parseHash(hash);
  useEffect(() => {
    // Запуск без адреси (start_url) або невідома адреса — відкриваємо «Сьогодні».
    if (!parseHash(hash)) navigate('/tasks/today');
  }, [hash]);

  return route ?? DEFAULT_ROUTE;
}
