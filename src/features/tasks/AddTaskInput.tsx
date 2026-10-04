import { useState, type FormEvent } from 'react';
import { addTask } from '../../data/tasks';
import type { ActiveStatus } from '../../data/types';

interface Props {
  /** Список, у який додається справа, — той, що зараз відкритий. */
  status: ActiveStatus;
  autoFocus: boolean;
  onAdded: (id: string) => void;
}

/** Швидке додавання у відкритий список; поле лишається активним для наступної справи. */
export function AddTaskInput({ status, autoFocus, onAdded }: Props) {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // Очищуємо одразу, не чекаючи бази, — інакше швидко надрукована наступна справа злипнеться з попередньою.
    const title = value;
    setValue('');
    addTask(title, status)
      .then((id) => id && onAdded(id))
      .catch(() => setValue((current) => current || title));
  };

  return (
    <form className="add" onSubmit={submit}>
      <span className="add-plus" aria-hidden="true">
        ＋
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Що треба зробити?"
        aria-label="Нова справа"
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="enter"
      />
    </form>
  );
}
