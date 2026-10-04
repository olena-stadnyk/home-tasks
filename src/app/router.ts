import { useEffect, useState } from 'react';
import type { TaskStatus } from '../data/types';

/**
 * Адреси розділів: #/tasks/today, #/tasks/later, #/tasks/done.
 * Tracker пізніше додається як ще один варіант Route (наприклад, { section: 'tracker' }).
 */
export type Route = { section: 'tasks'; list: TaskStatus };

const DEFAULT_PATH = '/tasks/today';

/** Застарілі адреси → актуальні. Inbox прибрано, його справи мігрували в «Пізніше». */
const LEGACY_PATHS: Record<string, string> = {
  '/tasks/inbox': '/tasks/later',
};

export function parseHash(hash: string): Route | null {
  const m = /^#\/tasks\/(today|later|done)$/.exec(hash);
  return m ? { section: 'tasks', list: m[1] as TaskStatus } : null;
}

/**
 * Маршрут для адреси та, якщо адреса не канонічна, куди її замінити:
 * застаріла — на актуальну, порожня або невідома — на «Сьогодні».
 */
export function resolveHash(hash: string): { route: Route; redirect: string | null } {
  const route = parseHash(hash);
  if (route) return { route, redirect: null };
  const path = LEGACY_PATHS[hash.replace(/^#/, '')] ?? DEFAULT_PATH;
  return { route: parseHash(`#${path}`)!, redirect: path };
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

  const { route, redirect } = resolveHash(hash);
  useEffect(() => {
    // Запуск без адреси (start_url) → «Сьогодні»; #/tasks/inbox → «Пізніше».
    if (redirect) navigate(redirect);
  }, [redirect]);

  return route;
}
