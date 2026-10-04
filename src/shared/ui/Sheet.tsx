import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Нижня панель для телефона. Закривається тапом поза нею, Esc
 * і системною кнопкою «Назад» на Android (для цього додає запис в історію).
 */
export function Sheet({ label, onClose, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let closedByBack = false;
    history.pushState({ sheet: true }, '');
    const onPop = () => {
      closedByBack = true;
      onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      if (!closedByBack) history.back();
    };
  }, []);

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
