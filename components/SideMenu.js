'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Botón de tres barras que abre, desde la izquierda, tus tiendas y sus analíticas. */
export default function SideMenu({ name }) {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState(null);
  const pathname = usePathname();

  // Al abrirlo por primera vez cargamos las tiendas (Supabase solo devuelve las tuyas)
  useEffect(() => {
    if (!open || stores) return;
    Promise.resolve()
      .then(() => createClient().from('stores').select('id, store_name, url').order('created_at', { ascending: false }))
      .then(({ data }) => setStores(data || []))
      .catch(() => setStores([]));
  }, [open, stores]);

  // Cerrar al cambiar de página o pulsar Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button type="button" className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Abrir menú">
        <span />
        <span />
        <span />
      </button>

      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <nav className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
        <div className="drawer-head">
          <div>
            <span className="domain-label">Tu cuenta</span>
            <b>{name ? `Hola, ${name} 👋` : 'Hola 👋'}</b>
          </div>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <div className="drawer-links">
          <Link href="/crear" className={pathname === '/crear' ? 'on' : ''}>
            🚀 Crear tienda
          </Link>
          <Link href="/mis-tiendas" className={pathname === '/mis-tiendas' ? 'on' : ''}>
            🏪 Mis tiendas
          </Link>
        </div>

        <h4 className="drawer-title">Tus tiendas</h4>
        {!stores ? (
          <p className="drawer-empty">Cargando…</p>
        ) : !stores.length ? (
          <p className="drawer-empty">Todavía no tienes tiendas.</p>
        ) : (
          <ul className="drawer-stores">
            {stores.map((s) => {
              const href = `/analiticas/${s.id}`;
              return (
                <li key={s.id} className={pathname === href ? 'on' : ''}>
                  <Link href={href} className="drawer-store">
                    <b>{s.store_name}</b>
                    <small>📊 Ver analíticas</small>
                  </Link>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="drawer-open" aria-label={`Abrir ${s.store_name}`}>
                      ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form action="/auth/salir" method="post" className="drawer-foot">
          <button className="logout">Cerrar sesión</button>
        </form>
      </nav>
    </>
  );
}
