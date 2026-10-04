import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  BackupError,
  backupFileName,
  createBackup,
  describeBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from '../data/backup';
import { db } from '../data/db';
import { useToast } from '../shared/ui/Toast';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import { MoreIcon } from '../shared/ui/icons';
import { formatLongDate } from '../shared/utils/date';

/** Меню «⋯» у верхньому рядку: резервна копія. Спільне для всіх розділів. */
export function AppMenu() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ backup: Backup; currentCount: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const save = async () => {
    setOpen(false);
    try {
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Файл копії збережено');
    } catch {
      toast('Не вдалося зберегти копію');
    }
  };

  const pickFile = () => {
    setOpen(false);
    fileRef.current?.click();
  };

  // Файл прочитано й перевірено — чекаємо підтвердження заміни.
  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      // Спершу прочитати файл, потім очищати поле: після очищення браузер може відмовити в читанні.
      const text = await file.text();
      const backup = parseBackup(text);
      const currentCount = await db.tasks.filter((t) => t.deletedAt === null).count();
      setPending({ backup, currentCount });
    } catch (err) {
      if (!(err instanceof BackupError)) console.error(err);
      toast(err instanceof BackupError ? err.message : 'Не вдалося прочитати файл копії');
    } finally {
      // Щоб той самий файл можна було вибрати повторно.
      input.value = '';
    }
  };

  const confirmRestore = async () => {
    if (!pending) return;
    setPending(null);
    try {
      await restoreBackup(pending.backup);
      toast('Справи відновлено з копії');
    } catch {
      toast('Не вдалося відновити копію');
    }
  };

  const info = pending && describeBackup(pending.backup);

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Меню"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreIcon />
      </button>
      {open && (
        <div className="menu-list" role="menu">
          <button type="button" role="menuitem" className="menu-item" onClick={save}>
            Зберегти копію
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={pickFile}>
            Відновити з копії
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFileChosen} />
      {pending && info && (
        <ConfirmDialog
          title="Замінити справи даними з копії?"
          confirmLabel="Замінити"
          onConfirm={confirmRestore}
          onCancel={() => setPending(null)}
        >
          <p>
            Усі поточні справи ({pending.currentCount}) буде видалено і замінено справами з копії від{' '}
            {formatLongDate(info.exportedAt)} ({info.taskCount}). Цю дію не можна скасувати.
          </p>
          <p>Якщо поточні справи можуть знадобитися, спершу збережіть копію.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
