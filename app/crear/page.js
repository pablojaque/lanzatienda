import Link from 'next/link';
import Wizard from '@/components/Wizard';
import { getCurrentUser } from '@/lib/currentUser';

export const metadata = { title: 'Crear mi tienda — LanzaTienda' };
export const dynamic = 'force-dynamic';

// /crear crea una tienda nueva; /crear?tienda=<id> edita una que ya tienes
export default async function CrearPage({ searchParams }) {
  const { tienda } = await searchParams;
  const { supabase, user, name } = await getCurrentUser();
  const me = user ? { id: user.id } : null;

  if (!tienda) return <Wizard user={me} name={name} />;

  // Las reglas de Supabase (RLS) solo devuelven tus propias tiendas
  const { data: store } = /^[0-9a-f-]{36}$/i.test(tienda)
    ? await supabase.from('stores').select('id, store_name, url, config').eq('id', tienda).maybeSingle()
    : { data: null };

  if (!store?.config) {
    return (
      <div className="auth">
        <div className="auth-card">
          <div className="done-emoji">🛠️</div>
          <h1>{store ? 'Esta tienda no se puede editar' : 'No encontramos esa tienda'}</h1>
          <p className="muted">
            {store
              ? 'Se creó antes de que LanzaTienda guardara los datos para editarla. Puedes crear una nueva con los cambios y borrar esta.'
              : 'Puede que la hayas borrado o que sea de otra cuenta.'}
          </p>
          <Link href="/mis-tiendas" className="btn btn-primary">
            Volver a Mis tiendas
          </Link>
        </div>
      </div>
    );
  }

  return <Wizard user={me} name={name} initial={{ storeId: store.id, url: store.url, config: store.config }} />;
}
