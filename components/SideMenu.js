'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/Icon';

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
            <Icon name="close" />
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
                    <Icon name="external" size={15} />
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
