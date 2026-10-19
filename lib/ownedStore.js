import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

/** Comprueba la sesión y que la tienda sea del usuario. */
export async function getOwnedStore(storeId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: fail('Tu sesión ha caducado. Vuelve a iniciar sesión.', 401) };
  if (!/^[0-9a-f-]{36}$/i.test(storeId || '')) return { error: fail('Tienda no válida.') };

  const admin = createAdminClient();
  const { data: store } = await admin
    .from('stores')
    .select('id, project_name, domain')
    .eq('id', storeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!store) return { error: fail('No encontramos esa tienda en tu cuenta.', 404) };
  return { admin, store, user };
}
