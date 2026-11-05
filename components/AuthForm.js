'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Icon from '@/components/Icon';
import { createClient } from '@/lib/supabase/client';

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
  const isReset = mode === 'reset';
  const busy = status.state === 'sending';

  function switchMode(m) {
    setMode(m);
    setStatus({ state: 'idle', message: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ state: 'sending', message: '' });
    const supabase = createClient();

    // Recuperar contraseña: Supabase manda un email con un enlace que abre la página para poner otra
    if (isReset) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/cuenta/contrasena')}`,
      });
      if (error) return setStatus({ state: 'error', message: translate(error.message) });
      return setStatus({ state: 'reset-sent', message: '' });
    }

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

  if (status.state === 'reset-sent') {
    return (
      <div className="auth">
        <div className="auth-card">
          <div className="done-icon">
            <Icon name="mail" size={24} />
          </div>
          <h1>Revisa tu email</h1>
          <p className="muted">
            Si hay una cuenta con <b>{email}</b>, te llegará un enlace para poner una contraseña nueva. Mira también en spam.
          </p>
          <button className="text-btn" onClick={() => switchMode('login')}>
            Volver a entrar
          </button>
        </div>
      </div>
    );
  }

  if (status.state === 'sent') {
    return (
      <div className="auth">
        <div className="auth-card">
          <div className="done-icon">
            <Icon name="mail" size={24} />
          </div>
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
      <div className="auth-card">
        <Logo />
        <h1>{isReset ? 'Recupera tu contraseña' : isSignup ? 'Crea tu cuenta gratis' : 'Bienvenido de nuevo'}</h1>
        <p className="muted">
          {isReset
            ? 'Escribe tu email y te mandamos un enlace para poner una contraseña nueva.'
            : isSignup
              ? 'Necesitas una cuenta para crear y guardar tus tiendas.'
              : 'Entra para seguir creando tus tiendas.'}
        </p>

        {!isReset && (
          <div className="auth-tabs">
            <button type="button" className={isSignup ? 'on' : ''} onClick={() => switchMode('signup')}>
              Registrarme
            </button>
            <button type="button" className={!isSignup ? 'on' : ''} onClick={() => switchMode('login')}>
              Iniciar sesión
            </button>
          </div>
        )}

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
          {!isReset && (
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
          )}
          {mode === 'login' && (
            <button type="button" className="link-btn" onClick={() => switchMode('reset')}>
              ¿Has olvidado tu contraseña?
            </button>
          )}

          {status.state === 'error' && <div className="alert">{status.message}</div>}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Un momento…' : isReset ? 'Enviarme el enlace' : isSignup ? 'Crear cuenta y empezar' : 'Entrar'}
          </button>
        </form>
        {isReset && (
          <button type="button" className="text-btn" onClick={() => switchMode('login')}>
            Volver a entrar
          </button>
        )}
        {isSignup && (
          <p className="auth-legal">
            Al crear tu cuenta aceptas los <Link href="/legal/terminos">Términos</Link> y la{' '}
            <Link href="/legal/privacidad">Política de privacidad</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
