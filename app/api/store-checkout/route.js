import { createAdminClient } from '@/lib/supabase/admin';
import { computeOrder } from '@/lib/storeConfig';
import { createStoreCheckout, getAccount, stripeEnabled } from '@/lib/stripe';
import { SHIPPING_COUNTRIES, STORE_FEE_PERCENT, getUserAccountId } from '@/lib/payments';

export const runtime = 'nodejs';

// Las tiendas están en otros dominios: dejamos que nos llamen desde cualquiera
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (data, status = 200) => Response.json(data, { status, headers: CORS });
// Sin cobro con tarjeta: la tienda usa su enlace de pago o el pedido por email
const fallback = (error) => json({ fallback: true, error });

/** Solo volvemos a direcciones de la propia tienda tras pagar. */
function backUrl(back, store) {
  const hosts = [`${store.project_name}.vercel.app`];
  try {
    hosts.push(new URL(store.url).host);
  } catch {}
  if (store.domain) hosts.push(store.domain, `www.${store.domain}`);
  try {
    const u = new URL(back);
    if (u.protocol === 'https:' && hosts.includes(u.host)) return `${u.origin}${u.pathname}`;
  } catch {}
  return `${store.url || `https://${hosts[0]}`}/`;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// La tienda pide aquí el pago con tarjeta de un pedido; respondemos con la página de pago de Stripe
export async function POST(request) {
  let body;
  try {
    body = JSON.parse((await request.text()).slice(0, 4000));
  } catch {
    return json({ error: 'Pedido no válido.' }, 400);
  }
  if (typeof body?.p !== 'string' || !/^[a-z0-9-]{3,60}$/.test(body.p)) return json({ error: 'Pedido no válido.' }, 400);
  if (!stripeEnabled()) return fallback();

  const admin = createAdminClient();
  const { data: store } = await admin
    .from('stores')
    .select('id, user_id, project_name, url, domain, store_name, config')
    .eq('project_name', body.p)
    .maybeSingle();
  if (!store?.config) return fallback();

  const accountId = await getUserAccountId(admin, store.user_id);
  if (!accountId) return fallback();

  // Precios siempre desde lo guardado, nunca desde lo que diga el navegador
  const order = computeOrder(store.config, { product: body.product, qty: body.qty, addons: body.addons, variant: body.variant });
  if (!order || order.total < 50) return json({ error: 'Ese pedido no es válido.' }, 400);

  try {
    const account = await getAccount(accountId);
    if (!account.charges_enabled) return fallback('Esta tienda todavía no acepta pagos con tarjeta.');

    const back = backUrl(body.back, store);
    const summary = order.lines.map((l) => `${l.qty} x ${l.name}`).join(' · ');
    const fee = Math.round((order.total * STORE_FEE_PERCENT) / 100);
    const session = await createStoreCheckout(accountId, {
      mode: 'payment',
      locale: 'es',
      line_items: order.lines.map((l) => ({
        quantity: l.qty,
        price_data: { currency: 'eur', unit_amount: l.cents, product_data: { name: l.name } },
      })),
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      // Cupones: el dueño los crea en su panel de Stripe
      ...((store.config.upsells || []).includes('promoCodes') ? { allow_promotion_codes: true } : {}),
      success_url: `${back}?pedido=ok`,
      cancel_url: back,
      metadata: { storeId: store.id, items: summary.slice(0, 480) },
      payment_intent_data: {
        description: `${store.store_name}: ${summary}`.slice(0, 900),
        metadata: { storeId: store.id },
        ...(fee > 0 ? { application_fee_amount: fee } : {}),
      },
    });
    return json({ url: session.url });
  } catch (err) {
    console.error('store checkout error', store.id, err);
    return json({ error: 'No se pudo abrir el pago. Inténtalo de nuevo.' }, 502);
  }
}
