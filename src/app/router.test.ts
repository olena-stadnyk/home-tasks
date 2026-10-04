import { describe, expect, it } from 'vitest';
import { resolveHash } from './router';

describe('router', () => {
  it('канонічні адреси відкриваються без перенаправлення', () => {
    for (const list of ['today', 'later', 'done'] as const) {
      expect(resolveHash(`#/tasks/${list}`)).toEqual({ route: { section: 'tasks', list }, redirect: null });
    }
  });

  it('стара адреса Inbox відкриває «Пізніше», куди мігрували його справи', () => {
    expect(resolveHash('#/tasks/inbox')).toEqual({ route: { section: 'tasks', list: 'later' }, redirect: '/tasks/later' });
  });

  it('запуск без адреси або невідома адреса — «Сьогодні»', () => {
    for (const hash of ['', '#', '#/', '#/tasks/unknown', '#/tracker']) {
      expect(resolveHash(hash)).toEqual({ route: { section: 'tasks', list: 'today' }, redirect: '/tasks/today' });
    }
  });
});
