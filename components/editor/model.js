import {
  COLORS,
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_BUNDLE_OFFS,
  DEFAULT_FAQ,
  DEFAULT_SHIPPING_DAYS,
  DEFAULT_UPSELLS,
  FONTS,
} from '@/lib/storeOptions';
import { MAX_PHOTOS, imagePath, newProductId, normalizeConfig } from '@/lib/storeConfig';

// Cómo se pasa de lo guardado en la tienda al estado del editor, y del editor a la configuración que se publica

export const padPhotos = (images) => [...images, ...Array(MAX_PHOTOS).fill(null)].slice(0, MAX_PHOTOS);

export const emptyProduct = () => ({
  id: newProductId(),
  name: '',
  price: '',
  comparePrice: '',
  description: '',
  benefits: [],
  variantName: '',
  variantValues: '',
  images: padPhotos([]),
});

/** Foto ya publicada → foto del editor (se ve desde la tienda). */
const savedImage = (img, url) => ({ key: img.sha, src: url + imagePath(img.sha), sha: img.sha, size: img.size, status: 'ok' });

export function newStore() {
  return {
    storeName: '',
    tagline: '',
    contactEmail: '',
    paymentLink: '',
    whatsapp: '',
    social: { instagram: '', tiktok: '' },
    pixels: { meta: '', tiktok: '', ga: '' },
    seo: { title: '', description: '' },
    color: COLORS[0].value,
    font: FONTS[0].name,
    theme: 'light',
    buttonStyle: 'rounded',
    logo: null,
    announcement: DEFAULT_ANNOUNCEMENT,
    upsells: DEFAULT_UPSELLS,
    bundleOffs: [...DEFAULT_BUNDLE_OFFS],
    shipping: { ...DEFAULT_SHIPPING_DAYS },
    customAddons: [],
    reviews: [],
    faq: DEFAULT_FAQ.map((f) => ({ ...f })),
    customCss: '',
    customHtml: '',
  };
}

/** Al editar: lo guardado → el estado del editor (rellenando lo que las tiendas antiguas no tenían). */
export function fromSaved(config, url) {
  const c = normalizeConfig(config);
  const base = newStore();
  const store = {
    ...base,
    ...Object.fromEntries(Object.entries(c).filter(([k, v]) => k in base && v != null && k !== 'products')),
    social: { ...base.social, ...c.social },
    pixels: { ...base.pixels, ...c.pixels },
    seo: { ...base.seo, ...c.seo },
    shipping: { ...base.shipping, ...c.shipping },
    announcement: c.announcement || base.announcement,
    faq: c.faq?.length ? c.faq : base.faq,
    logo: c.logo ? savedImage(c.logo, url) : null,
  };
  const products = c.products.map((p) => ({
    ...emptyProduct(),
    id: p.id,
    name: p.name || '',
    price: p.price ? String(p.price) : '',
    comparePrice: p.comparePrice ? String(p.comparePrice) : '',
    description: p.description || '',
    benefits: p.benefits || [],
    variantName: p.variant?.name || '',
    variantValues: (p.variant?.values || []).join(', '),
    images: padPhotos((p.images || []).map((img) => savedImage(img, url))),
  }));
  return { store, products };
}

/** Qué le falta a un producto para poder publicarlo (o null si está completo). */
export function missingOf(p) {
  if (p.images.some((i) => i?.status === 'uploading')) return 'Subiendo fotos…';
  if (!p.images.some((i) => i?.status === 'ok')) return 'Falta al menos una foto';
  if (!p.name.trim()) return 'Falta el nombre';
  if (!(Number(p.price) > 0)) return 'Falta el precio';
  return null;
}
export const productReady = (p) => !missingOf(p);

/**
 * Estado del editor → configuración de la tienda.
 * preview: las fotos llevan su `src` para pintarlas; si no, solo sha y tamaño (lo que se publica).
 */
export function buildConfig(store, products, { preview = false } = {}) {
  const photo = (i) => (preview ? i && i.status !== 'error' : i?.status === 'ok');
  const pack = (i) => (preview ? i : { sha: i.sha, size: i.size });
  return {
    ...store,
    logo: store.logo && photo(store.logo) ? pack(store.logo) : null,
    products: products.map((p) => {
      const values = p.variantValues
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice,
        description: p.description,
        benefits: p.benefits.map((b) => b.trim()).filter(Boolean),
        variant: values.length > 1 ? { name: p.variantName.trim() || 'Opción', values } : null,
        images: p.images.filter(photo).map(pack),
      };
    }),
  };
}

/** Lo que ve el asistente de IA: la tienda sin fotos (solo cuántas hay) ni datos de cobro. */
export function aiState(store, products) {
  const { logo, paymentLink, pixels, ...rest } = store;
  return {
    ...rest,
    tieneLogo: !!logo,
    productos: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      comparePrice: Number(p.comparePrice) || 0,
      description: p.description,
      benefits: p.benefits,
      variantName: p.variantName,
      variantValues: p.variantValues,
      fotos: p.images.filter(Boolean).length,
    })),
  };
}

/** Aplica la lista de productos del asistente sin perder las fotos de los que ya existían. */
export function mergeAiProducts(prev, list) {
  return list.map((p) => {
    const old = p.id && prev.find((o) => o.id === p.id);
    return { ...(old || emptyProduct()), ...p, id: old ? old.id : newProductId() };
  });
}
