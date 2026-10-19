// Países que ofrecemos para el titular del dominio, con su prefijo de teléfono
export const COUNTRIES = [
  ['ES', 'España', '34'],
  ['MX', 'México', '52'],
  ['AR', 'Argentina', '54'],
  ['CO', 'Colombia', '57'],
  ['CL', 'Chile', '56'],
  ['PE', 'Perú', '51'],
  ['EC', 'Ecuador', '593'],
  ['UY', 'Uruguay', '598'],
  ['VE', 'Venezuela', '58'],
  ['US', 'Estados Unidos', '1'],
  ['PT', 'Portugal', '351'],
  ['FR', 'Francia', '33'],
  ['IT', 'Italia', '39'],
  ['DE', 'Alemania', '49'],
  ['GB', 'Reino Unido', '44'],
];

const FIELDS = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country'];

/**
 * Limpia los datos del titular que manda el navegador. Devuelve { contact } o { error }.
 * El teléfono va en el formato que piden los registros de dominios: +34.612345678
 */
export function cleanContact(input = {}) {
  const c = {};
  for (const f of FIELDS) c[f] = String(input[f] || '').trim().slice(0, 120);
  if (FIELDS.some((f) => !c[f])) return { error: 'Rellena todos los datos del titular del dominio.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return { error: 'El email no es válido.' };

  const country = COUNTRIES.find(([code]) => code === c.country);
  if (!country) return { error: 'Elige un país de la lista.' };

  let digits = c.phone.replace(/[^\d+]/g, '');
  let dial = country[2];
  if (digits.startsWith('+')) {
    const own = COUNTRIES.map((x) => x[2]).find((d) => digits.startsWith(`+${d}`));
    if (own) dial = own;
    digits = digits.slice(1 + (own ? own.length : 0));
  } else if (digits.startsWith('00')) {
    return { error: 'Escribe el teléfono sin el 00 delante, o empezando por +.' };
  }
  digits = digits.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 14) return { error: 'El teléfono no es válido.' };
  c.phone = `+${dial}.${digits}`;
  return { contact: c };
}
