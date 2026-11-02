'use client';

import { useEffect, useState } from 'react';

/** Activar los cobros con tarjeta (Stripe) en todas tus tiendas y abrir tu panel de Stripe. */
export default function PaymentsPanel({ justReturned = false }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stripe/connect')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ error: true }));
  }, []);

  async function go(path) {
    setBusy(true);
    setError('');
    const res = await fetch(path, { method: 'POST' }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (data.url) return window.location.assign(data.url);
    setBusy(false);
    setError(data.error || 'Algo ha fallado. Inténtalo de nuevo.');
  }

  // Hasta que Dropshype tenga Stripe configurado, no enseñamos nada
  if (!status || status.available === false || status.error) return null;

  return (
    <section className={`pay-panel ${status.ready ? 'ok' : ''}`}>
      <div className="pay-text">
        <h3>{status.ready ? '💳 Cobros con tarjeta activados' : '💳 Cobra con tarjeta en tus tiendas'}</h3>
        <p>
          {status.ready
            ? 'Tus clientes pagan dentro de tu tienda y el dinero llega a tu cuenta de Stripe. Los pedidos con su dirección los ves en «Pedidos».'
            : status.connected
              ? justReturned
                ? 'Stripe está revisando tus datos o falta alguno. Si te lo pide, termina el alta.'
                : 'Te falta terminar el alta en Stripe (datos, DNI y cuenta del banco donde recibirás el dinero).'
              : 'Conecta una cuenta de Stripe (gratis) y tus clientes pagarán con tarjeta, Apple Pay o Google Pay sin salir de tu tienda.'}
        </p>
        {error && <div className="alert">{error}</div>}
      </div>
      {status.ready ? (
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => go('/api/stripe/dashboard')}>
          Ver mis pagos en Stripe ↗
        </button>
      ) : (
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => go('/api/stripe/connect')}>
          {busy ? 'Abriendo Stripe…' : status.connected ? 'Terminar el alta' : 'Activar cobros'}
        </button>
      )}
    </section>
  );
}
