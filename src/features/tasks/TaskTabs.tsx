import type { TaskStatus } from '../../data/types';
import { navigate } from '../../app/router';
import { LIST_LABELS, TAB_ORDER } from './lists';

interface Props {
  current: TaskStatus;
  /** undefined, поки дані завантажуються. */
  counts: Record<TaskStatus, number> | undefined;
}

export function TaskTabs({ current, counts }: Props) {
  return (
    <nav className="tabs" aria-label="Списки">
      {TAB_ORDER.map((status) => {
        const count = status === 'done' ? 0 : (counts?.[status] ?? 0);
        return (
          <button
            key={status}
            type="button"
            className={`tab${status === current ? ' tab--active' : ''}`}
            aria-current={status === current ? 'page' : undefined}
            onClick={() => navigate(`/tasks/${status}`)}
          >
            {LIST_LABELS[status]}
            {count > 0 && <span className="tab-count">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
