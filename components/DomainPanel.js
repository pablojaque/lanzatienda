'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeDomain } from '@/lib/domains';
import DomainBuy from '@/components/DomainBuy';

const RECHECK_MS = 30000;
const ORDER_POLL_MS = 4000;
const ORDER_WORKING = ['pending_payment', 'paid', 'buying', 'bought'];

/**
 * Conectar un dominio propio a una tienda y ver qué DNS hay que poner.
 * - `domain`: el dominio ya guardado para la tienda (si tiene)
 * - `pendingDomain`: dominio escrito al crear la tienda, se conecta solo al aparecer
 * - `orderId`: compra de dominio en marcha para esta tienda (al volver de pagar)
 */
export default function DomainPanel({ storeId, domain = null, pendingDomain = '', orderId = null }) {
  const [info, setInfo] = useState(domain ? { domain } : null);
  const [order, setOrder] = useState(orderId ? { id: orderId, status: 'pending_payment' } : null);
  const [mode, setMode] = useState('buy');
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

  // Compra de dominio en marcha: preguntamos cada pocos segundos hasta que esté conectado
  const orderWorking = order && ORDER_WORKING.includes(order.status);
  useEffect(() => {
    if (!orderWorking) return;
    let stop = false;
    async function poll() {
      const res = await fetch(`/api/domain/order?id=${order.id}`).catch(() => null);
      const data = res?.ok ? await res.json().catch(() => null) : null;
      if (stop) return;
      if (data?.status) setOrder(data);
      if (data?.status === 'connected') run('check', 'GET');
      else if (!data?.status || ORDER_WORKING.includes(data.status)) t = setTimeout(poll, ORDER_POLL_MS);
    }
    let t = setTimeout(poll, 0);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [orderWorking, order?.id, run]);

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

  if (orderWorking) {
    const steps = {
      pending_payment: 'Comprobando el pago…',
      paid: 'Pago recibido. Comprando tu dominio…',
      buying: 'Registrando tu dominio… (suele tardar menos de un minuto)',
      bought: '¡Dominio comprado! Conectándolo a tu tienda…',
    };
    return (
      <div className="domain-panel">
        <div className="domain-head">
          <div>
            <span className="domain-label">Comprando dominio</span>
            <b>{order.domain || '…'}</b>
          </div>
          <span className="badge wait">En marcha</span>
        </div>
        <p className="domain-loading">{steps[order.status]}</p>
        <p className="domain-sub">Puedes cerrar esta página: terminará solo.</p>
      </div>
    );
  }

  if (busy === 'connect') {
    return (
      <div className="domain-panel">
        <p className="domain-loading">Conectando tu dominio…</p>
      </div>
    );
  }

  // Sin dominio: comprar uno nuevo o conectar uno que ya tiene
  if (!info?.domain) {
    return (
      <div className="domain-panel">
        <h3>Ponle un dominio a tu tienda</h3>
        <p className="domain-sub">Tu tienda se verá en tu propia dirección, por ejemplo mitienda.com.</p>
        {order?.status === 'failed' && <div className="alert">{order.error}</div>}
        <div className="domain-tabs" role="tablist">
          <button type="button" className={mode === 'buy' ? 'active' : ''} onClick={() => setMode('buy')}>
            Comprar uno nuevo
          </button>
          <button type="button" className={mode === 'own' ? 'active' : ''} onClick={() => setMode('own')}>
            Ya tengo uno
          </button>
        </div>
        {mode === 'buy' ? (
          <DomainBuy storeId={storeId} />
        ) : (
          <>
            <form className="domain-form" onSubmit={connect}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="mitienda.com" />
              <button className="btn btn-dark btn-sm" disabled={!input.trim()}>
                Conectar
              </button>
            </form>
            {error && <div className="alert">{error}</div>}
          </>
        )}
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
