'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

/** Al volver del email de "he olvidado mi contraseña": elegir una nueva. */
export default function NewPasswordForm() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setBusy(true);
    setError('');
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(
        error.message.toLowerCase().includes('different')
          ? 'Tiene que ser distinta de la anterior.'
          : 'No hemos podido guardarla. Pide otro enlace e inténtalo de nuevo.',
      );
    }
    window.location.assign('/mis-tiendas');
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <Logo />
        <h1>Pon tu contraseña nueva</h1>
        <p className="muted">Mínimo 6 caracteres. Después entrarás directamente a tus tiendas.</p>
        <form className="form" onSubmit={save}>
          <label>
            Contraseña nueva
            <input
              type="password"
              required
              minLength={6}
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
