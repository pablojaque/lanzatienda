'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

/** Después de registrarse: ¿cómo te llamas? (lo usamos para saludarte). */
export default function NameForm({ next, initial = '', editing = false }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!clean) return setError('Escribe tu nombre.');
    setBusy(true);
    setError('');
    const { error } = await createClient().auth.updateUser({ data: { display_name: clean } });
    if (error) {
      setBusy(false);
      return setError('No hemos podido guardarlo. Inténtalo de nuevo.');
    }
    window.location.assign(next);
  }

  return (
    <div className="auth">
      <div className="auth-theme">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <Link href="/" className="brand">
          Lanza<span>Tienda</span>
        </Link>
        <div className="done-emoji">👋</div>
        <h1>{editing ? 'Cambia tu nombre' : '¡Bienvenido! ¿Cómo te llamas?'}</h1>
        <p className="muted">Así sabremos cómo saludarte cada vez que entres.</p>
        <form className="form" onSubmit={save}>
          <label>
            Tu nombre
            <input
              required
              autoFocus
              maxLength={40}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Por ejemplo: Pablo"
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy || !name.trim()}>
            {busy ? 'Guardando…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
