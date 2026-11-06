import { DEFAULT_BUNDLE_OFFS, DEFAULT_SHIPPING_DAYS, UPSELLS } from './storeOptions';

// Todo lo que define una tienda se guarda en stores.config y se usa para
// pintarla, para editarla y para calcular lo que paga el cliente en el cobro con Stripe.

export const MAX_PRODUCTS = 12;
export const MAX_PHOTOS = 4;
export const MAX_BENEFITS = 5;
export const MAX_VARIANT_VALUES = 12;
export const MAX_CUSTOM_ADDONS = 4;
export const MAX_REVIEWS = 12;
export const MAX_FAQ = 10;
export const MAX_CUSTOM_CODE = 20000;

const BUNDLE_SUBS = ['Para probarlo', 'El más elegido', 'Mejor precio'];

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

/** Páginas legales que lleva toda tienda (las piden TikTok y Meta para anunciarse). */
export const POLICIES = [
  { id: 'envios', title: 'Envíos' },
  { id: 'devoluciones', title: 'Devoluciones' },
  { id: 'privacidad', title: 'Privacidad' },
];

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

/** Los packs de la tienda: 1, 2 y 3 unidades con el descuento que eligió el dueño. */
export function bundlesOf(config) {
  const offs = Array.isArray(config?.bundleOffs) ? config.bundleOffs : DEFAULT_BUNDLE_OFFS;
  return [0, ...offs.slice(0, 2)].map((off, i) => ({ qty: i + 1, off: Number(off) || 0, sub: BUNDLE_SUBS[i] }));
}

/** Extras que se pueden añadir al pedido: los de la lista que estén activados + los propios del dueño. */
export function addonsOf(config) {
  const has = (id) => (config?.upsells || []).includes(id);
  const builtIn = UPSELLS.filter((u) => u.price && has(u.id)).map((u) => ({ id: u.id, title: u.title, price: u.price }));
  const custom = (config?.customAddons || [])
    .map((a) => ({ id: `x_${a.id}`, title: String(a.title || '').trim(), price: Math.round(Number(a.price) * 100) / 100 }))
    .filter((a) => a.title && a.price > 0);
  return [...builtIn, ...custom];
}

/** Precio por unidad en céntimos con el descuento del pack (igual en la tienda y en el cobro). */
export const unitCents = (price, off) => Math.round(Number(price) * (1 - off / 100) * 100);

const str = (v, max) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const num = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const int = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const image = (i) =>
  /^[0-9a-f]{40}$/.test(i?.sha) && Number(i?.size) > 0 && Number(i.size) < 2e6 ? { sha: i.sha, size: Number(i.size) } : null;
// Etiquetas que nunca pueden ir en el código personalizado (ejecutan código o cargan otras páginas)
const BLOCKED_TAGS =
  'script|iframe|frame|frameset|object|embed|applet|form|input|button|textarea|select|base|meta|link|svg|math|template|noscript|portal';

/** Estilos propios de la tienda: CSS sin forma de salirse de su bloque ni cargar hojas de fuera. */
export function cleanCss(v) {
  let css = String(v ?? '').slice(0, MAX_CUSTOM_CODE);
  let prev;
  do {
    prev = css;
    css = css
      .replace(/<\/?\s*style/gi, '')
      .replace(/<!--|-->/g, '')
      .replace(/@import[^;]*;?/gi, '')
      .replace(/expression\s*\(|javascript:|behavior\s*:/gi, '');
  } while (css !== prev);
  return css.trim();
}

// Una dirección dentro del bloque propio solo puede ser web (https), del propio sitio, email o teléfono
const SAFE_URL = /^(https?:|mailto:|tel:|#|\/|\.|[^:]*$)/i;
const decodeEntities = (v) =>
  v
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16) || 32))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d) || 32))
    .replace(/&(colon|tab|newline);?/gi, (_, n) => ({ colon: ':', tab: '\t', newline: '\n' })[n.toLowerCase()]);
const safeUrl = (raw) => {
  const quote = /^["']/.test(raw) ? raw[0] : '';
  const value = decodeEntities(quote ? raw.slice(1, -1) : raw).replace(/[\u0000-\u0020]/g, '');
  return SAFE_URL.test(value) ? raw : `${quote || '"'}#${quote || '"'}`;
};

/** Bloque HTML propio de la tienda: solo maquetación, sin scripts, formularios ni eventos. */
export function cleanHtml(v) {
  let h = String(v ?? '').slice(0, MAX_CUSTOM_CODE);
  let prev;
  // Se repite hasta que no cambia, para que no se cuele nada escondido dentro de otra etiqueta
  do {
    prev = h;
    h = h
      .replace(/<!--[\s\S]*?(-->|$)/g, '')
      .replace(new RegExp(`<\\s*(${BLOCKED_TAGS})\\b[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi'), '')
      .replace(new RegExp(`<\\s*\\/?\\s*(${BLOCKED_TAGS})\\b[^>]*>?`, 'gi'), '')
      .replace(/[\s/"'](on[a-z]+|srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, (m) => m[0].trim())
      .replace(
        /([\s/"'](?:href|src|xlink:href|action|poster|background|srcset|data)\s*=\s*)("[^"]*"|'[^']*'|[^\s>]*)/gi,
        (_, attr, value) => attr + safeUrl(value)
      );
  } while (h !== prev);
  return h.trim();
}

const handle = (v) =>
  str(v, 60)
    .replace(/^@/, '')
    .replace(/[^A-Za-z0-9._]/g, '');

/** Limpia y valida lo que manda el navegador. Devuelve { config } o { error }. */
export function sanitizeConfig(input) {
  const c = normalizeConfig(input || {});
  const products = list(c.products, MAX_PRODUCTS).map((p) => {
    const values = [
      ...new Set(
        list(p?.variant?.values, MAX_VARIANT_VALUES)
          .map((v) => str(v, 40))
          .filter(Boolean)
      ),
    ];
    return {
      id: /^[a-z0-9]{1,12}$/.test(p?.id) ? p.id : newProductId(),
      name: str(p?.name, 80),
      price: num(p?.price),
      comparePrice: num(p?.comparePrice),
      description: str(p?.description, 1500),
      benefits: list(p?.benefits, MAX_BENEFITS)
        .map((b) => str(b, 90))
        .filter(Boolean),
      // Una opción a elegir (talla, color…); solo cuenta si tiene al menos dos valores
      variant: values.length > 1 ? { name: str(p?.variant?.name, 30) || 'Opción', values } : null,
      images: list(p?.images, MAX_PHOTOS).map(image).filter(Boolean),
    };
  });

  const shipMin = int(c.shipping?.min, 1, 60, DEFAULT_SHIPPING_DAYS.min);
  const config = {
    storeName: str(c.storeName, 40),
    color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#111111',
    font: str(c.font, 40),
    theme: c.theme === 'dark' ? 'dark' : 'light',
    buttonStyle: ['rounded', 'pill', 'square'].includes(c.buttonStyle) ? c.buttonStyle : 'rounded',
    logo: image(c.logo),
    tagline: str(c.tagline, 120),
    announcement: str(c.announcement, 120),
    upsells: list(c.upsells, 40).filter((id) => UPSELLS.some((u) => u.id === id)),
    bundleOffs: [0, 1].map((i) => int(c.bundleOffs?.[i], 0, 60, [10, 20][i])),
    customAddons: list(c.customAddons, MAX_CUSTOM_ADDONS)
      .map((a) => ({
        id: /^[a-z0-9]{1,12}$/.test(a?.id) ? a.id : newProductId(),
        title: str(a?.title, 60),
        price: num(a?.price),
      }))
      .filter((a) => a.title && a.price),
    shipping: { min: shipMin, max: int(c.shipping?.max, shipMin, 90, Math.max(shipMin, DEFAULT_SHIPPING_DAYS.max)) },
    reviews: list(c.reviews, MAX_REVIEWS)
      .map((r) => ({ name: str(r?.name, 40), text: str(r?.text, 400), rating: int(r?.rating, 1, 5, 5) }))
      .filter((r) => r.name && r.text),
    faq: list(c.faq, MAX_FAQ)
      .map((f) => ({ q: str(f?.q, 150), a: str(f?.a, 800) }))
      .filter((f) => f.q && f.a),
    paymentLink: str(c.paymentLink, 500),
    contactEmail: str(c.contactEmail, 120),
    whatsapp: str(c.whatsapp, 20).replace(/[^\d]/g, ''),
    social: { instagram: handle(c.social?.instagram), tiktok: handle(c.social?.tiktok) },
    // Píxeles de anuncios: solo el identificador, con su formato exacto (nada de código)
    pixels: {
      meta: /^\d{5,20}$/.test(str(c.pixels?.meta, 20)) ? str(c.pixels.meta, 20) : '',
      tiktok: /^[A-Z0-9]{10,30}$/i.test(str(c.pixels?.tiktok, 30)) ? str(c.pixels.tiktok, 30).toUpperCase() : '',
      ga: /^G-[A-Z0-9]{4,15}$/i.test(str(c.pixels?.ga, 20)) ? str(c.pixels.ga, 20).toUpperCase() : '',
    },
    seo: { title: str(c.seo?.title, 70), description: str(c.seo?.description, 160) },
    // Lo que añade el asistente de IA (o el dueño a mano): estilos y un bloque propio en la portada
    customCss: cleanCss(c.customCss),
    customHtml: cleanHtml(c.customHtml),
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
  if (config.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)) {
    return { error: 'El email de contacto no es válido.' };
  }
  if (config.whatsapp && (config.whatsapp.length < 8 || config.whatsapp.length > 15)) {
    return { error: 'El WhatsApp debe llevar el prefijo del país, por ejemplo 34600123456.' };
  }
  return { config };
}

/**
 * Lo que cuesta un pedido según la configuración guardada (nunca según lo que diga el navegador).
 * Devuelve las líneas para Stripe en céntimos, o null si el pedido no es válido.
 */
export function computeOrder(config, { product: productId, qty, addons, variant } = {}) {
  const c = normalizeConfig(config);
  const product = c.products.find((p) => p.id === productId);
  if (!product || !(Number(product.price) > 0)) return null;
  const has = (id) => (c.upsells || []).includes(id);

  // Si el producto tiene opciones (talla, color…), tiene que venir una de ellas
  let chosen = '';
  if (product.variant?.values?.length) {
    if (!product.variant.values.includes(variant)) return null;
    chosen = ` · ${product.variant.name}: ${variant}`;
  }

  const q = Math.round(Number(qty) || 1);
  let off = 0;
  if (has('bundles')) {
    const bundle = bundlesOf(c).find((b) => b.qty === q);
    if (!bundle) return null;
    off = bundle.off;
  } else if (q < 1 || q > 10) return null;

  const lines = [{ name: product.name + chosen + (off ? ` (pack -${off}%)` : ''), cents: unitCents(product.price, off), qty: q }];
  const available = addonsOf(c);
  for (const id of Array.isArray(addons) ? addons : []) {
    const extra = available.find((a) => a.id === id);
    if (extra && !lines.some((l) => l.id === id))
      lines.push({ id, name: extra.title, cents: Math.round(extra.price * 100), qty: 1 });
  }
  const total = lines.reduce((t, l) => t + l.cents * l.qty, 0);
  return { product, lines, total, variant: chosen ? variant : null };
}
