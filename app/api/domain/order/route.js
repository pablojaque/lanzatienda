import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { advanceOrder, publicOrder } from '@/lib/domainOrders';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Cómo va la compra de un dominio (y la empuja: comprueba el pago, compra y conecta)
export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin.from('domain_orders').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!order) return NextResponse.json({ error: 'No encontramos esa compra.' }, { status: 404 });

  try {
    return NextResponse.json(publicOrder(await advanceOrder(admin, order)));
  } catch (err) {
    console.error('domain order advance error', id, err);
    return NextResponse.json(publicOrder(order));
  }
}
