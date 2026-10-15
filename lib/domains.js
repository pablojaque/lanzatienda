/**
 * Limpia lo que escribe el usuario y devuelve el dominio, o null si no es válido.
 * "https://www.MiTienda.com/" → "mitienda.com" · "tienda.midominio.es" → "tienda.midominio.es"
 * Funciona igual en el navegador y en el servidor.
 */
export function normalizeDomain(input) {
  let raw = String(input || '').trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;

  let host;
  try {
    host = new URL(raw).hostname; // también convierte dominios con ñ o tildes (punycode)
  } catch {
    return null;
  }
  host = host.replace(/\.$/, '');
  if (host.startsWith('www.')) host = host.slice(4);

  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(host)) return null;
  // Los dominios de Vercel no se pueden conectar
  if (/(^|\.)vercel\.(app|com)$/.test(host)) return null;
  return host;
}
