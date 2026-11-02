import { BUTTON_STYLES, DEFAULT_ANNOUNCEMENT, DEFAULT_FAQ, DEFAULT_SHIPPING_DAYS, FONTS } from './storeOptions';
import { POLICIES, addonsOf, bundlesOf, normalizeConfig, productPath, unitCents } from './storeConfig';

// Letra del texto normal cuando la elegida es decorativa (manuscrita, solo mayúsculas…)
const BODY_FONT = { family: "'Inter', sans-serif", google: 'Inter:wght@400;600;800' };

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const money = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const paragraphs = (text) =>
  esc(text)
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');

// Texto blanco o negro según lo claro que sea el color de marca
function textOn(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? '#111111' : '#ffffff';
}

const discountOf = (p) => {
  const price = Number(p.price) || 0;
  const compare = Number(p.comparePrice) || 0;
  return compare > price ? Math.round((1 - price / compare) * 100) : 0;
};

const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

// Iconos de línea de las tiendas
const ICON = {
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  truck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  whatsapp: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>',
  instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.3v12.4a2.6 2.6 0 1 1-1.8-2.5V9.5a5.9 5.9 0 1 0 5.1 5.9V9a7.6 7.6 0 0 0 4.5 1.4V7.1a4.3 4.3 0 0 1-3.4-1.3z"/></svg>',
};

/**
 * Lo común a todas las páginas de una tienda.
 * opts.imageUrl(img) → dirección de cada foto (data: en la vista previa, /img/… al publicar)
 * opts.api: { track, checkout, p } para analíticas y cobro (solo en la tienda publicada)
 * opts.baseUrl: dirección pública de la tienda, para la imagen al compartir en redes
 */
function siteOf(config, opts) {
  const c = normalizeConfig(config);
  const has = (id) => (c.upsells || []).includes(id);
  const font = FONTS.find((f) => f.name === c.font) || FONTS[0];
  const color = /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#111111';
  const products = (c.products || []).map((p, i) => ({
    ...p,
    id: p.id || `p${i + 1}`,
    name: p.name || 'Nombre de tu producto',
    price: Number(p.price) || 0,
    description: p.description || 'Describe aquí tu producto: qué problema resuelve y por qué lo van a querer.',
    benefits: (p.benefits || []).filter(Boolean),
    variant: p.variant?.values?.filter(Boolean).length > 1 ? { ...p.variant, values: p.variant.values.filter(Boolean) } : null,
    imgs: (p.images || []).filter(Boolean).map(opts.imageUrl).filter(Boolean),
  }));
  const returnDays = has('guarantee') ? 30 : 14;
  const preview = !!opts.preview;
  return {
    c,
    has,
    font,
    color,
    on: textOn(color),
    dark: c.theme === 'dark',
    radius: (BUTTON_STYLES.find((b) => b.id === c.buttonStyle) || BUTTON_STYLES[0]).radius,
    storeName: c.storeName || 'Mi tienda',
    logo: c.logo ? opts.imageUrl(c.logo) : null,
    products,
    multi: products.length > 1,
    bundles: bundlesOf(c),
    addons: addonsOf(c),
    shipping: {
      min: Math.max(1, Number(c.shipping?.min) || DEFAULT_SHIPPING_DAYS.min),
      max: Math.max(Number(c.shipping?.min) || 1, Number(c.shipping?.max) || DEFAULT_SHIPPING_DAYS.max),
    },
    returnDays,
    reviews: (c.reviews || []).filter((r) => r?.name && r?.text),
    faq: c.faq?.length
      ? c.faq
      : DEFAULT_FAQ.map((f) => ({ ...f, a: f.a.replace('30 días', `${returnDays} días`) })),
    announcement: c.announcement || DEFAULT_ANNOUNCEMENT,
    api: opts.api || null,
    // Los píxeles de anuncios solo van en la tienda publicada, nunca en la vista previa
    pixels: !preview && opts.api ? c.pixels || {} : {},
    baseUrl: opts.baseUrl || '',
    // En la vista previa los enlaces entre páginas no navegan
    href: (path) => (preview ? '#' : path),
  };
}

function pixelScripts(s) {
  const { meta, tiktok, ga } = s.pixels;
  let out = '';
  if (/^\d{5,20}$/.test(meta || '')) {
    out += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');</script>\n`;
  }
  if (/^[A-Z0-9]{10,30}$/.test(tiktok || '')) {
    out += `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');ttq.page()}(window,document,'ttq');</script>\n`;
  }
  if (/^G-[A-Z0-9]{4,15}$/.test(ga || '')) {
    out += `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');</script>\n`;
  }
  return out;
}

function head(s, { title, description, image }) {
  const { color, on, font, storeName, has, dark } = s;
  const ogImage = image && s.baseUrl && image.startsWith('/') ? s.baseUrl + image : '';
  const theme = dark
    ? '--bg:#0c0c0e;--surface:#141417;--text:#f4f4f5;--text2:#d4d4d8;--muted:#a1a1aa;--line:#27272a;--soft:#1b1b1f;--foot:#050506'
    : '--bg:#ffffff;--surface:#ffffff;--text:#16161a;--text2:#3b3b45;--muted:#6b6b76;--line:#ececf1;--soft:#f7f7f9;--foot:#111111';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description.slice(0, 160))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description.slice(0, 160))}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="theme-color" content="${dark ? '#0c0c0e' : '#ffffff'}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='${encodeURIComponent(color)}'/><text x='50' y='68' font-size='56' text-anchor='middle' fill='${encodeURIComponent(on)}' font-family='Arial' font-weight='bold'>${esc(storeName.charAt(0).toUpperCase())}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font.google}${font.display ? `&family=${BODY_FONT.google}` : ''}&display=swap" rel="stylesheet">
${pixelScripts(s)}<style>
:root{--brand:${color};--on-brand:${on};--r:${s.radius};${theme};color-scheme:${dark ? 'dark' : 'light'}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${font.display ? BODY_FONT.family : font.family};color:var(--text);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.bar{background:var(--brand);color:var(--on-brand);text-align:center;font-size:14px;font-weight:600;padding:9px 16px}
.bar.dark{background:#111;color:#fff}
.bar b{font-variant-numeric:tabular-nums;letter-spacing:.5px}
header{border-bottom:1px solid var(--line);background:var(--bg)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:66px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.5px;color:var(--text);text-decoration:none;display:flex;align-items:center}
.logo span{color:var(--brand)}
.logo img{height:38px;width:auto;max-width:180px;object-fit:contain}
.hdr-btn{background:var(--brand);color:var(--on-brand);border:0;border-radius:var(--r);padding:9px 18px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none}
.back{display:inline-block;margin-top:20px;color:var(--muted);font-weight:600;font-size:14px;text-decoration:none}
.product{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;padding:40px 0 56px}
.back+.product{padding-top:16px}
.main-img{aspect-ratio:1;border-radius:18px;overflow:hidden;background:var(--soft)}
.main-img img{width:100%;height:100%;object-fit:cover}
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.thumbs button{aspect-ratio:1;border-radius:12px;overflow:hidden;border:2px solid transparent;padding:0;cursor:pointer;background:var(--soft)}
.thumbs button.on{border-color:var(--brand)}
.thumbs img{width:100%;height:100%;object-fit:cover}
.ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px}
h1{font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-.8px;font-weight:800}
.rating{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;color:var(--muted);text-decoration:none}
.rating i,.review i{font-style:normal;color:#f5a524;letter-spacing:1px}
.prices{display:flex;align-items:center;gap:12px;margin:16px 0 18px;flex-wrap:wrap}
.price{font-size:30px;font-weight:800;color:var(--brand)}
.compare{font-size:20px;color:var(--muted);text-decoration:line-through}
.badge{background:var(--brand);color:var(--on-brand);font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px}
.desc{color:var(--text2);margin-bottom:18px}
.desc p+p{margin-top:10px}
.benefits{list-style:none;display:grid;gap:8px;margin-bottom:22px}
.benefits li{display:flex;gap:10px;align-items:flex-start;font-weight:500}
.benefits svg{color:var(--brand);flex-shrink:0;margin-top:2px}
.label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:10px}
.label b{color:var(--text);text-transform:none;letter-spacing:0}
.variants{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.variants button{border:2px solid var(--line);background:var(--surface);color:var(--text);border-radius:var(--r);padding:9px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer}
.variants button.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 8%,var(--surface))}
.bundles{display:grid;gap:10px;margin-bottom:20px}
.bundle{display:flex;align-items:center;justify-content:space-between;gap:12px;border:2px solid var(--line);border-radius:14px;padding:14px 16px;cursor:pointer;transition:border-color .15s}
.bundle.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 6%,var(--surface))}
.bundle input{accent-color:var(--brand);width:18px;height:18px}
.bundle .l{display:flex;align-items:center;gap:12px;font-weight:600}
.bundle small{display:block;font-weight:500;color:var(--muted);font-size:13px}
.bundle .tag{font-size:11px;font-weight:700;background:var(--brand);color:var(--on-brand);border-radius:999px;padding:2px 8px;margin-left:6px;vertical-align:2px}
.bundle .r{text-align:right;font-weight:700}
.bundle .r s{display:block;color:var(--muted);font-weight:500;font-size:13px}
.qty{display:inline-flex;align-items:center;border:2px solid var(--line);border-radius:12px;margin-bottom:20px}
.qty button{width:42px;height:42px;border:0;background:none;font-size:20px;cursor:pointer;color:var(--text)}
.qty span{min-width:30px;text-align:center;font-weight:700}
.addons{display:grid;gap:8px;margin-bottom:20px}
.addon{display:flex;align-items:center;gap:12px;background:var(--soft);border-radius:12px;padding:12px 14px;cursor:pointer;font-size:15px}
.addon input{accent-color:var(--brand);width:18px;height:18px}
.addon b{margin-left:auto;white-space:nowrap}
.delivery{display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:18px;font-size:14.5px}
.delivery svg{color:var(--brand);flex-shrink:0}
.total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:12px}
.buy{width:100%;background:var(--brand);color:var(--on-brand);border:0;border-radius:var(--r);padding:18px;font:inherit;font-size:18px;font-weight:800;cursor:pointer;transition:transform .1s,filter .15s}
.buy:hover{filter:brightness(1.08)}.buy:active{transform:scale(.98)}.buy:disabled{opacity:.6;cursor:wait}
.paylogos{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:12px}
.paylogos span{border:1px solid var(--line);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800;letter-spacing:.3px;color:var(--text2);background:var(--surface)}
.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
.trust div{background:var(--soft);border-radius:12px;padding:12px 8px;text-align:center;font-size:12.5px;font-weight:600;color:var(--text2)}
.trust i{display:block;font-style:normal;font-size:20px;margin-bottom:4px}
section.block{padding:56px 0;border-top:1px solid var(--line)}
h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.5px;font-weight:800;text-align:center;margin-bottom:28px}
.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:18px}
.reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.review{border:1px solid var(--line);border-radius:16px;padding:18px;background:var(--surface)}
.review p{color:var(--text2);margin:8px 0 12px;font-size:15px}
.review b{font-size:14px}
.review small{color:var(--muted);font-size:12.5px;margin-left:6px}
.avg{text-align:center;color:var(--muted);margin:-16px 0 26px}
.avg i{font-style:normal;color:#f5a524;letter-spacing:2px}
.hero{text-align:center;padding:48px 0 28px}
.hero h1{font-size:clamp(32px,5vw,52px)}
.hero p{color:var(--muted);margin-top:8px;font-size:17px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding-bottom:56px}
.card{color:inherit;text-decoration:none;display:block}
.card .ci{aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--soft);position:relative}
.card .ci img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.card:hover .ci img{transform:scale(1.04)}
.card .ci .badge{position:absolute;top:10px;left:10px}
.card h3{font-size:17px;margin-top:12px;line-height:1.3}
.card .cp{display:flex;gap:8px;align-items:baseline;margin-top:4px}
.card .cp b{color:var(--brand);font-size:18px}
.card .cp s{color:var(--muted);font-size:14px}
.faq{max-width:720px;margin:0 auto}
.faq details{border-bottom:1px solid var(--line);padding:18px 0}
.faq summary{font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px}
.faq summary::after{content:'+';color:var(--brand);font-size:22px;line-height:1}
.faq details[open] summary::after{content:'−'}
.faq p{color:var(--text2);margin-top:10px}
.policy{max-width:760px;padding:48px 20px 64px}
.policy h1{margin-bottom:20px}
.policy h2{text-align:left;font-size:20px;margin:26px 0 8px}
.policy p{color:var(--text2);margin-bottom:10px}
footer{background:var(--foot);color:#bbb;padding:40px 0;font-size:14px;text-align:center;border-top:1px solid var(--line)}
footer a{color:#fff;text-decoration:none}
footer nav{display:flex;justify-content:center;flex-wrap:wrap;gap:18px;margin-bottom:14px}
footer .social{display:flex;justify-content:center;gap:14px;margin-bottom:14px}
.sticky{display:none}
.wa{position:fixed;right:18px;bottom:18px;z-index:45;width:56px;height:56px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal.open{display:flex}
.sheet{background:var(--surface);color:var(--text);border-radius:20px;max-width:440px;width:100%;padding:26px;max-height:90vh;overflow:auto;border:1px solid var(--line)}
.sheet h3{font-size:22px;margin-bottom:14px}
.sheet.thanks{text-align:center}
.sheet.thanks i{display:flex;width:56px;height:56px;margin:0 auto 12px;border-radius:50%;align-items:center;justify-content:center;background:var(--brand);color:var(--on-brand)}
.sheet.thanks p{color:var(--muted)}
.line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:15px}
.line.t{font-weight:800;font-size:18px;border:0;padding-top:14px}
.sheet .buy{margin-top:16px}
.sheet .close{width:100%;background:none;border:0;margin-top:10px;color:var(--muted);font:inherit;cursor:pointer;padding:8px}
.note{font-size:13px;color:var(--muted);margin-top:10px;text-align:center}
${font.display ? `h1,h2,h3,.logo,.price,.bar,.card .cp b{font-family:${font.family}}` : ''}
@media (max-width:820px){
  .product{grid-template-columns:1fr;gap:26px;padding:20px 0 40px}
  .gallery{grid-template-columns:1fr 1fr;gap:8px}
  .grid{grid-template-columns:1fr 1fr;gap:14px}
  .reviews{grid-template-columns:1fr}
  ${
    has('stickyCart')
      ? `.sticky{display:flex;position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:10px 14px;gap:12px;align-items:center;z-index:40;box-shadow:0 -6px 20px rgba(0,0,0,.06)}
  .sticky .p{font-weight:800;font-size:17px;white-space:nowrap}
  .sticky .buy{padding:14px;font-size:16px}
  body.has-sticky{padding-bottom:76px}
  body.has-sticky .wa{bottom:90px}`
      : ''
  }
}
</style>
</head>`;
}

function bars(s) {
  const launchEndsAt = s.has('launchOffer') ? s.c.launchEndsAt || null : null;
  return `${s.has('freeShippingBar') ? `<div class="bar">${esc(s.announcement)}</div>` : ''}
${launchEndsAt ? `<div class="bar dark" id="launch" data-ends="${esc(launchEndsAt)}">🔥 Oferta de lanzamiento: termina en <b id="cd">--:--:--</b></div>` : ''}`;
}

function headerHtml(s, withBuy) {
  return `<header><div class="wrap"><a class="logo" href="${s.href('/')}">${
    s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.storeName)}">` : `${esc(s.storeName)}<span>.</span>`
  }</a>${withBuy ? '<button class="hdr-btn" onclick="openCheckout()">Comprar</button>' : ''}</div></header>`;
}

function faqSection(s) {
  if (!s.has('faq')) return '';
  return `<section class="block"><div class="wrap"><h2>Preguntas frecuentes</h2><div class="faq">
${s.faq.map((f) => `<details><summary>${esc(f.q)}</summary>${paragraphs(f.a)}</details>`).join('\n')}
</div></div></section>`;
}

function reviewsSection(s) {
  if (!s.has('reviews') || !s.reviews.length) return '';
  const avg = s.reviews.reduce((t, r) => t + (Number(r.rating) || 5), 0) / s.reviews.length;
  return `<section class="block" id="opiniones"><div class="wrap"><h2>Lo que dicen nuestros clientes</h2>
<p class="avg"><i>${stars(Math.round(avg))}</i> ${avg.toFixed(1).replace('.', ',')} de 5 · ${s.reviews.length} opinion${s.reviews.length > 1 ? 'es' : ''}</p>
<div class="reviews">${s.reviews
    .map((r) => `<div class="review"><i>${stars(Number(r.rating) || 5)}</i><p>${esc(r.text)}</p><b>${esc(r.name)}</b><small>Compra verificada</small></div>`)
    .join('')}</div></div></section>`;
}

function footerHtml(s) {
  const email = s.c.contactEmail;
  const { instagram, tiktok } = s.c.social || {};
  return `<footer><div class="wrap">
<nav>${POLICIES.map((p) => `<a href="${s.href(`/${p.id}/`)}">${p.title}</a>`).join('')}${email ? `<a href="mailto:${esc(email)}">Contacto</a>` : ''}</nav>
${
  instagram || tiktok
    ? `<div class="social">${instagram ? `<a href="https://instagram.com/${esc(instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>` : ''}${tiktok ? `<a href="https://www.tiktok.com/@${esc(tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${ICON.tiktok}</a>` : ''}</div>`
    : ''
}
© ${new Date().getFullYear()} ${esc(s.storeName)}${email ? ` · <a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}
</div></footer>
${
  s.has('whatsapp') && s.c.whatsapp
    ? `<a class="wa" href="https://wa.me/${esc(s.c.whatsapp)}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${ICON.whatsapp}</a>`
    : ''
}`;
}

// Gracias tras pagar, cuenta atrás, analíticas y píxeles: lo comparten todas las páginas
function commonScript(s) {
  const data = json({ track: s.api ? { url: s.api.track, p: s.api.p } : null });
  return `<div class="modal" id="thanks" onclick="if(event.target===this)this.classList.remove('open')">
  <div class="sheet thanks"><i>${ICON.check}</i><h3>¡Gracias por tu compra!</h3><p>Hemos recibido tu pedido. Te llegará un email con la confirmación del pago.</p><button class="close" onclick="document.getElementById('thanks').classList.remove('open')">Cerrar</button></div>
</div>
<script>
var S=${data};
function T(t){if(!S.track)return;var v='';try{v=localStorage.getItem('lt_v');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('lt_v',v)}}catch(e){}
var q=new URLSearchParams(location.search);var b=JSON.stringify({p:S.track.p,t:t,v:v,r:document.referrer,u:q.get('utm_source')||'',m:/Mobi|Android/i.test(navigator.userAgent)?1:0});
if(navigator.sendBeacon)navigator.sendBeacon(S.track.url,b);else fetch(S.track.url,{method:'POST',body:b,keepalive:true,mode:'no-cors'})}
function P(ev,val){var d=val?{value:Math.round(val*100)/100,currency:'EUR'}:{};try{if(window.fbq)fbq('track',{view:'ViewContent',checkout:'InitiateCheckout',purchase:'Purchase'}[ev],d)}catch(e){}try{if(window.ttq)ttq.track({view:'ViewContent',checkout:'InitiateCheckout',purchase:'CompletePayment'}[ev],d)}catch(e){}try{if(window.gtag)gtag('event',{view:'view_item',checkout:'begin_checkout',purchase:'purchase'}[ev],d)}catch(e){}}
T('view');
if(/[?&]pedido=ok/.test(location.search)){document.getElementById('thanks').classList.add('open');var paid=0;try{paid=Number(sessionStorage.getItem('lt_total'))||0;sessionStorage.removeItem('lt_total')}catch(e){}P('purchase',paid);try{history.replaceState(null,'',location.pathname)}catch(e){}}
(function(){var el=document.getElementById('launch');if(!el)return;var end=new Date(el.getAttribute('data-ends')).getTime();(function tick(){var s=Math.floor((end-Date.now())/1000);if(s<=0){el.remove();return}var p=function(n){return String(n).padStart(2,'0')};document.getElementById('cd').textContent=p(Math.floor(s/3600))+':'+p(Math.floor(s%3600/60))+':'+p(s%60);setTimeout(tick,1000)})()})();
</script>`;
}

function productCards(s, list) {
  return list
    .map((p) => {
      const off = discountOf(p);
      return `<a class="card" href="${s.href(productPath(p))}">
  <div class="ci">${p.imgs[0] ? `<img src="${esc(p.imgs[0])}" alt="${esc(p.name)}" loading="lazy">` : '<div class="ph">Foto</div>'}${off ? `<span class="badge">-${off}%</span>` : ''}</div>
  <h3>${esc(p.name)}</h3>
  <div class="cp"><b>${money(p.price)}</b>${off ? `<s>${money(p.comparePrice)}</s>` : ''}</div>
</a>`;
    })
    .join('');
}

const pageTitle = (s, fallback) => s.c.seo?.title || fallback;
const pageDesc = (s, fallback) => s.c.seo?.description || fallback;

/** Portada con todos los productos (solo si la tienda tiene más de uno). */
function renderCatalogPage(s) {
  const first = s.products.find((p) => p.imgs[0]);
  return `${head(s, {
    title: pageTitle(s, s.storeName),
    description: pageDesc(s, `${s.storeName}: ${s.products.map((p) => p.name).join(', ')}`),
    image: first?.imgs[0],
  })}
<body>
${bars(s)}
${headerHtml(s, false)}
<main class="wrap">
  <div class="hero"><h1>${esc(s.storeName)}</h1><p>${esc(s.c.tagline || 'Descubre nuestros productos')}</p></div>
  <div class="grid">${productCards(s, s.products)}</div>
</main>
${reviewsSection(s)}
${faqSection(s)}
${footerHtml(s)}
${commonScript(s)}
</body>
</html>`;
}

/** Página de un producto, con fotos, opciones, packs, extras y botón de compra. */
function renderProductPage(s, product) {
  const { has } = s;
  const p = product;
  const imgs = p.imgs;
  const off = discountOf(p);
  const others = s.products.filter((o) => o.id !== p.id).slice(0, 3);
  const showReviews = has('reviews') && s.reviews.length;
  const avg = showReviews ? s.reviews.reduce((t, r) => t + (Number(r.rating) || 5), 0) / s.reviews.length : 0;

  const data = {
    id: p.id,
    price: p.price,
    // Precio por unidad de cada pack, ya redondeado igual que en el cobro
    units: Object.fromEntries(s.bundles.map((b) => [b.qty, unitCents(p.price, b.off) / 100])),
    offs: Object.fromEntries(s.bundles.map((b) => [b.qty, b.off])),
    bundles: has('bundles'),
    addons: s.addons,
    variant: p.variant ? { name: p.variant.name, value: p.variant.values[0] } : null,
    paymentLink: s.c.paymentLink || '',
    contactEmail: s.c.contactEmail || '',
    productName: p.name,
    shipping: s.shipping,
    // Cobro con tarjeta a través de Dropshype (si el dueño conectó Stripe)
    checkout: s.api ? { url: s.api.checkout, p: s.api.p } : null,
  };

  return `${head(s, {
    title: s.multi ? `${p.name} | ${s.storeName}` : pageTitle(s, `${p.name} | ${s.storeName}`),
    description: s.multi ? p.description : pageDesc(s, p.description),
    image: imgs[0],
  })}
<body${has('stickyCart') ? ' class="has-sticky"' : ''}>
${bars(s)}
${headerHtml(s, true)}

<main class="wrap">
  ${s.multi ? `<a class="back" href="${s.href('/')}">← Ver todos los productos</a>` : ''}
  <div class="product">
    <div>
      <div class="main-img">${imgs[0] ? `<img id="main" src="${esc(imgs[0])}" alt="${esc(p.name)}">` : '<div class="ph">Foto principal</div>'}</div>
      ${
        imgs.length > 1
          ? `<div class="thumbs">${imgs
              .map(
                (src, i) =>
                  `<button class="${i === 0 ? 'on' : ''}" onclick="pick(this)" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt=""></button>`
              )
              .join('')}</div>`
          : ''
      }
    </div>
    <div>
      <h1>${esc(p.name)}</h1>
      ${
        showReviews
          ? `<a class="rating" href="#opiniones"><i>${stars(Math.round(avg))}</i> ${avg.toFixed(1).replace('.', ',')} · ${s.reviews.length} opinion${s.reviews.length > 1 ? 'es' : ''}</a>`
          : ''
      }
      <div class="prices">
        <span class="price">${money(p.price)}</span>
        ${off ? `<span class="compare">${money(p.comparePrice)}</span><span class="badge">-${off}%</span>` : ''}
      </div>
      <div class="desc">${paragraphs(p.description)}</div>
      ${p.benefits.length ? `<ul class="benefits">${p.benefits.map((b) => `<li>${ICON.check}<span>${esc(b)}</span></li>`).join('')}</ul>` : ''}

      ${
        p.variant
          ? `<div class="label">${esc(p.variant.name)}: <b id="vname">${esc(p.variant.values[0])}</b></div>
      <div class="variants" id="variants">${p.variant.values
        .map((v, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-v="${esc(v)}">${esc(v)}</button>`)
        .join('')}</div>`
          : ''
      }

      ${
        data.bundles
          ? `<div class="label">Elige tu pack</div>
      <div class="bundles" id="bundles">
        ${s.bundles
          .map(
            ({ qty: q, off: boff, sub }, i) => `<label class="bundle${i === 0 ? ' on' : ''}">
          <span class="l"><input type="radio" name="b" value="${q}" ${i === 0 ? 'checked' : ''}><span>${q} unidad${q > 1 ? 'es' : ''}${boff ? `<span class="tag">-${boff}%</span>` : ''}<small>${sub}</small></span></span>
          <span class="r">${money((unitCents(p.price, boff) * q) / 100)}${boff ? `<s>${money(p.price * q)}</s>` : ''}</span>
        </label>`
          )
          .join('')}
      </div>`
          : `<div class="label">Cantidad</div>
      <div class="qty"><button onclick="setQty(-1)" aria-label="Menos">−</button><span id="q">1</span><button onclick="setQty(1)" aria-label="Más">+</button></div>`
      }

      ${
        s.addons.length
          ? `<div class="addons">${s.addons
              .map(
                (a) =>
                  `<label class="addon"><input type="checkbox" data-addon="${esc(a.id)}"> ${esc(a.title)} <b>+${money(a.price)}</b></label>`
              )
              .join('')}</div>`
          : ''
      }

      ${has('deliveryEstimate') ? `<div class="delivery">${ICON.truck}<span id="eta">Recíbelo en ${s.shipping.min}-${s.shipping.max} días</span></div>` : ''}

      <div class="total"><span>Total</span><span id="total">${money(p.price)}</span></div>
      <button class="buy" onclick="openCheckout()">Comprar ahora</button>
      ${has('trustBadges') ? '<div class="paylogos"><span>VISA</span><span>Mastercard</span><span>Apple Pay</span><span>Google Pay</span><span>AMEX</span></div>' : ''}
      ${
        has('guarantee')
          ? `<div class="trust"><div><i>🛡️</i>Garantía 30 días</div><div><i>🔒</i>Pago seguro</div><div><i>↩️</i>Devolución fácil</div></div>`
          : ''
      }
    </div>
  </div>
</main>

${
  imgs.length > 1
    ? `<section class="block"><div class="wrap"><h2>Míralo en detalle</h2><div class="gallery">${imgs
        .map((src) => `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy">`)
        .join('')}</div></div></section>`
    : ''
}

${reviewsSection(s)}

${others.length ? `<section class="block"><div class="wrap"><h2>También te puede gustar</h2><div class="grid">${productCards(s, others)}</div></div></section>` : ''}

${faqSection(s)}
${footerHtml(s)}

<div class="sticky"><span class="p" id="stickyTotal">${money(p.price)}</span><button class="buy" onclick="openCheckout()">Comprar ahora</button></div>

<div class="modal" id="modal" onclick="if(event.target===this)closeCheckout()">
  <div class="sheet">
    <h3>Tu pedido</h3>
    <div id="lines"></div>
    <button class="buy" id="pay">Ir al pago</button>
    <p class="note" id="payNote"></p>
    <button class="close" onclick="closeCheckout()">Seguir mirando</button>
  </div>
</div>

${commonScript(s)}
<script>
var D=${json(data)};
var qty=1;
P('view',D.price);
function m(n){return n.toFixed(2).replace('.',',')+' €'}
function pick(btn){document.getElementById('main').src=btn.querySelector('img').src;document.querySelectorAll('.thumbs button').forEach(function(b){b.classList.remove('on')});btn.classList.add('on')}
function setQty(d){qty=Math.max(1,Math.min(10,qty+d));document.getElementById('q').textContent=qty;update()}
function off(){return D.bundles?D.offs[qty]:0}
function unit(){return D.bundles?D.units[qty]:D.price}
function chosen(){return D.addons.filter(function(a){var el=document.querySelector('[data-addon="'+a.id+'"]');return el&&el.checked})}
function total(){var t=Math.round(unit()*100)*qty;chosen().forEach(function(a){t+=Math.round(a.price*100)});return t/100}
function update(){var t=m(total());document.getElementById('total').textContent=t;document.getElementById('stickyTotal').textContent=t}
document.querySelectorAll('#bundles input').forEach(function(r){r.addEventListener('change',function(){qty=+r.value;document.querySelectorAll('.bundle').forEach(function(b){b.classList.toggle('on',b.contains(r))});update()})});
document.querySelectorAll('[data-addon]').forEach(function(c){c.addEventListener('change',update)});
document.querySelectorAll('#variants button').forEach(function(b){b.addEventListener('click',function(){D.variant.value=b.getAttribute('data-v');document.getElementById('vname').textContent=D.variant.value;document.querySelectorAll('#variants button').forEach(function(x){x.classList.toggle('on',x===b)})})});
(function(){var el=document.getElementById('eta');if(!el)return;var f=function(d){var x=new Date();x.setDate(x.getDate()+d);return x.toLocaleDateString('es-ES',{day:'numeric',month:'short'})};el.innerHTML='Recíbelo entre el <b>'+f(D.shipping.min)+'</b> y el <b>'+f(D.shipping.max)+'</b>'})();
function summary(){var name=D.productName+(D.variant?' ('+D.variant.name+': '+D.variant.value+')':'');var l=[qty+' x '+name+(off()?' (-'+off()+'%)':'')+' — '+m(Math.round(unit()*100)*qty/100)];chosen().forEach(function(a){l.push(a.title+' — '+m(a.price))});return l}
// Sin cobro con tarjeta: enlace de pago propio o pedido por email
function manual(pay,note){
  if(D.paymentLink){pay.textContent='Ir al pago seguro';pay.onclick=function(){T('pay');location.href=D.paymentLink};note.textContent='Serás redirigido a la pasarela de pago.';return true}
  if(D.contactEmail){pay.textContent='Hacer pedido';pay.onclick=function(){T('pay');location.href='mailto:'+D.contactEmail+'?subject='+encodeURIComponent('Pedido: '+D.productName)+'&body='+encodeURIComponent('Hola, quiero hacer este pedido:\\n\\n'+summary().join('\\n')+'\\n\\nTotal: '+m(total())+'\\n\\nNombre:\\nDirección de envío:\\nTeléfono:')};note.textContent='Te responderemos con los datos para el pago.';return true}
  return false}
function card(pay,note){
  pay.textContent='Pagar con tarjeta';note.textContent='🔒 Pago seguro con Stripe. Te pediremos la dirección de envío.';
  pay.onclick=function(){T('pay');pay.disabled=true;pay.textContent='Abriendo el pago…';
    fetch(D.checkout.url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({p:D.checkout.p,product:D.id,qty:qty,variant:D.variant?D.variant.value:null,addons:chosen().map(function(a){return a.id}),back:location.origin+location.pathname})})
    .then(function(r){return r.json()}).then(function(d){if(d.url){location.href=d.url;return}pay.disabled=false;if(!manual(pay,note)){pay.textContent='Pago no disponible';pay.onclick=null;note.textContent=d.error||'Esta tienda todavía no acepta pagos.'}})
    .catch(function(){pay.disabled=false;pay.textContent='Reintentar';note.textContent='No se pudo abrir el pago. Inténtalo de nuevo.'})}}
function openCheckout(){
  var h='';summary().forEach(function(s){var p=s.split(' — ');h+='<div class="line"><span>'+p[0].replace(/</g,'&lt;')+'</span><b>'+p[1]+'</b></div>'});
  h+='<div class="line t"><span>Total</span><span>'+m(total())+'</span></div>';
  document.getElementById('lines').innerHTML=h;
  var pay=document.getElementById('pay'),note=document.getElementById('payNote');pay.disabled=false;
  if(D.checkout)card(pay,note);
  else if(!manual(pay,note)){pay.textContent='Pago no configurado todavía';pay.onclick=null;note.textContent=''}
  document.getElementById('modal').classList.add('open');
  try{sessionStorage.setItem('lt_total',String(total()))}catch(e){}
  T('checkout');P('checkout',total());
}
function closeCheckout(){document.getElementById('modal').classList.remove('open')}
</script>
</body>
</html>`;
}

/** Textos de las páginas legales (plantilla general: el dueño debe revisarlos). */
function policyBody(s, id) {
  const email = s.c.contactEmail;
  const contact = email ? `escríbenos a <a href="mailto:${esc(email)}">${esc(email)}</a>` : 'escríbenos a través de nuestros canales de contacto';
  const name = esc(s.storeName);
  if (id === 'envios') {
    return `<p>En ${name} preparamos tu pedido en 1-3 días laborables desde que se confirma el pago.</p>
<h2>Plazos de entrega</h2><p>El plazo habitual de entrega es de <b>${s.shipping.min} a ${s.shipping.max} días</b>. En temporadas de mucha demanda puede alargarse unos días.</p>
<h2>Seguimiento</h2><p>Cuando tu pedido salga del almacén te enviaremos por email el número de seguimiento para que sepas en todo momento dónde está.</p>
<h2>Gastos de envío</h2><p>Los gastos de envío, si los hay, se indican antes de pagar. ${s.has('express') ? 'También ofrecemos envío exprés con un pequeño suplemento.' : ''}</p>
<h2>¿Dudas?</h2><p>Si tienes cualquier pregunta sobre tu envío, ${contact}.</p>`;
  }
  if (id === 'devoluciones') {
    return `<p>Queremos que estés contento con tu compra. Si no lo estás, puedes devolverla.</p>
<h2>Plazo</h2><p>Tienes <b>${s.returnDays} días naturales</b> desde que recibes el pedido para solicitar la devolución.</p>
<h2>Cómo devolver un producto</h2><p>Para iniciar una devolución, ${contact} indicando tu número de pedido. Te diremos cómo enviarnos el producto, que debe estar en buen estado y con su embalaje original.</p>
<h2>Reembolso</h2><p>Cuando recibamos y revisemos el producto, te devolveremos el importe por el mismo método de pago en un plazo máximo de 14 días.</p>
<h2>Productos defectuosos</h2><p>Si tu producto llega dañado o defectuoso, ${contact} con una foto y te lo solucionamos sin coste.</p>`;
  }
  return `<p>En ${name} respetamos tu privacidad. Aquí te explicamos qué datos tratamos y para qué.</p>
<h2>Qué datos recogemos</h2><p>Los datos que nos das al comprar (nombre, email, teléfono y dirección de envío) para gestionar y enviar tu pedido. Los datos de tu tarjeta los procesa directamente nuestra pasarela de pago segura; nosotros nunca los vemos.</p>
<h2>Para qué los usamos</h2><p>Para preparar y enviar tu pedido, atender tus consultas y cumplir con nuestras obligaciones legales. No vendemos tus datos a terceros.</p>
<h2>Cookies y medición</h2><p>Usamos herramientas de medición para saber cuántas personas visitan la tienda${Object.values(s.c.pixels || {}).some(Boolean) ? ' y para medir nuestros anuncios en redes sociales' : ''}.</p>
<h2>Tus derechos</h2><p>Puedes pedir acceder a tus datos, corregirlos o borrarlos cuando quieras: ${contact}.</p>`;
}

function renderPolicyPage(s, policy) {
  return `${head(s, { title: `${policy.title} | ${s.storeName}`, description: `${policy.title} de ${s.storeName}` })}
<body>
${headerHtml(s, false)}
<main class="wrap policy"><h1>${policy.title}</h1>${policyBody(s, policy.id)}</main>
${footerHtml(s)}
${commonScript(s)}
</body>
</html>`;
}

/**
 * Todas las páginas de la tienda para publicarla: [{ file, data }].
 * Con un producto, la portada es su página; con varios, la portada es el catálogo.
 */
export function renderSite(config, opts) {
  const s = siteOf(config, opts);
  const pages = s.multi
    ? [
        { file: 'index.html', data: renderCatalogPage(s) },
        ...s.products.map((p) => ({ file: `${productPath(p).slice(1)}index.html`, data: renderProductPage(s, p) })),
      ]
    : [{ file: 'index.html', data: renderProductPage(s, s.products[0]) }];
  return [...pages, ...POLICIES.map((p) => ({ file: `${p.id}/index.html`, data: renderPolicyPage(s, p) }))];
}

/** Una sola página para la vista previa del creador: 'home' o el índice de un producto. */
export function renderPreview(config, { imageUrl, page = 'home' }) {
  const s = siteOf(config, { imageUrl, preview: true });
  if (!s.products.length) return '';
  if (page === 'home' && s.multi) return renderCatalogPage(s);
  return renderProductPage(s, s.products[page === 'home' ? 0 : page] || s.products[0]);
}
