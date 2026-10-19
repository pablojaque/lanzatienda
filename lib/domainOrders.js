import { addDomain, buyDomain, getDomainOrder, getDomainPrice, getProjectDomain } from '@/lib/vercel';
import { getCheckout, refund } from '@/lib/stripe';
import { detachDomain } from '@/lib/projectDomains';

/**
 * Vida de una compra de dominio:
 *   pending_payment → (paga en Stripe) → paid → buying (pedido a Vercel) → bought → connected
 * Si algo falla después de pagar: failed, y se le devuelve el dinero solo.
 * Cada paso se puede repetir sin peligro: lo mueven el aviso de Stripe y la propia página al consultar.
 */

// Si el precio en Vercel sube más que esto desde que pagó, no compramos y devolvemos el dinero
const PRICE_TOLERANCE_USD = 0.5;

export const ACTIVE_STATUSES = ['paid', 'buying', 'bought'];

/** Cambia el estado solo si sigue en `from` (así dos avisos a la vez no compran dos veces). */
async function transition(admin, order, from, changes) {
  const { data } = await admin
    .from('domain_orders')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('status', from)
    .select('*')
    .maybeSingle();
  if (data) return { order: data, won: true };
  const { data: fresh } = await admin.from('domain_orders').select('*').eq('id', order.id).single();
  return { order: fresh, won: false };
}

async function failAndRefund(admin, order, from, reason) {
  console.error('domain order failed', order.id, order.domain, reason);
  let refunded = false;
  if (order.stripe_payment_intent) {
    refunded = await refund(order.stripe_payment_intent)
      .then(() => true)
      .catch((err) => (console.error('refund error', order.id, err), false));
  }
  const error = refunded
    ? 'No hemos podido comprar el dominio. Te hemos devuelto el dinero (tarda 5-10 días en verse en tu banco).'
    : 'No hemos podido comprar el dominio. Escríbenos y te devolvemos el dinero.';
  return (await transition(admin, order, from, { status: 'failed', error, refunded })).order;
}

/** Stripe nos confirma el pago (por aviso o porque lo preguntamos). */
export async function markPaid(admin, order, paymentIntent) {
  if (order.status !== 'pending_payment') return order;
  return (await transition(admin, order, 'pending_payment', { status: 'paid', stripe_payment_intent: paymentIntent }))
    .order;
}

async function startPurchase(admin, order) {
  const claim = await transition(admin, order, 'paid', { status: 'buying' });
  if (!claim.won) return claim.order;
  order = claim.order;

  try {
    const price = await getDomainPrice(order.domain);
    if (!(price.purchaseUsd > 0) || price.purchaseUsd > Number(order.vercel_price_usd) + PRICE_TOLERANCE_USD) {
      return failAndRefund(admin, order, 'buying', `price changed to ${price.purchaseUsd}`);
    }
    const res = await buyDomain(order.domain, { expectedPrice: price.purchaseUsd, contact: order.contact });
    const { data } = await admin
      .from('domain_orders')
      .update({ vercel_order_id: res.orderId, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*')
      .single();
    return data;
  } catch (err) {
    return failAndRefund(admin, order, 'buying', err.message);
  }
}

async function checkPurchase(admin, order) {
  if (!order.vercel_order_id) return order;
  const vo = await getDomainOrder(order.vercel_order_id);
  const domains = vo.domains || [];
  const failed = /fail|error|cancel/i.test(vo.status || '') || domains.some((d) => d.error || /fail|error/i.test(d.status || ''));
  const done =
    /complet|success/i.test(vo.status || '') || (domains.length && domains.every((d) => /complet|success/i.test(d.status || '')));

  if (failed) return failAndRefund(admin, order, 'buying', JSON.stringify(vo));
  if (done) return (await transition(admin, order, 'buying', { status: 'bought' })).order;
  return order;
}

/** El dominio ya es nuestro: lo ponemos en la tienda. Al estar en la misma cuenta de Vercel, no hace falta tocar DNS. */
async function connect(admin, order) {
  const { data: store } = await admin.from('stores').select('id, project_name, domain').eq('id', order.store_id).single();

  if (store.domain && store.domain !== order.domain) {
    await detachDomain(store.project_name, store.domain);
    await admin.from('stores').update({ domain: null }).eq('id', store.id);
  }
  await addDomain(store.project_name, order.domain).catch(async (err) => {
    if (err.status === 409 && (await getProjectDomain(store.project_name, order.domain).catch(() => null))) return;
    throw err;
  });
  await addDomain(store.project_name, `www.${order.domain}`, order.domain).catch(() => {});

  const { error } = await admin.from('stores').update({ domain: order.domain }).eq('id', store.id);
  if (error) throw error;
  return (await transition(admin, order, 'bought', { status: 'connected', error: null })).order;
}

/** Avanza la compra todo lo que se pueda ahora mismo. */
export async function advanceOrder(admin, order) {
  if (order.status === 'pending_payment' && order.stripe_session_id) {
    const session = await getCheckout(order.stripe_session_id);
    if (session.payment_status === 'paid') order = await markPaid(admin, order, session.payment_intent);
    else if (session.status === 'expired') order = (await transition(admin, order, 'pending_payment', { status: 'canceled' })).order;
  }
  if (order.status === 'paid') order = await startPurchase(admin, order);
  if (order.status === 'buying') order = await checkPurchase(admin, order);
  if (order.status === 'bought') {
    // Si falla, se queda en "bought" y se reintenta en la próxima consulta (el dominio ya está comprado)
    order = await connect(admin, order).catch((err) => (console.error('domain connect after buy', order.id, err), order));
  }
  return order;
}

/** Lo que ve el usuario de su compra (sin datos personales). */
export const publicOrder = (o) => ({ id: o.id, domain: o.domain, status: o.status, error: o.error || null });
