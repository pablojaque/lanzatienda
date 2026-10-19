import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhook } from '@/lib/stripe';
import { advanceOrder, markPaid } from '@/lib/domainOrders';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Stripe nos avisa aquí cuando alguien paga, aunque cierre la página antes de volver
export async function POST(request) {
  let event;
  try {
    event = verifyWebhook(await request.text(), request.headers.get('stripe-signature'));
  } catch {
    return NextResponse.json({ error: 'Firma no válida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === 'paid') {
      const admin = createAdminClient();
      const { data: order } = await admin.from('domain_orders').select('*').eq('id', orderId).maybeSingle();
      if (order) {
        try {
          await advanceOrder(admin, await markPaid(admin, order, session.payment_intent));
        } catch (err) {
          // El pago ya consta; la compra se terminará cuando el usuario abra "Mis tiendas"
          console.error('webhook advance error', orderId, err);
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
