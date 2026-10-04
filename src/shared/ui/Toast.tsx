import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ShowToast = (message: string, undo?: () => void) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

interface ToastState {
  key: number;
  message: string;
  undo?: () => void;
}

const DURATION_MS = 5000;

/** Одночасно показується одне повідомлення; нове замінює попереднє. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback<ShowToast>((message, undo) => {
    window.clearTimeout(timer.current);
    setToast({ key: Date.now(), message, undo });
    timer.current = window.setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  const onUndo = () => {
    window.clearTimeout(timer.current);
    toast?.undo?.();
    setToast(null);
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            <span>{toast.message}</span>
            {toast.undo && (
              <button type="button" className="toast-undo" onClick={onUndo}>
                Скасувати
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
