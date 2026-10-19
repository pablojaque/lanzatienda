import crypto from 'node:crypto';

const API = 'https://api.stripe.com/v1';

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

/** Convierte { a: { b: 1 } } en a[b]=1, que es como Stripe recibe los datos. */
function encode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object') encode(value, name, out);
    else out.append(name, String(value));
  }
  return out;
}

async function call(path, { method = 'GET', body, idempotencyKey } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY en las variables de entorno.');
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: body ? encode(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Stripe respondió ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Página de pago de Stripe para un único concepto. Devuelve la sesión (con su `url`). */
export function createCheckout({ orderId, name, amountCents, email, successUrl, cancelUrl }) {
  return call('/checkout/sessions', {
    method: 'POST',
    idempotencyKey: `checkout-${orderId}`,
    body: {
      mode: 'payment',
      customer_email: email,
      client_reference_id: orderId,
      metadata: { orderId },
      line_items: { 0: { quantity: 1, price_data: { currency: 'eur', unit_amount: amountCents, product_data: { name } } } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
  });
}

export function getCheckout(sessionId) {
  return call(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

/** Devuelve el dinero de un pago (si ya se devolvió, Stripe no lo repite). */
export function refund(paymentIntent) {
  return call('/refunds', { method: 'POST', idempotencyKey: `refund-${paymentIntent}`, body: { payment_intent: paymentIntent } });
}

/** Comprueba que un aviso (webhook) viene de verdad de Stripe y lo devuelve ya leído. */
export function verifyWebhook(rawBody, signatureHeader, toleranceSec = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Falta STRIPE_WEBHOOK_SECRET');
  const parts = Object.fromEntries(
    String(signatureHeader || '')
      .split(',')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2)
  );
  const signatures = String(signatureHeader || '')
    .split(',')
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) throw new Error('Firma no válida');

  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const ok = signatures.some(
    (s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
  );
  if (!ok) throw new Error('Firma no válida');
  return JSON.parse(rawBody);
}
