import { NextResponse } from 'next/server';
import { getOwnedStore, fail } from '@/lib/ownedStore';
import { normalizeDomain } from '@/lib/domains';
import { getDomainPrice, isDomainAvailable } from '@/lib/vercel';
import { MAX_DOMAIN_USD, retailCents } from '@/lib/domainPricing';
import { createCheckout, stripeEnabled } from '@/lib/stripe';
import { cleanContact } from '@/lib/contact';
import { ACTIVE_STATUSES } from '@/lib/domainOrders';

export const runtime = 'nodejs';

// Empieza la compra de un dominio: guarda el pedido y devuelve la página de pago de Stripe
export async function POST(request) {
  if (!stripeEnabled()) return fail('La compra de dominios todavía no está activada.', 503);

  const body = await request.json().catch(() => ({}));
  const { admin, store, user, error } = await getOwnedStore(body.storeId);
  if (error) return error;

  const domain = normalizeDomain(body.domain);
  if (!domain || domain.split('.').length !== 2) return fail('Ese dominio no es válido.');
  const { contact, error: contactError } = cleanContact(body.contact);
  if (contactError) return fail(contactError);

  // ¿Ya hay alguien comprándolo ahora mismo?
  const { data: busy } = await admin
    .from('domain_orders')
    .select('id')
    .eq('domain', domain)
    .in('status', ACTIVE_STATUSES)
    .limit(1);
  if (busy?.length) return fail('Ese dominio ya se está comprando. Prueba con otro.', 409);

  let price;
  try {
    if (!(await isDomainAvailable(domain))) return fail('Vaya, ese dominio ya no está libre. Prueba con otro.', 409);
    price = await getDomainPrice(domain);
  } catch (err) {
    console.error('domain buy check error', err);
    return fail('No hemos podido comprobar ese dominio. Inténtalo de nuevo.', 502);
  }
  if (!(price.purchaseUsd > 0) || price.purchaseUsd > MAX_DOMAIN_USD) return fail('Ese dominio no está a la venta aquí.');

  const priceCents = retailCents(price.purchaseUsd);
  const { data: order, error: dbError } = await admin
    .from('domain_orders')
    .insert({
      user_id: user.id,
      store_id: store.id,
      domain,
      price_cents: priceCents,
      vercel_price_usd: price.purchaseUsd,
      contact,
      status: 'pending_payment',
    })
    .select('id')
    .single();
  if (dbError) {
    console.error('domain order insert error', dbError);
    return fail('No hemos podido empezar la compra. Inténtalo de nuevo.', 500);
  }

  const origin = new URL(request.url).origin;
  try {
    const session = await createCheckout({
      orderId: order.id,
      name: `Dominio ${domain} (1 año)`,
      amountCents: priceCents,
      email: user.email,
      successUrl: `${origin}/mis-tiendas?pedido=${order.id}`,
      cancelUrl: `${origin}/mis-tiendas`,
    });
    await admin.from('domain_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('stripe checkout error', err);
    await admin.from('domain_orders').update({ status: 'canceled' }).eq('id', order.id);
    return fail('No hemos podido abrir el pago. Inténtalo de nuevo.', 502);
  }
}
