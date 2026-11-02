import Link from 'next/link';
import { getCurrentUser } from '@/lib/currentUser';
import DomainPanel from '@/components/DomainPanel';
import HeaderBar from '@/components/HeaderBar';
import StoreActions from '@/components/StoreActions';
import PaymentsPanel from '@/components/PaymentsPanel';
import Icon from '@/components/Icon';

export const metadata = { title: 'Mis tiendas — Dropshype' };
export const dynamic = 'force-dynamic';

export default async function MisTiendasPage({ searchParams }) {
  const { pedido, cobros } = await searchParams;
  const { supabase, user, name } = await getCurrentUser();

  // Las reglas de Supabase (RLS) solo devuelven las tiendas de este usuario
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, store_name, url, domain, created_at')
    .order('created_at', { ascending: false });

  // Compras de dominio en marcha (o la que acaba de pagar, si vuelve de Stripe)
  const { data: orders } = await supabase
    .from('domain_orders')
    .select('id, store_id, status')
    .in('status', ['pending_payment', 'paid', 'buying', 'bought'])
    .order('created_at', { ascending: false });
  const orderByStore = {};
  for (const o of orders || []) {
    if (o.status === 'pending_payment' && o.id !== pedido) continue;
    orderByStore[o.store_id] ??= o.id;
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <HeaderBar user={user} name={name}>
            <Link href="/crear" className="btn btn-dark btn-sm">
              <Icon name="plus" /> Nueva tienda
            </Link>
          </HeaderBar>
        </div>
      </header>

      <main className="container stores">
        <h1>Mis tiendas</h1>
        <p className="muted">{user?.email}</p>

        {error && <div className="alert">No hemos podido cargar tus tiendas. Recarga la página.</div>}

        <PaymentsPanel justReturned={cobros === 'listo'} />

        {!error && !stores?.length && (
          <div className="empty">
            <p>Todavía no has creado ninguna tienda.</p>
            <Link href="/crear" className="btn btn-primary">
              <Icon name="plus" /> Crear mi primera tienda
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
              </div>
              {s.url && <p className="store-url">{s.url.replace('https://', '')}</p>}
              <StoreActions store={s} />
              <DomainPanel storeId={s.id} domain={s.domain} orderId={orderByStore[s.id] || null} />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
