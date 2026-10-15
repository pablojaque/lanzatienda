'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeDomain } from '@/lib/domains';

const RECHECK_MS = 30000;

/**
 * Conectar un dominio propio a una tienda y ver qué DNS hay que poner.
 * - `domain`: el dominio ya guardado para la tienda (si tiene)
 * - `pendingDomain`: dominio escrito al crear la tienda, se conecta solo al aparecer
 */
export default function DomainPanel({ storeId, domain = null, pendingDomain = '' }) {
  const [info, setInfo] = useState(domain ? { domain } : null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(pendingDomain ? 'connect' : domain ? 'check' : '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const api = useCallback(
    async (method, body) => {
      const res = await fetch(method === 'GET' ? `/api/domain?storeId=${storeId}` : '/api/domain', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'GET' ? undefined : JSON.stringify({ storeId, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Algo ha fallado. Inténtalo de nuevo.');
      return data;
    },
    [storeId]
  );

  const run = useCallback(
    async (kind, method, body) => {
      setBusy(kind);
      setError('');
      try {
        const data = await api(method, body);
        setInfo(data.domain ? data : null);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy('');
      }
    },
    [api]
  );

  // Al aparecer: conectar el dominio que escribió al crear la tienda, o comprobar el que ya tiene
  useEffect(() => {
    if (pendingDomain) run('connect', 'POST', { domain: pendingDomain });
    else if (domain) run('check', 'GET');
  }, [pendingDomain, domain, run]);

  // Mientras los DNS no estén listos, lo comprobamos solos cada 30 s
  useEffect(() => {
    if (!info?.domain || info.ready === undefined || info.ready) return;
    const t = setInterval(() => {
      api('GET')
        .then((data) => setInfo(data.domain ? data : null))
        .catch(() => {});
    }, RECHECK_MS);
    return () => clearInterval(t);
  }, [info, api]);

  function connect(e) {
    e.preventDefault();
    const d = normalizeDomain(input);
    if (!d) return setError('Escribe un dominio válido, por ejemplo: mitienda.com');
    run('connect', 'POST', { domain: d });
  }

  function copy(value) {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1500);
  }

  if (busy === 'connect') {
    return (
      <div className="domain-panel">
        <p className="domain-loading">Conectando tu dominio…</p>
      </div>
    );
  }

  // Sin dominio: formulario para conectarlo
  if (!info?.domain) {
    return (
      <div className="domain-panel">
        <h3>¿Tienes un dominio propio?</h3>
        <p className="domain-sub">Conéctalo y tu tienda se verá en tu dirección, por ejemplo mitienda.com.</p>
        <form className="domain-form" onSubmit={connect}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="mitienda.com" />
          <button className="btn btn-dark btn-sm" disabled={!input.trim()}>
            Conectar
          </button>
        </form>
        {error && <div className="alert">{error}</div>}
      </div>
    );
  }

  const url = `https://${info.domain}`;

  return (
    <div className="domain-panel">
      <div className="domain-head">
        <div>
          <span className="domain-label">Tu dominio</span>
          <b>{info.domain}</b>
        </div>
        {info.ready === undefined ? (
          <span className="badge">Comprobando…</span>
        ) : info.ready ? (
          <span className="badge ok">✓ Conectado</span>
        ) : (
          <span className="badge wait">Esperando DNS</span>
        )}
      </div>

      {info.ready ? (
        <p className="domain-sub">
          ¡Listo! Tu tienda ya funciona en{' '}
          <a href={url} target="_blank" rel="noreferrer">
            {info.domain} ↗
          </a>{' '}
          con candado de seguridad (HTTPS).
        </p>
      ) : info.records ? (
        <>
          <p className="domain-sub">
            Entra en la web donde compraste el dominio (GoDaddy, Hostinger, IONOS, Namecheap, DonDominio…), busca{' '}
            <b>DNS</b> o <b>Zona DNS</b> y añade {info.records.length === 1 ? 'este registro' : 'estos registros'}:
          </p>
          <div className="dns-table">
            <div className="dns-row dns-th">
              <span>Tipo</span>
              <span>Nombre</span>
              <span>Valor</span>
            </div>
            {info.records.map((r) => (
              <div key={r.type + r.name + r.value} className="dns-row">
                <span>
                  <code>{r.type}</code>
                </span>
                <span>
                  <code>{r.name}</code>
                </span>
                <span className="dns-value">
                  <code>{r.value}</code>
                  <button type="button" onClick={() => copy(r.value)}>
                    {copied === r.value ? '¡Copiado!' : 'Copiar'}
                  </button>
                </span>
              </div>
            ))}
          </div>
          <ul className="domain-tips">
            {info.isApex && <li>Si ya hay un registro <b>A</b> con nombre <b>@</b>, edítalo y pon este valor (o bórralo).</li>}
            <li>En algunos proveedores el nombre <b>@</b> se deja vacío o se escribe el dominio entero.</li>
            <li>Suele funcionar en unos minutos, pero puede tardar hasta 24-48 h. Lo comprobamos solos.</li>
          </ul>
        </>
      ) : null}

      {error && <div className="alert">{error}</div>}

      <div className="domain-actions">
        {!info.ready && (
          <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run('check', 'GET')}>
            {busy === 'check' ? 'Comprobando…' : 'Comprobar ahora'}
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          disabled={!!busy}
          onClick={() => {
            if (confirm(`¿Quitar ${info.domain} de esta tienda?`)) run('remove', 'DELETE');
          }}
        >
          {busy === 'remove' ? 'Quitando…' : 'Quitar dominio'}
        </button>
      </div>
    </div>
  );
}
