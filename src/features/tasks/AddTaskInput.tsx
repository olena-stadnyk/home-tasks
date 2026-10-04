import { useState, type FormEvent } from 'react';
import { addTask } from '../../data/tasks';

/** Швидке додавання. Справа завжди йде в Inbox; поле лишається активним для наступної. */
export function AddTaskInput({ autoFocus }: { autoFocus: boolean }) {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // Очищуємо одразу, не чекаючи бази, — інакше швидко надрукована наступна справа злипнеться з попередньою.
    const title = value;
    setValue('');
    addTask(title).catch(() => setValue((current) => current || title));
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
