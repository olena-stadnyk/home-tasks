import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Широкий екран: колонка по центру, поле додавання вгорі, дії справи під рядком. */
export const WIDE_QUERY = '(min-width: 720px)';
/** Миша/тачпад: можна ставити autofocus, не боячись відкрити екранну клавіатуру. */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
