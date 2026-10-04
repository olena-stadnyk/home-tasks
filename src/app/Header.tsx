import type { ReactNode } from 'react';
import { AppMenu } from './AppMenu';

interface Props {
  /** Назва розділу. Коли з'явиться Tracker, тут буде перемикач «Справи / Трекер». */
  title: string;
  /** Дії конкретного розділу (наприклад, друк списку). */
  actions?: ReactNode;
}

export function Header({ title, actions }: Props) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      {actions}
      <AppMenu />
    </header>
  );
}
