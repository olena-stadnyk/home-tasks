import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { countByStatus, tasksInList } from '../../data/tasks';
import type { TaskStatus } from '../../data/types';
import { FINE_POINTER_QUERY, WIDE_QUERY, useMediaQuery } from '../../shared/utils/useMediaQuery';
import { PrinterIcon } from '../../shared/ui/icons';
import { Header } from '../../app/Header';
import { AddTaskInput } from './AddTaskInput';
import { TaskTabs } from './TaskTabs';
import { TaskRow } from './TaskRow';
import { PrintView } from './PrintView';
import { EMPTY_TEXT } from './lists';

export function TasksPage({ list }: { list: TaskStatus }) {
  const all = useLiveQuery(() => db.tasks.toArray(), []);
  const wide = useMediaQuery(WIDE_QUERY);
  const finePointer = useMediaQuery(FINE_POINTER_QUERY);
  const [openId, setOpenId] = useState<string | null>(null);

  const tasks = all ? tasksInList(all, list) : [];
  const counts = all ? countByStatus(all) : undefined;

  // Панель закривається при зміні списку або коли справа зникла з нього.
  useEffect(() => setOpenId(null), [list]);
  useEffect(() => {
    if (openId && all && !tasks.some((t) => t.id === openId)) setOpenId(null);
  });

  // Щойно додана справа має бути видна, навіть якщо список довгий (у «Сьогодні» і «Пізніше» вона стає в кінець).
  const [addedId, setAddedId] = useState<string | null>(null);
  useEffect(() => setAddedId(null), [list]);
  useEffect(() => {
    if (!addedId) return;
    const el = document.querySelector(`[data-task-id="${addedId}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    setAddedId(null);
  });

  const printable = list !== 'done' && tasks.length > 0;

  return (
    <div className="app">
      <Header
        title="Справи"
        actions={
          printable && (
            <button type="button" className="icon-btn" aria-label="Надрукувати список" onClick={() => window.print()}>
              <PrinterIcon />
            </button>
          )
        }
      />
      {list !== 'done' && <AddTaskInput status={list} autoFocus={wide && finePointer} onAdded={setAddedId} />}
      <TaskTabs current={list} counts={counts} />
      <main className="list-area">
        {all &&
          (tasks.length === 0 ? (
            <p className="empty">{EMPTY_TEXT[list]}</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  open={openId === task.id}
                  onToggle={() => setOpenId((id) => (id === task.id ? null : task.id))}
                  onClose={() => setOpenId(null)}
                  wide={wide}
                  finePointer={finePointer}
                />
              ))}
            </ul>
          ))}
      </main>
      <PrintView list={list} tasks={tasks} />
    </div>
  );
}
