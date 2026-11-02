'use client';

import { useEffect, useState } from 'react';

// Lo lee también el script de app/layout.js antes de pintar la página (para que no parpadee)
export const THEME_KEY = 'lt-theme';

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Botón para cambiar entre modo claro y oscuro. Recuerda la elección en este navegador. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        )}
      </svg>
    </button>
  );
}
