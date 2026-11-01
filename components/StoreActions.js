'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Botones de cada tienda en «Mis tiendas»: analíticas, pedidos, editar, abrir y borrar. */
export default function StoreActions({ store }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    const sure = confirm(
      `¿Borrar «${store.store_name}»?\n\nLa tienda dejará de estar en internet y se borrarán sus analíticas. No se puede deshacer.` +
        (store.domain ? `\n\nEl dominio ${store.domain} dejará de mostrar la tienda.` : '')
    );
    if (!sure) return;
    setDeleting(true);
    setError('');
    const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setDeleting(false);
      return setError(data.error || 'No hemos podido borrar la tienda. Inténtalo de nuevo.');
    }
    router.refresh();
  }

  return (
    <>
      <div className="store-actions">
        <Link href={`/analiticas/${store.id}`} className="btn btn-ghost btn-sm">
          📊 Analíticas
        </Link>
        <Link href={`/pedidos/${store.id}`} className="btn btn-ghost btn-sm">
          📦 Pedidos
        </Link>
        <Link href={`/crear?tienda=${store.id}`} className="btn btn-ghost btn-sm">
          ✏️ Editar
        </Link>
        {store.url && (
          <a href={store.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            Abrir ↗
          </a>
        )}
        <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={remove} disabled={deleting}>
          {deleting ? 'Borrando…' : '🗑️ Borrar'}
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
    </>
  );
}
