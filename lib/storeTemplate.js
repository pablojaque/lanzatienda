import { FONTS, UPSELLS } from './storeOptions';
import { BUNDLES, normalizeConfig, productPath } from './storeConfig';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const money = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';

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

/**
 * Lo común a todas las páginas de una tienda.
 * opts.imageUrl(img) → dirección de cada foto (data: en la vista previa, /img/… al publicar)
 * opts.api: { track, checkout, p } para analíticas y cobro (solo en la tienda publicada)
 * opts.baseUrl: dirección pública de la tienda, para la imagen al compartir en redes
 */
function siteOf(config, opts) {
  const c = normalizeConfig(config);
  const font = FONTS.find((f) => f.name === c.font) || FONTS[0];
  const color = /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#111111';
  const products = (c.products || []).map((p, i) => ({
    ...p,
    id: p.id || `p${i + 1}`,
    name: p.name || 'Nombre de tu producto',
    price: Number(p.price) || 0,
    description: p.description || 'Describe aquí tu producto: qué problema resuelve y por qué lo van a querer.',
    imgs: (p.images || []).filter(Boolean).map(opts.imageUrl).filter(Boolean),
  }));
  return {
    c,
    font,
    color,
    on: textOn(color),
    has: (id) => (c.upsells || []).includes(id),
    storeName: c.storeName || 'Mi tienda',
    products,
    multi: products.length > 1,
    api: opts.api || null,
    baseUrl: opts.baseUrl || '',
    // En la vista previa los enlaces entre páginas no navegan
    href: (path) => (opts.preview ? '#' : path),
  };
}

function head(s, { title, description, image }) {
  const { color, on, font, storeName, has } = s;
  const ogImage = image && s.baseUrl && image.startsWith('/') ? s.baseUrl + image : '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description.slice(0, 155))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description.slice(0, 155))}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='${encodeURIComponent(color)}'/><text x='50' y='68' font-size='56' text-anchor='middle' fill='${encodeURIComponent(on)}' font-family='Arial' font-weight='bold'>${esc(storeName.charAt(0).toUpperCase())}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap" rel="stylesheet">
<style>
:root{--brand:${color};--on-brand:${on};--text:#16161a;--muted:#6b6b76;--line:#ececf1;--soft:#f7f7f9}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${font.family};color:var(--text);background:#fff;line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.bar{background:var(--brand);color:var(--on-brand);text-align:center;font-size:14px;font-weight:600;padding:9px 16px}
.bar.dark{background:#111;color:#fff}
.bar b{font-variant-numeric:tabular-nums;letter-spacing:.5px}
header{border-bottom:1px solid var(--line)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:66px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.5px;color:var(--text);text-decoration:none}
.logo span{color:var(--brand)}
.hdr-btn{background:var(--brand);color:var(--on-brand);border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none}
.back{display:inline-block;margin-top:20px;color:var(--muted);font-weight:600;font-size:14px;text-decoration:none}
.product{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;padding:40px 0 56px}
.back+.product{padding-top:16px}
.main-img{aspect-ratio:1;border-radius:18px;overflow:hidden;background:var(--soft)}
.main-img img{width:100%;height:100%;object-fit:cover}
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.thumbs button{aspect-ratio:1;border-radius:12px;overflow:hidden;border:2px solid transparent;padding:0;cursor:pointer;background:var(--soft)}
.thumbs button.on{border-color:var(--brand)}
.thumbs img{width:100%;height:100%;object-fit:cover}
.ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#b5b5c0;font-size:14px}
h1{font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-.8px;font-weight:800}
.prices{display:flex;align-items:center;gap:12px;margin:16px 0 18px;flex-wrap:wrap}
.price{font-size:30px;font-weight:800;color:var(--brand)}
.compare{font-size:20px;color:var(--muted);text-decoration:line-through}
.badge{background:var(--brand);color:var(--on-brand);font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px}
.desc{color:#3b3b45;margin-bottom:22px}
.desc p+p{margin-top:10px}
.label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:10px}
.bundles{display:grid;gap:10px;margin-bottom:20px}
.bundle{display:flex;align-items:center;justify-content:space-between;gap:12px;border:2px solid var(--line);border-radius:14px;padding:14px 16px;cursor:pointer;transition:border-color .15s}
.bundle.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 6%,#fff)}
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
.total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:12px}
.buy{width:100%;background:var(--brand);color:var(--on-brand);border:0;border-radius:14px;padding:18px;font:inherit;font-size:18px;font-weight:800;cursor:pointer;transition:transform .1s,filter .15s}
.buy:hover{filter:brightness(1.08)}.buy:active{transform:scale(.98)}.buy:disabled{opacity:.6;cursor:wait}
.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
.trust div{background:var(--soft);border-radius:12px;padding:12px 8px;text-align:center;font-size:12.5px;font-weight:600;color:#3b3b45}
.trust i{display:block;font-style:normal;font-size:20px;margin-bottom:4px}
section.block{padding:56px 0;border-top:1px solid var(--line)}
h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.5px;font-weight:800;text-align:center;margin-bottom:28px}
.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:18px}
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
.faq p{color:#4b4b55;margin-top:10px}
footer{background:#111;color:#bbb;padding:36px 0;font-size:14px;text-align:center}
footer a{color:#fff}
.sticky{display:none}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal.open{display:flex}
.sheet{background:#fff;border-radius:20px;max-width:440px;width:100%;padding:26px;max-height:90vh;overflow:auto}
.sheet h3{font-size:22px;margin-bottom:14px}
.sheet.thanks{text-align:center}
.sheet.thanks i{display:block;font-style:normal;font-size:52px;margin-bottom:8px}
.sheet.thanks p{color:var(--muted)}
.line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:15px}
.line.t{font-weight:800;font-size:18px;border:0;padding-top:14px}
.sheet .buy{margin-top:16px}
.sheet .close{width:100%;background:none;border:0;margin-top:10px;color:var(--muted);font:inherit;cursor:pointer;padding:8px}
.note{font-size:13px;color:var(--muted);margin-top:10px;text-align:center}
@media (max-width:820px){
  .product{grid-template-columns:1fr;gap:26px;padding:20px 0 40px}
  .gallery{grid-template-columns:1fr 1fr;gap:8px}
  .grid{grid-template-columns:1fr 1fr;gap:14px}
  ${
    has('stickyCart')
      ? `.sticky{display:flex;position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:10px 14px;gap:12px;align-items:center;z-index:40;box-shadow:0 -6px 20px rgba(0,0,0,.06)}
  .sticky .p{font-weight:800;font-size:17px;white-space:nowrap}
  .sticky .buy{padding:14px;font-size:16px}
  body.has-sticky{padding-bottom:76px}`
      : ''
  }
}
</style>
</head>`;
}

function bars(s) {
  const launchEndsAt = s.has('launchOffer') ? s.c.launchEndsAt || null : null;
  return `${s.has('freeShippingBar') ? `<div class="bar">🚚 Envío GRATIS en todos los pedidos</div>` : ''}
${launchEndsAt ? `<div class="bar dark" id="launch" data-ends="${esc(launchEndsAt)}">🔥 Oferta de lanzamiento: termina en <b id="cd">--:--:--</b></div>` : ''}`;
}

function faqAndFooter(s) {
  const email = s.c.contactEmail;
  return `${
    s.has('faq')
      ? `<section class="block"><div class="wrap"><h2>Preguntas frecuentes</h2><div class="faq">
  <details><summary>¿Cuánto tarda en llegar mi pedido?</summary><p>Cuando tu pedido salga del almacén te enviaremos el número de seguimiento por email para que puedas ver en todo momento dónde está.</p></details>
  <details><summary>¿Puedo devolverlo?</summary><p>Sí. Tienes ${s.has('guarantee') ? '30' : '14'} días desde que lo recibes para devolverlo si no estás satisfecho.</p></details>
  <details><summary>¿Es seguro pagar aquí?</summary><p>Sí, el pago se procesa a través de una pasarela de pago segura y cifrada. Nunca vemos ni guardamos los datos de tu tarjeta.</p></details>
  <details><summary>¿Cómo contacto con vosotros?</summary><p>${email ? `Escríbenos a <a href="mailto:${esc(email)}">${esc(email)}</a> y te respondemos lo antes posible.` : 'Escríbenos y te respondemos lo antes posible.'}</p></details>
</div></div></section>`
      : ''
  }

<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(s.storeName)}${email ? ` · <a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}</div></footer>`;
}

// Gracias tras pagar, cuenta atrás y analíticas: lo comparten todas las páginas
function commonScript(s) {
  const json = JSON.stringify({ track: s.api ? { url: s.api.track, p: s.api.p } : null }).replace(/</g, '\\u003c');
  return `<div class="modal" id="thanks" onclick="if(event.target===this)this.classList.remove('open')">
  <div class="sheet thanks"><i>🎉</i><h3>¡Gracias por tu compra!</h3><p>Hemos recibido tu pedido. Te llegará un email con la confirmación del pago.</p><button class="close" onclick="document.getElementById('thanks').classList.remove('open')">Cerrar</button></div>
</div>
<script>
var S=${json};
function T(t){if(!S.track)return;var v='';try{v=localStorage.getItem('lt_v');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('lt_v',v)}}catch(e){}
var q=new URLSearchParams(location.search);var b=JSON.stringify({p:S.track.p,t:t,v:v,r:document.referrer,u:q.get('utm_source')||'',m:/Mobi|Android/i.test(navigator.userAgent)?1:0});
if(navigator.sendBeacon)navigator.sendBeacon(S.track.url,b);else fetch(S.track.url,{method:'POST',body:b,keepalive:true,mode:'no-cors'})}
T('view');
if(/[?&]pedido=ok/.test(location.search)){document.getElementById('thanks').classList.add('open');try{history.replaceState(null,'',location.pathname)}catch(e){}}
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

/** Portada con todos los productos (solo si la tienda tiene más de uno). */
function renderCatalogPage(s) {
  const first = s.products.find((p) => p.imgs[0]);
  return `${head(s, {
    title: s.storeName,
    description: `${s.storeName}: ${s.products.map((p) => p.name).join(', ')}`,
    image: first?.imgs[0],
  })}
<body>
${bars(s)}
<header><div class="wrap"><a class="logo" href="${s.href('/')}">${esc(s.storeName)}<span>.</span></a></div></header>
<main class="wrap">
  <div class="hero"><h1>${esc(s.storeName)}</h1><p>Descubre nuestros productos</p></div>
  <div class="grid">${productCards(s, s.products)}</div>
</main>
${faqAndFooter(s)}
${commonScript(s)}
</body>
</html>`;
}

/** Página de un producto, con fotos, packs, extras y botón de compra. */
function renderProductPage(s, product) {
  const { has } = s;
  const p = product;
  const imgs = p.imgs;
  const off = discountOf(p);
  const addons = UPSELLS.filter((u) => u.price && has(u.id)).map((u) => ({ id: u.id, title: u.title, price: u.price }));
  const others = s.products.filter((o) => o.id !== p.id).slice(0, 3);

  const data = {
    id: p.id,
    price: p.price,
    bundles: has('bundles'),
    addons,
    paymentLink: s.c.paymentLink || '',
    contactEmail: s.c.contactEmail || '',
    productName: p.name,
    // Cobro con tarjeta a través de Dropshype (si el dueño conectó Stripe)
    checkout: s.api ? { url: s.api.checkout, p: s.api.p } : null,
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  const descHtml = esc(p.description)
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `${head(s, { title: `${p.name} | ${s.storeName}`, description: p.description, image: imgs[0] })}
<body${has('stickyCart') ? ' class="has-sticky"' : ''}>
${bars(s)}
<header><div class="wrap"><a class="logo" href="${s.href('/')}">${esc(s.storeName)}<span>.</span></a><button class="hdr-btn" onclick="openCheckout()">Comprar</button></div></header>

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
      <div class="prices">
        <span class="price">${money(p.price)}</span>
        ${off ? `<span class="compare">${money(p.comparePrice)}</span><span class="badge">-${off}%</span>` : ''}
      </div>
      <div class="desc">${descHtml}</div>

      ${
        data.bundles
          ? `<div class="label">Elige tu pack</div>
      <div class="bundles" id="bundles">
        ${BUNDLES.map(
          ({ qty: q, off: boff, sub }, i) => `<label class="bundle${i === 0 ? ' on' : ''}">
          <span class="l"><input type="radio" name="b" value="${q}" ${i === 0 ? 'checked' : ''}><span>${q} unidad${q > 1 ? 'es' : ''}${boff ? `<span class="tag">-${boff}%</span>` : ''}<small>${sub}</small></span></span>
          <span class="r">${money(p.price * q * (1 - boff / 100))}${boff ? `<s>${money(p.price * q)}</s>` : ''}</span>
        </label>`
        ).join('')}
      </div>`
          : `<div class="label">Cantidad</div>
      <div class="qty"><button onclick="setQty(-1)" aria-label="Menos">−</button><span id="q">1</span><button onclick="setQty(1)" aria-label="Más">+</button></div>`
      }

      ${
        addons.length
          ? `<div class="addons">${addons
              .map(
                (a) =>
                  `<label class="addon"><input type="checkbox" data-addon="${a.id}"> ${esc(a.title)} <b>+${money(a.price)}</b></label>`
              )
              .join('')}</div>`
          : ''
      }

      <div class="total"><span>Total</span><span id="total">${money(p.price)}</span></div>
      <button class="buy" onclick="openCheckout()">Comprar ahora</button>
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

${others.length ? `<section class="block"><div class="wrap"><h2>También te puede gustar</h2><div class="grid">${productCards(s, others)}</div></div></section>` : ''}

${faqAndFooter(s)}

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
var D=${json};
var qty=1;
function m(n){return n.toFixed(2).replace('.',',')+' €'}
function pick(btn){document.getElementById('main').src=btn.querySelector('img').src;document.querySelectorAll('.thumbs button').forEach(function(b){b.classList.remove('on')});btn.classList.add('on')}
function setQty(d){qty=Math.max(1,Math.min(10,qty+d));document.getElementById('q').textContent=qty;update()}
function off(){return D.bundles?({1:0,2:10,3:20})[qty]:0}
function chosen(){return D.addons.filter(function(a){var el=document.querySelector('[data-addon="'+a.id+'"]');return el&&el.checked})}
function total(){var t=D.price*qty*(1-off()/100);chosen().forEach(function(a){t+=a.price});return t}
function update(){var t=m(total());document.getElementById('total').textContent=t;document.getElementById('stickyTotal').textContent=t}
document.querySelectorAll('#bundles input').forEach(function(r){r.addEventListener('change',function(){qty=+r.value;document.querySelectorAll('.bundle').forEach(function(b){b.classList.toggle('on',b.contains(r))});update()})});
document.querySelectorAll('[data-addon]').forEach(function(c){c.addEventListener('change',update)});
function summary(){var l=[qty+' x '+D.productName+(off()?' (-'+off()+'%)':'')+' — '+m(D.price*qty*(1-off()/100))];chosen().forEach(function(a){l.push(a.title+' — '+m(a.price))});return l}
// Sin cobro con tarjeta: enlace de pago propio o pedido por email
function manual(pay,note){
  if(D.paymentLink){pay.textContent='Ir al pago seguro';pay.onclick=function(){T('pay');location.href=D.paymentLink};note.textContent='Serás redirigido a la pasarela de pago.';return true}
  if(D.contactEmail){pay.textContent='Hacer pedido';pay.onclick=function(){T('pay');location.href='mailto:'+D.contactEmail+'?subject='+encodeURIComponent('Pedido: '+D.productName)+'&body='+encodeURIComponent('Hola, quiero hacer este pedido:\\n\\n'+summary().join('\\n')+'\\n\\nTotal: '+m(total())+'\\n\\nNombre:\\nDirección de envío:\\nTeléfono:')};note.textContent='Te responderemos con los datos para el pago.';return true}
  return false}
function card(pay,note){
  pay.textContent='Pagar con tarjeta';note.textContent='🔒 Pago seguro con Stripe. Te pediremos la dirección de envío.';
  pay.onclick=function(){T('pay');pay.disabled=true;pay.textContent='Abriendo el pago…';
    fetch(D.checkout.url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({p:D.checkout.p,product:D.id,qty:qty,addons:chosen().map(function(a){return a.id}),back:location.origin+location.pathname})})
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
  T('checkout');
}
function closeCheckout(){document.getElementById('modal').classList.remove('open')}
</script>
</body>
</html>`;
}

/**
 * Todas las páginas de la tienda para publicarla: [{ file, data }].
 * Con un producto, la portada es su página; con varios, la portada es el catálogo.
 */
export function renderSite(config, opts) {
  const s = siteOf(config, opts);
  if (!s.multi) return [{ file: 'index.html', data: renderProductPage(s, s.products[0]) }];
  return [
    { file: 'index.html', data: renderCatalogPage(s) },
    ...s.products.map((p) => ({ file: `${productPath(p).slice(1)}index.html`, data: renderProductPage(s, p) })),
  ];
}

/** Una sola página para la vista previa del creador: 'home' o el índice de un producto. */
export function renderPreview(config, { imageUrl, page = 'home' }) {
  const s = siteOf(config, { imageUrl, preview: true });
  if (!s.products.length) return '';
  if (page === 'home' && s.multi) return renderCatalogPage(s);
  return renderProductPage(s, s.products[page === 'home' ? 0 : page] || s.products[0]);
}
