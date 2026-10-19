import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/currentUser';
import HeaderBar from '@/components/HeaderBar';
import VisitsChart from '@/components/VisitsChart';

export const metadata = { title: 'Analíticas — LanzaTienda' };
export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90];
const num = (n) => Number(n || 0).toLocaleString('es-ES');
const pct = (a, b) => (b ? `${((a / b) * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %` : '—');

function BarList({ title, rows, total }) {
  return (
    <section className="an-card">
      <h3>{title}</h3>
      {!rows.length ? (
        <p className="drawer-empty">Sin visitas todavía.</p>
      ) : (
        <ul className="bar-list">
          {rows.map((r) => (
            <li key={r.name} title={`${r.name}: ${num(r.visits)} visitas`}>
              <span className="bar-fill" style={{ width: `${Math.max(2, (r.visits / total) * 100)}%` }} />
              <span className="bar-name">{r.name}</span>
              <b>{num(r.visits)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AnaliticasPage({ params, searchParams }) {
  const { id } = await params;
  const { dias } = await searchParams;
  const days = RANGES.includes(Number(dias)) ? Number(dias) : 30;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, user, name } = await getCurrentUser();
  // Las reglas de Supabase (RLS) solo dejan ver tus propias tiendas y sus datos
  const { data: store } = await supabase.from('stores').select('id, store_name, url, domain').eq('id', id).maybeSingle();
  if (!store) notFound();
  const { data: stats, error } = await supabase.rpc('store_stats', { p_store: id, p_days: days });

  const s = stats || { views: 0, visitors: 0, checkouts: 0, pays: 0, daily: [], sources: [], devices: [] };
  const tiles = [
    ['Visitas', num(s.views), 'Veces que se abrió tu tienda'],
    ['Visitantes', num(s.visitors), 'Personas distintas'],
    ['Abrieron el pedido', num(s.checkouts), `${pct(s.checkouts, s.visitors)} de los visitantes`],
    ['Fueron a pagar', num(s.pays), `${pct(s.pays, s.visitors)} de los visitantes`],
  ];

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
            <span className="domain-label">Analíticas</span>
            <h1>{store.store_name}</h1>
            {store.url && (
              <a href={store.domain ? `https://${store.domain}` : store.url} target="_blank" rel="noreferrer" className="store-url">
                {store.domain || store.url.replace('https://', '')} ↗
              </a>
            )}
          </div>
          <div className="range" role="group" aria-label="Periodo">
            {RANGES.map((r) => (
              <Link key={r} href={`/analiticas/${id}?dias=${r}`} className={r === days ? 'on' : ''}>
                {r} días
              </Link>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert">
            No hemos podido cargar las analíticas. Si acabas de actualizar LanzaTienda, revisa que hayas ejecutado el SQL nuevo
            en Supabase.
          </div>
        )}

        <div className="tiles">
          {tiles.map(([label, value, hint]) => (
            <div key={label} className="tile">
              <span>{label}</span>
              <b>{value}</b>
              <small>{hint}</small>
            </div>
          ))}
        </div>

        <section className="an-card">
          <h3>Visitas por día</h3>
          <VisitsChart daily={s.daily || []} />
        </section>

        <div className="an-grid">
          <BarList title="De dónde vienen" rows={s.sources || []} total={s.views || 1} />
          <BarList title="Dispositivo" rows={s.devices || []} total={s.views || 1} />
        </div>

        <p className="hint">
          Contamos las visitas desde que la tienda se publica con LanzaTienda. «Fueron a pagar» son los clics en el botón de
          pago; la venta se termina en tu pasarela de pago.
        </p>
      </main>
    </>
  );
}
