import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

interface Props {
  /** Клік усередині цього елемента (рядок + панель) панель не закриває. */
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}

/** Панель, що розкривається під рядком на широкому екрані. Закривається кліком поза рядком або Esc. */
export function InlinePanel({ containerRef, onClose, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [containerRef]);

  return <div className="panel-inline">{children}</div>;
}
