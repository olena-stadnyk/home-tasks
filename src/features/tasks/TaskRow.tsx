import { useRef, useState } from 'react';
import type { Task } from '../../data/types';
import { completeTask, restoreTask } from '../../data/tasks';
import { useToast } from '../../shared/ui/Toast';
import { Sheet } from '../../shared/ui/Sheet';
import { InlinePanel } from '../../shared/ui/InlinePanel';
import { TaskActions } from './TaskActions';

interface Props {
  task: Task;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  wide: boolean;
  finePointer: boolean;
}

const COMPLETE_DELAY_MS = 450;

export function TaskRow({ task, open, onToggle, onClose, wide, finePointer }: Props) {
  const toast = useToast();
  const [completing, setCompleting] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const done = task.status === 'done';

  const onCheck = () => {
    if (done) {
      void restoreTask(task.id);
      return;
    }
    if (completing) return;
    setCompleting(true);
    const id = task.id;
    // Коротка пауза, щоб було видно заповнений кружечок, потім рядок зникає.
    setTimeout(async () => {
      await completeTask(id);
      toast('Виконано', () => void restoreTask(id));
    }, COMPLETE_DELAY_MS);
  };

  const actions = <TaskActions task={task} onDone={onClose} autoFocusTitle={finePointer} />;

  return (
    <li
      ref={liRef}
      data-task-id={task.id}
      className={`task${done ? ' task--done' : ''}${completing ? ' task--completing' : ''}${open ? ' task--open' : ''}`}
    >
      <div className="task-row">
        <button
          type="button"
          className="check"
          aria-label={done ? `Повернути: ${task.title}` : `Виконати: ${task.title}`}
          onClick={onCheck}
        >
          <span className="check-circle" />
        </button>
        <button type="button" className="task-title" aria-expanded={open} onClick={onToggle}>
          {task.title}
        </button>
      </div>
      {open &&
        (wide ? (
          <InlinePanel containerRef={liRef} onClose={onClose}>
            {actions}
          </InlinePanel>
        ) : (
          <Sheet label="Дії зі справою" onClose={onClose}>
            {actions}
          </Sheet>
        ))}
    </li>
  );
}
