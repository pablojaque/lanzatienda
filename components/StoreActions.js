'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

/** Botones de cada tienda en «Mis tiendas»: analíticas, pedidos, editar, abrir y borrar. */
export default function StoreActions({ store }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');

  async function duplicate() {
    setCopying(true);
    setError('');
    const res = await fetch(`/api/stores/${store.id}/duplicate`, { method: 'POST' }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setCopying(false);
    if (!res?.ok) return setError(data.error || 'No hemos podido duplicar la tienda. Inténtalo de nuevo.');
    // La copia aparece en la lista; Vercel tarda unos segundos en tenerla online
    router.refresh();
  }

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
          <Icon name="chart" /> Analíticas
        </Link>
        <Link href={`/pedidos/${store.id}`} className="btn btn-ghost btn-sm">
          <Icon name="box" /> Pedidos
        </Link>
        <Link href={`/crear?tienda=${store.id}`} className="btn btn-ghost btn-sm">
          <Icon name="edit" /> Editar
        </Link>
        {store.url && (
          <a href={store.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            <Icon name="external" /> Abrir
          </a>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={duplicate} disabled={copying}>
          <Icon name="copy" /> {copying ? 'Duplicando…' : 'Duplicar'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={remove} disabled={deleting}>
          <Icon name="trash" /> {deleting ? 'Borrando…' : 'Borrar'}
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
    </>
  );
}
