import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/currentUser';
import { createAdminClient } from '@/lib/supabase/admin';
import { listPaidCheckouts, stripeEnabled } from '@/lib/stripe';
import { getUserAccountId } from '@/lib/payments';
import HeaderBar from '@/components/HeaderBar';

export const metadata = { title: 'Pedidos — Dropshype' };
export const dynamic = 'force-dynamic';

const eur = (cents) => (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const when = (s) =>
  new Date(s * 1000).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Según la versión de la API de Stripe, la dirección de envío está en un sitio u otro
const shippingOf = (s) => s.collected_information?.shipping_details || s.shipping_details || null;

function Address({ a }) {
  if (!a) return null;
  return (
    <>
      {a.line1}
      {a.line2 ? `, ${a.line2}` : ''}
      <br />
      {[a.postal_code, a.city, a.state].filter(Boolean).join(' ')} · {a.country}
    </>
  );
}

export default async function PedidosPage({ params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, user, name } = await getCurrentUser();
  // Las reglas de Supabase (RLS) solo devuelven tus propias tiendas
  const { data: store } = await supabase.from('stores').select('id, store_name').eq('id', id).maybeSingle();
  if (!store) notFound();

  let orders = null;
  let problem = null;
  if (!stripeEnabled()) problem = 'off';
  else {
    const accountId = await getUserAccountId(createAdminClient(), user.id);
    if (!accountId) problem = 'noaccount';
    else {
      try {
        const res = await listPaidCheckouts(accountId);
        orders = (res.data || []).filter((s) => s.metadata?.storeId === id);
      } catch (err) {
        console.error('orders list error', err);
        problem = 'error';
      }
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <HeaderBar user={user} name={name}>
            <Link href="/mis-tiendas" className="logout">
              Mis tiendas
            </Link>
          </HeaderBar>
        </div>
      </header>

      <main className="container analytics">
        <div className="an-head">
          <div>
            <span className="domain-label">Pedidos</span>
            <h1>{store.store_name}</h1>
          </div>
        </div>

        {problem === 'off' && <div className="empty">Los cobros con tarjeta todavía no están activados en Dropshype.</div>}
        {problem === 'noaccount' && (
          <div className="empty">
            <p>Aquí verás los pedidos pagados con tarjeta, con la dirección de envío de cada cliente.</p>
            <Link href="/mis-tiendas" className="btn btn-primary">
              Activar cobros con tarjeta
            </Link>
          </div>
        )}
        {problem === 'error' && <div className="alert">No hemos podido cargar los pedidos. Recarga la página.</div>}

        {orders && !orders.length && (
          <div className="empty">
            <p>Todavía no hay pedidos pagados en esta tienda.</p>
          </div>
        )}

        {orders?.length > 0 && (
          <>
            <p className="muted">
              {orders.length} pedido{orders.length > 1 ? 's' : ''} · Total{' '}
              <b>{eur(orders.reduce((t, o) => t + (o.amount_total || 0), 0))}</b>
            </p>
            <div className="order-list">
              {orders.map((o) => {
                const ship = shippingOf(o);
                const c = o.customer_details || {};
                return (
                  <article key={o.id} className="order-card">
                    <div className="order-top">
                      <div>
                        <b>{ship?.name || c.name || 'Cliente'}</b>
                        <small>{when(o.created)}</small>
                      </div>
                      <span className="order-total">{eur(o.amount_total || 0)}</span>
                    </div>
                    <p className="order-items">{o.metadata?.items}</p>
                    <div className="order-grid">
                      <div>
                        <span className="domain-label">Enviar a</span>
                        <p>
                          <Address a={ship?.address || c.address} />
                        </p>
                      </div>
                      <div>
                        <span className="domain-label">Contacto</span>
                        <p>
                          {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                          {c.phone && (
                            <>
                              <br />
                              {c.phone}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
