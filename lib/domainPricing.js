// Lo que paga el usuario por un dominio: lo que cuesta en Vercel (en dólares), pasado a euros, más tu margen.
const USD_TO_EUR = Number(process.env.DOMAIN_USD_TO_EUR) || 0.95;
const MARGIN_EUR = Number(process.env.DOMAIN_MARGIN_EUR ?? 3);
// Los dominios "premium" pueden costar cientos de dólares: por encima de esto no se venden
export const MAX_DOMAIN_USD = Number(process.env.DOMAIN_MAX_USD) || 40;

/** Precio final en céntimos de euro, redondeado hacia arriba a ,99 (p. ej. 14,99 €). */
export function retailCents(usd) {
  const eur = usd * USD_TO_EUR + MARGIN_EUR;
  return Math.max(99, Math.ceil(eur) * 100 - 1);
}

export const formatEur = (cents) => (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
