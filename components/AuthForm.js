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
  google: 'No se pudo entrar con Google. Inténtalo de nuevo.',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

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

  // Google nos devuelve a /auth/callback, que abre la sesión y sigue a `next`
  async function withGoogle() {
    setStatus({ state: 'sending', message: '' });
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setStatus({ state: 'error', message: LINK_ERRORS.google });
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

        <button type="button" className="btn btn-google" onClick={withGoogle} disabled={busy}>
          <GoogleIcon />
          Continuar con Google
        </button>
        <div className="auth-or">
          <span>o con tu email</span>
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
