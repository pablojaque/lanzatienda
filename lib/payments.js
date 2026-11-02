import { getAccount } from '@/lib/stripe';

/** La cuenta de cobros de Stripe de un usuario (o null si aún no la ha creado). */
export async function getUserAccountId(admin, userId) {
  const { data } = await admin.from('stripe_accounts').select('account_id').eq('user_id', userId).maybeSingle();
  return data?.account_id || null;
}

/** Cómo va su cuenta: si ya puede cobrar o le faltan datos por rellenar en Stripe. */
export async function accountStatus(accountId) {
  if (!accountId) return { connected: false, ready: false };
  const a = await getAccount(accountId);
  return { connected: true, ready: !!a.charges_enabled, submitted: !!a.details_submitted };
}

// Comisión opcional de Dropshype por cada venta de las tiendas (por defecto, ninguna)
export const STORE_FEE_PERCENT = Math.min(20, Math.max(0, Number(process.env.STORE_FEE_PERCENT) || 0));

// Países a los que las tiendas pueden enviar (Stripe pide la dirección de envío al pagar)
export const SHIPPING_COUNTRIES = ['ES', 'PT', 'FR', 'IT', 'DE', 'NL', 'BE', 'AT', 'IE', 'LU', 'GB', 'US', 'MX', 'AR', 'CO', 'CL', 'PE'];
