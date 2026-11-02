import { UPSELLS } from './storeOptions';

// Todo lo que define una tienda se guarda en stores.config y se usa para
// pintarla, para editarla y para calcular lo que paga el cliente en el cobro con Stripe.

export const MAX_PRODUCTS = 12;
export const MAX_PHOTOS = 4;
export const BUNDLES = [
  { qty: 1, off: 0, sub: 'Para probarlo' },
  { qty: 2, off: 10, sub: 'El más elegido' },
  { qty: 3, off: 20, sub: 'Mejor precio' },
];

export const newProductId = () => Math.random().toString(36).slice(2, 8);

export function slugify(s, fallback = 'tienda') {
  return (
    String(s || fallback)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || fallback
  );
}

/** Dónde vive cada foto dentro de la tienda publicada (el nombre sale de su sha). */
export const imagePath = (sha) => `/img/${sha.slice(0, 16)}.jpg`;
/** Dirección de la página de cada producto cuando la tienda tiene varios. */
export const productPath = (p) => `/p/${slugify(p.name, 'producto')}-${p.id}/`;

/**
 * Tiendas antiguas (un solo producto con los datos sueltos) → formato nuevo con lista de productos.
 * No toca las que ya están en el formato nuevo.
 */
export function normalizeConfig(c = {}) {
  if (Array.isArray(c.products)) return c;
  const { productName, price, comparePrice, description, images, ...rest } = c;
  return {
    ...rest,
    products: [{ id: 'p1', name: productName || '', price, comparePrice, description, images: images || [] }],
  };
}

const str = (v, max) => String(v ?? '').trim().slice(0, max);
const num = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Limpia y valida lo que manda el navegador. Devuelve { config } o { error }. */
export function sanitizeConfig(input) {
  const c = normalizeConfig(input || {});
  const products = (Array.isArray(c.products) ? c.products : []).slice(0, MAX_PRODUCTS).map((p) => ({
    id: /^[a-z0-9]{1,12}$/.test(p?.id) ? p.id : newProductId(),
    name: str(p?.name, 80),
    price: num(p?.price),
    comparePrice: num(p?.comparePrice),
    description: str(p?.description, 1500),
    images: (Array.isArray(p?.images) ? p.images : [])
      .slice(0, MAX_PHOTOS)
      .filter((i) => /^[0-9a-f]{40}$/.test(i?.sha) && Number(i?.size) > 0 && Number(i.size) < 2e6)
      .map((i) => ({ sha: i.sha, size: Number(i.size) })),
  }));

  const config = {
    storeName: str(c.storeName, 40),
    color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#111111',
    font: str(c.font, 40),
    upsells: (Array.isArray(c.upsells) ? c.upsells : []).filter((id) => UPSELLS.some((u) => u.id === id)),
    paymentLink: str(c.paymentLink, 500),
    contactEmail: str(c.contactEmail, 120),
    products,
  };

  if (!config.storeName) return { error: 'Falta el nombre de la tienda.' };
  if (!products.length) return { error: 'Añade al menos un producto.' };
  for (const [i, p] of products.entries()) {
    const which = products.length > 1 ? ` (producto ${i + 1})` : '';
    if (!p.name) return { error: `Falta el nombre del producto${which}.` };
    if (!p.price) return { error: `Falta el precio del producto${which}.` };
    if (!p.images.length) return { error: `Falta al menos una foto del producto${which}.` };
  }
  if (config.paymentLink && !/^https:\/\//.test(config.paymentLink)) {
    return { error: 'El enlace de pago debe empezar por https://' };
  }
  return { config };
}

/**
 * Lo que cuesta un pedido según la configuración guardada (nunca según lo que diga el navegador).
 * Devuelve las líneas para Stripe en céntimos, o null si el pedido no es válido.
 */
export function computeOrder(config, { product: productId, qty, addons } = {}) {
  const c = normalizeConfig(config);
  const product = c.products.find((p) => p.id === productId);
  if (!product || !(Number(product.price) > 0)) return null;
  const has = (id) => (c.upsells || []).includes(id);

  const q = Math.round(Number(qty) || 1);
  let off = 0;
  if (has('bundles')) {
    const bundle = BUNDLES.find((b) => b.qty === q);
    if (!bundle) return null;
    off = bundle.off;
  } else if (q < 1 || q > 10) return null;

  const unit = Math.round(Number(product.price) * (1 - off / 100) * 100);
  const lines = [{ name: product.name + (off ? ` (pack -${off}%)` : ''), cents: unit, qty: q }];
  for (const id of Array.isArray(addons) ? addons : []) {
    const extra = UPSELLS.find((u) => u.id === id && u.price && has(u.id));
    if (extra && !lines.some((l) => l.id === id)) lines.push({ id, name: extra.title, cents: Math.round(extra.price * 100), qty: 1 });
  }
  const total = lines.reduce((t, l) => t + l.cents * l.qty, 0);
  return { product, lines, total };
}
