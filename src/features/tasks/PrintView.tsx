import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Task, TaskStatus } from '../../data/types';
import { formatLongDate } from '../../shared/utils/date';
import { LIST_LABELS } from './lists';

/** Версія списку тільки для друку (на екрані прихована): назва списку, дата, справи з порожніми чекбоксами. */
export function PrintView({ list, tasks }: { list: TaskStatus; tasks: Task[] }) {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    // Дата — на момент друку, навіть якщо застосунок відкритий з учора.
    const onBeforePrint = () => flushSync(() => setDate(new Date()));
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  return (
    <section className="print-view" aria-hidden="true">
      <h1>{LIST_LABELS[list]}</h1>
      <p className="print-date">{formatLongDate(date)}</p>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span className="print-box" />
            <span>{t.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
