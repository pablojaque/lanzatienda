import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DomainPanel from '@/components/DomainPanel';

export const metadata = { title: 'Mis tiendas — LanzaTienda' };
export const dynamic = 'force-dynamic';

export default async function MisTiendasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Las reglas de Supabase (RLS) solo devuelven las tiendas de este usuario
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, store_name, url, domain, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <header className="site-header">
        <div className="container row">
          <Link href="/" className="brand">
            Lanza<span>Tienda</span>
          </Link>
          <div className="header-actions">
            <Link href="/crear" className="btn btn-dark btn-sm">
              + Nueva tienda
            </Link>
            <form action="/auth/salir" method="post">
              <button className="logout">Salir</button>
            </form>
          </div>
        </div>
      </header>

      <main className="container stores">
        <h1>Mis tiendas</h1>
        <p className="muted">{user?.email}</p>

        {error && <div className="alert">No hemos podido cargar tus tiendas. Recarga la página.</div>}

        {!error && !stores?.length && (
          <div className="empty">
            <p>Todavía no has creado ninguna tienda.</p>
            <Link href="/crear" className="btn btn-primary">
              🚀 Crear mi primera tienda
            </Link>
          </div>
        )}

        <div className="store-list">
          {stores?.map((s) => (
            <article key={s.id} className="store-card">
              <div className="store-top">
                <div>
                  <h2>{s.store_name}</h2>
                  <small>Creada el {new Date(s.created_at).toLocaleDateString('es-ES')}</small>
                </div>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    Abrir ↗
                  </a>
                )}
              </div>
              {s.url && <p className="store-url">{s.url.replace('https://', '')}</p>}
              <DomainPanel storeId={s.id} domain={s.domain} />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
