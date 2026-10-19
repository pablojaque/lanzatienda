'use client';

import { useState } from 'react';
import { COUNTRIES } from '@/lib/contact';

const eur = (cents) => (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const EMPTY_CONTACT = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  country: 'ES',
};

/** Buscar un dominio libre, elegirlo, rellenar el titular y pagarlo en Stripe. */
export default function DomainBuy({ storeId }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [canBuy, setCanBuy] = useState(true);
  const [picked, setPicked] = useState(null);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  async function search(e) {
    e.preventDefault();
    setSearching(true);
    setError('');
    setPicked(null);
    try {
      const res = await fetch(`/api/domain/search?q=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No hemos podido buscar. Inténtalo de nuevo.');
      setResults(data.results);
      setCanBuy(data.canBuy);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function pay(e) {
    e.preventDefault();
    setPaying(true);
    setError('');
    try {
      const res = await fetch('/api/domain/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, domain: picked.domain, contact }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No hemos podido abrir el pago. Inténtalo de nuevo.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  }

  const set = (field) => (e) => setContact((c) => ({ ...c, [field]: e.target.value }));

  // Paso 2: datos del titular y pagar
  if (picked) {
    return (
      <form className="buy-form" onSubmit={pay}>
        <div className="buy-picked">
          <div>
            <span className="domain-label">Vas a comprar</span>
            <b>{picked.domain}</b>
          </div>
          <span className="buy-price">{eur(picked.priceCents)}</span>
        </div>
        <p className="domain-sub">
          Datos del titular del dominio (los pide la ley a quien registra un dominio). Puedes poner los tuyos o los de tu empresa.
        </p>
        <div className="buy-grid">
          <input required placeholder="Nombre" value={contact.firstName} onChange={set('firstName')} autoComplete="given-name" />
          <input required placeholder="Apellidos" value={contact.lastName} onChange={set('lastName')} autoComplete="family-name" />
          <input required type="email" placeholder="Email" value={contact.email} onChange={set('email')} autoComplete="email" />
          <input required type="tel" placeholder="Teléfono" value={contact.phone} onChange={set('phone')} autoComplete="tel" />
          <input
            required
            className="span-2"
            placeholder="Dirección (calle y número)"
            value={contact.address1}
            onChange={set('address1')}
            autoComplete="street-address"
          />
          <input required placeholder="Ciudad" value={contact.city} onChange={set('city')} autoComplete="address-level2" />
          <input required placeholder="Provincia / Estado" value={contact.state} onChange={set('state')} autoComplete="address-level1" />
          <input required placeholder="Código postal" value={contact.zip} onChange={set('zip')} autoComplete="postal-code" />
          <select value={contact.country} onChange={set('country')} autoComplete="country">
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="domain-actions">
          <button className="btn btn-primary btn-sm" disabled={paying}>
            {paying ? 'Abriendo el pago…' : `Pagar ${eur(picked.priceCents)}`}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={paying} onClick={() => setPicked(null)}>
            Elegir otro
          </button>
        </div>
        <p className="buy-note">
          🔒 Pago seguro con Stripe. Incluye 1 año de dominio, se conecta solo a tu tienda y no tienes que tocar DNS. Si algo
          falla, te devolvemos el dinero automáticamente.
        </p>
      </form>
    );
  }

  // Paso 1: buscar
  return (
    <>
      <form className="domain-form" onSubmit={search}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca un nombre: mitienda" />
        <button className="btn btn-dark btn-sm" disabled={query.trim().length < 2 || searching}>
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {results && (
        <ul className="buy-results">
          {results.map((r) => (
            <li key={r.domain} className={r.available ? '' : 'taken'}>
              <b>{r.domain}</b>
              {r.available ? (
                <>
                  <span className="buy-price">
                    {eur(r.priceCents)}
                    <small>/año</small>
                  </span>
                  <button type="button" className="btn btn-primary btn-sm" disabled={!canBuy} onClick={() => setPicked(r)}>
                    Elegir
                  </button>
                </>
              ) : (
                <span className="buy-taken">{r.premium ? 'Premium (no disponible)' : 'Ocupado'}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {results && !results.some((r) => r.available) && (
        <p className="domain-sub">Ninguno está libre. Prueba con otro nombre o añade una palabra (tienda, shop, online…).</p>
      )}
      {results && !canBuy && <p className="domain-sub">La compra de dominios se activará muy pronto.</p>}
      {error && <div className="alert">{error}</div>}
    </>
  );
}
