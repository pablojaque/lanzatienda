'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5h16M9.5 20v-5h5v5" />,
  out: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
};

const Icon = ({ name }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/** Botón de tres barras que abre, desde la izquierda, tus tiendas y sus analíticas. */
export default function SideMenu({ name }) {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // El panel se pinta directamente en <body>: si estuviera dentro de la barra de arriba
  // (que tiene desenfoque), el navegador lo recortaría a la altura de la barra
  useEffect(() => setMounted(true), []);

  // Cada vez que se abre cargamos las tiendas (Supabase solo devuelve las tuyas)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => createClient().from('stores').select('id, store_name, url').order('created_at', { ascending: false }))
      .then(({ data }) => !cancelled && setStores(data || []))
      .catch(() => !cancelled && setStores((s) => s || []));
    return () => {
      cancelled = true;
    };
  }, [open]);

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

  const drawer = (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <nav className={`drawer ${open ? 'open' : ''}`} aria-label="Menú" aria-hidden={!open} inert={open ? undefined : ''}>
        <div className="drawer-head">
          <div>
            <span className="domain-label">Tu cuenta</span>
            <b>{name ? `Hola, ${name}` : 'Hola'}</b>
          </div>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="drawer-links">
          <Link href="/crear" className={pathname === '/crear' ? 'on' : ''}>
            <Icon name="plus" /> Crear tienda
          </Link>
          <Link href="/mis-tiendas" className={pathname === '/mis-tiendas' ? 'on' : ''}>
            <Icon name="store" /> Mis tiendas
          </Link>
        </div>

        <h4 className="drawer-title">Tus tiendas</h4>
        {!stores ? (
          <p className="drawer-empty">Cargando…</p>
        ) : !stores.length ? (
          <p className="drawer-empty">Todavía no tienes tiendas.</p>
        ) : (
          <ul className="drawer-stores">
            {stores.map((s) => (
              <li key={s.id} className={pathname.includes(s.id) ? 'on' : ''}>
                <div className="drawer-store">
                  <b>{s.store_name}</b>
                  <span className="drawer-store-links">
                    <Link href={`/analiticas/${s.id}`}>Analíticas</Link>
                    <Link href={`/pedidos/${s.id}`}>Pedidos</Link>
                    <Link href={`/crear?tienda=${s.id}`}>Editar</Link>
                  </span>
                </div>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="drawer-open" aria-label={`Abrir ${s.store_name}`}>
                    ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        <form action="/auth/salir" method="post" className="drawer-foot">
          <button className="logout">
            <Icon name="out" /> Cerrar sesión
          </button>
        </form>
      </nav>
    </>
  );

  return (
    <>
      <button type="button" className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
        <span />
        <span />
        <span />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
