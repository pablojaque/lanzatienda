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
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
