import { useEffect, useRef, useState } from 'react';
import type { TaskStatus } from '../../data/types';
import { navigate } from '../../app/router';
import { LIST_LABELS, TAB_ORDER } from './lists';

interface Props {
  current: TaskStatus;
  /** undefined, поки дані завантажуються. */
  counts: Record<TaskStatus, number> | undefined;
}

export function TaskTabs({ current, counts }: Props) {
  // Лічильник Inbox коротко підсвічується, коли росте, — підтвердження, що справу записано.
  const prevInbox = useRef<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const inbox = counts?.inbox;
  useEffect(() => {
    if (inbox === undefined) return;
    if (prevInbox.current !== null && inbox > prevInbox.current) setPulseKey((k) => k + 1);
    prevInbox.current = inbox;
  }, [inbox]);

  return (
    <nav className="tabs" aria-label="Списки">
      {TAB_ORDER.map((status) => {
        const count = status === 'done' ? 0 : (counts?.[status] ?? 0);
        const pulse = status === 'inbox' && pulseKey > 0;
        return (
          <button
            key={status}
            type="button"
            className={`tab${status === current ? ' tab--active' : ''}`}
            aria-current={status === current ? 'page' : undefined}
            onClick={() => navigate(`/tasks/${status}`)}
          >
            {LIST_LABELS[status]}
            {count > 0 && (
              <span key={pulse ? pulseKey : undefined} className={`tab-count${pulse ? ' tab-count--pulse' : ''}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
