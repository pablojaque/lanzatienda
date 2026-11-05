'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Section } from '@/components/editor/ui';

const MSG = {
  same: 'La contraseña nueva tiene que ser distinta de la actual.',
  weak: 'La contraseña debe tener al menos 6 caracteres.',
};

function translate(message = '') {
  const m = message.toLowerCase();
  if (m.includes('should be different')) return MSG.same;
  if (m.includes('at least')) return MSG.weak;
  if (m.includes('already') && m.includes('registered')) return 'Ya hay otra cuenta con ese email.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento.';
  return 'No se ha podido guardar. Inténtalo de nuevo.';
}

/** Un bloque de ajustes con su propio formulario, botón y mensaje. */
function Block({ title, hint, children, onSave, label = 'Guardar', danger = false, disabled = false }) {
  const [state, setState] = useState({ busy: false, ok: '', error: '' });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, ok: '', error: '' });
    const res = await onSave().catch((err) => ({ error: err.message }));
    setState({ busy: false, ok: res?.ok || '', error: res?.error || '' });
  }
  return (
    <form className={`acc-card ${danger ? 'danger' : ''}`} onSubmit={submit}>
      <Section title={title} hint={hint}>
        <div className="form">{children}</div>
      </Section>
      {state.error && <div className="alert">{state.error}</div>}
      {state.ok && <p className="acc-ok">{state.ok}</p>}
      <button className={`btn btn-sm ${danger ? 'btn-ghost btn-danger' : 'btn-primary'}`} disabled={state.busy || disabled}>
        {state.busy ? 'Un momento…' : label}
      </button>
    </form>
  );
}

/** Ajustes de la cuenta: nombre, email, contraseña y borrar la cuenta. */
export default function AccountSettings({ name: initialName, email: initialEmail }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const supabase = createClient();

  return (
    <div className="acc">
      <Block
        title="Tu nombre"
        hint="Es como te saludamos en Dropshype."
        onSave={async () => {
          const clean = name.trim().replace(/\s+/g, ' ').slice(0, 40);
          if (!clean) return { error: 'Escribe tu nombre.' };
          const { error } = await supabase.auth.updateUser({ data: { display_name: clean } });
          return error ? { error: translate(error.message) } : { ok: 'Nombre guardado.' };
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" />
      </Block>

      <Block
        title="Email"
        hint="Te mandaremos un enlace al email nuevo para confirmarlo. Hasta entonces sigues entrando con el actual."
        disabled={email.trim() === initialEmail}
        onSave={async () => {
          const { error } = await supabase.auth.updateUser({ email: email.trim() });
          return error
            ? { error: translate(error.message) }
            : { ok: `Revisa ${email.trim()} y pulsa el enlace para confirmarlo.` };
        }}
      >
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Block>

      <Block
        title="Contraseña"
        hint="Mínimo 6 caracteres."
        onSave={async () => {
          if (password.length < 6) return { error: MSG.weak };
          const { error } = await supabase.auth.updateUser({ password });
          if (error) return { error: translate(error.message) };
          setPassword('');
          return { ok: 'Contraseña cambiada.' };
        }}
        label="Cambiar contraseña"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña nueva"
          autoComplete="new-password"
        />
      </Block>

      <Block
        title="Borrar mi cuenta"
        hint="Se borran tu cuenta y todas tus tiendas, que dejarán de estar en internet. No se puede deshacer. Escribe BORRAR para confirmar."
        danger
        label="Borrar mi cuenta para siempre"
        disabled={confirmText.trim().toUpperCase() !== 'BORRAR'}
        onSave={async () => {
          const res = await fetch('/api/cuenta', { method: 'DELETE' }).catch(() => null);
          const data = res ? await res.json().catch(() => ({})) : {};
          if (!res?.ok) return { error: data.error || 'No hemos podido borrar la cuenta. Inténtalo de nuevo.' };
          window.location.assign('/');
          return { ok: 'Cuenta borrada.' };
        }}
      >
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="BORRAR" />
      </Block>
    </div>
  );
}
