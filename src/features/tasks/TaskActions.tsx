import { useEffect, useRef, useState } from 'react';
import { ACTIVE_STATUSES, type Task } from '../../data/types';
import { deleteTask, moveTask, renameTask, undeleteTask } from '../../data/tasks';
import { useToast } from '../../shared/ui/Toast';
import { LIST_LABELS } from './lists';

interface Props {
  task: Task;
  /** Закрити панель. */
  onDone: () => void;
  autoFocusTitle: boolean;
}

/** Вміст панелі дій: назва (редагується), переміщення, видалення. Однаковий для телефона й комп'ютера. */
export function TaskActions({ task, onDone, autoFocusTitle }: Props) {
  const toast = useToast();
  const done = task.status === 'done';
  const [draft, setDraft] = useState(task.title);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const deletedRef = useRef(false);

  // Назва зберігається при будь-якому закритті панелі.
  useEffect(() => {
    return () => {
      if (!done && !deletedRef.current) void renameTask(task.id, draftRef.current);
    };
  }, [task.id, done]);

  const remove = () => {
    deletedRef.current = true;
    const id = task.id;
    void deleteTask(id);
    toast('Видалено', () => void undeleteTask(id));
    onDone();
  };

  return (
    <div className="actions">
      {done ? (
        <p className="actions-title">{task.title}</p>
      ) : (
        // textarea, щоб довга назва була видна повністю; Enter зберігає, а не переносить рядок.
        <textarea
          className="actions-input"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\n/g, ' '))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onDone();
            }
          }}
          aria-label="Назва справи"
          autoFocus={autoFocusTitle}
          enterKeyHint="done"
        />
      )}
      <div className="actions-bar">
        {!done && (
          <div className="actions-moves">
            {ACTIVE_STATUSES.filter((s) => s !== task.status).map((s) => (
              <button
                key={s}
                type="button"
                className="move-btn"
                onClick={() => {
                  void moveTask(task.id, s);
                  onDone();
                }}
              >
                {LIST_LABELS[s]}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="delete-btn" onClick={remove}>
          Видалити
        </button>
      </div>
    </div>
  );
}
