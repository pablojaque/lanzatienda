'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

// Supabase responde en inglés: traducimos los errores más habituales
function translate(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('already registered')) return 'Ya existe una cuenta con este email. Inicia sesión.';
  if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar (revisa tu bandeja de entrada).';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (m.includes('invalid') && m.includes('email')) return 'Ese email no parece válido.';
  return message || 'Algo ha fallado. Inténtalo de nuevo.';
}

const LINK_ERRORS = {
  enlace: 'El enlace de confirmación no es válido o ha caducado. Inicia sesión.',
};

export default function AuthForm({ next, linkError }) {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({
    state: LINK_ERRORS[linkError] ? 'error' : 'idle',
    message: LINK_ERRORS[linkError] || '',
  });

  const isSignup = mode === 'signup';
  const busy = status.state === 'sending';

  function switchMode(m) {
    setMode(m);
    setStatus({ state: 'idle', message: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ state: 'sending', message: '' });
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) return setStatus({ state: 'error', message: translate(error.message) });
      // Si Supabase no pide confirmar el email, ya hay sesión y entramos directamente
      if (data.session) return window.location.assign(next);
      return setStatus({ state: 'sent', message: '' });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setStatus({ state: 'error', message: translate(error.message) });
    window.location.assign(next);
  }

  if (status.state === 'sent') {
    return (
      <div className="auth">
        <div className="auth-card">
          <div className="done-emoji">📬</div>
          <h1>Revisa tu email</h1>
          <p className="muted">
            Te hemos enviado un enlace a <b>{email}</b>. Púlsalo para activar tu cuenta y empezar a crear tu tienda.
          </p>
          <button className="text-btn" onClick={() => switchMode('login')}>
            Ya lo he confirmado, quiero entrar
          </button>
        </div>
      </div>
    );
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
        <h1>{isSignup ? 'Crea tu cuenta gratis' : 'Bienvenido de nuevo'}</h1>
        <p className="muted">
          {isSignup ? 'Necesitas una cuenta para crear y guardar tus tiendas.' : 'Entra para seguir creando tus tiendas.'}
        </p>

        <div className="auth-tabs">
          <button type="button" className={isSignup ? 'on' : ''} onClick={() => switchMode('signup')}>
            Registrarme
          </button>
          <button type="button" className={!isSignup ? 'on' : ''} onClick={() => switchMode('login')}>
            Iniciar sesión
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
            />
          </label>

          {status.state === 'error' && <div className="alert">{status.message}</div>}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Un momento…' : isSignup ? 'Crear cuenta y empezar' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
