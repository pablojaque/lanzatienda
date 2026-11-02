'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { COLORS, FONTS, UPSELLS, DEFAULT_UPSELLS } from '@/lib/storeOptions';
import { renderPreview } from '@/lib/storeTemplate';
import { MAX_PHOTOS, MAX_PRODUCTS, imagePath, newProductId, normalizeConfig } from '@/lib/storeConfig';
import { normalizeDomain } from '@/lib/domains';
import DomainPanel from '@/components/DomainPanel';
import HeaderBar from '@/components/HeaderBar';
import Icon from '@/components/Icon';

const STEPS = ['Productos', 'Color', 'Fuente', 'Upsells', 'Lanzar'];

// Reduce la foto a máx. 1200px y la pasa a JPEG para que la tienda cargue rápido
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

const padPhotos = (images) => [...images, ...Array(MAX_PHOTOS).fill(null)].slice(0, MAX_PHOTOS);

const emptyProduct = () => ({
  id: newProductId(),
  name: '',
  price: '',
  comparePrice: '',
  description: '',
  images: padPhotos([]),
});

/** Al editar: lo guardado en la tienda → el estado del creador (las fotos se ven desde la tienda publicada). */
function fromSaved(config, url) {
  const c = normalizeConfig(config);
  return c.products.map((p) => ({
    id: p.id,
    name: p.name || '',
    price: p.price ? String(p.price) : '',
    comparePrice: p.comparePrice ? String(p.comparePrice) : '',
    description: p.description || '',
    images: padPhotos(
      (p.images || []).map((img) => ({ key: img.sha, src: url + imagePath(img.sha), sha: img.sha, size: img.size, status: 'ok' }))
    ),
  }));
}

/** Qué le falta a un producto para poder publicarlo (o null si está completo). */
function missingOf(p) {
  if (p.images.some((i) => i?.status === 'uploading')) return 'Subiendo fotos…';
  if (!p.images.some((i) => i?.status === 'ok')) return 'Falta al menos una foto';
  if (!p.name.trim()) return 'Falta el nombre';
  if (!(Number(p.price) > 0)) return 'Falta el precio';
  return null;
}
const productReady = (p) => !missingOf(p);

/**
 * Creador de tiendas. Con `initial` ({ storeId, url, config }) sirve para editar una tienda ya publicada.
 */
export default function Wizard({ user, name, initial = null }) {
  const editing = !!initial;
  const saved = initial ? normalizeConfig(initial.config) : null;

  const [step, setStep] = useState(0);
  const [products, setProducts] = useState(() => (initial ? fromSaved(initial.config, initial.url) : [emptyProduct()]));
  const [active, setActive] = useState(0);
  const [color, setColor] = useState(saved?.color || COLORS[0].value);
  const [font, setFont] = useState(saved?.font || FONTS[0].name);
  const [upsells, setUpsells] = useState(saved?.upsells || DEFAULT_UPSELLS);
  const [details, setDetails] = useState({
    storeName: saved?.storeName || '',
    paymentLink: saved?.paymentLink || '',
    contactEmail: saved?.contactEmail || '',
  });
  const [domain, setDomain] = useState('');
  const [device, setDevice] = useState('desktop');
  const [previewPage, setPreviewPage] = useState(0);
  const [launch, setLaunch] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);
  const replaceSlot = useRef(null);

  const product = products[active] || products[0];
  const photoCount = product.images.filter(Boolean).length;
  const productsOk = products.every(productReady);
  const detailsOk = !!details.storeName.trim();
  const linkOk = !details.paymentLink || /^https:\/\//.test(details.paymentLink);
  const cleanDomain = normalizeDomain(domain);
  const domainOk = editing || !domain.trim() || !!cleanDomain;
  const canNext = step === 0 ? productsOk : true;
  const busy = launch.status === 'sending' || launch.status === 'deploying';

  // Mientras edita un producto, la vista previa enseña ese producto
  useEffect(() => {
    if (step === 0) setPreviewPage(active);
  }, [active, step]);

  const previewHtml = useMemo(
    () =>
      renderPreview(
        {
          ...details,
          color,
          font,
          upsells,
          launchEndsAt: saved?.launchEndsAt || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          products: products.map((p) => ({ ...p, images: p.images.filter((i) => i && i.status !== 'error') })),
        },
        { imageUrl: (img) => img.src, page: products.length > 1 ? previewPage : 'home' }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [details, color, font, upsells, products, previewPage]
  );

  function updateProduct(i, patch) {
    setProducts((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  function patchImage(productId, key, patch) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId ? p : { ...p, images: p.images.map((img) => (img?.key === key ? (patch ? { ...img, ...patch } : null) : img)) }
      )
    );
  }

  // Cada foto se sube en cuanto se elige; al publicar solo se manda su sha
  async function upload(productId, key, dataUrl) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl.split(',')[1] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      patchImage(productId, key, { sha: data.sha, size: data.size, status: 'ok' });
    } catch {
      patchImage(productId, key, { status: 'error' });
    }
  }

  async function addFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const { id: productId } = product;
    const resized = await Promise.all(files.map(resizeImage));
    const added = resized.map((src) => ({ key: Math.random().toString(36).slice(2), src, status: 'uploading' }));
    const slot = replaceSlot.current;
    replaceSlot.current = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const next = [...p.images];
        if (slot !== null) next[slot] = added[0];
        else
          for (const a of added) {
            const empty = next.indexOf(null);
            if (empty === -1) break;
            next[empty] = a;
          }
        return { ...p, images: next };
      })
    );
    (slot !== null ? added.slice(0, 1) : added).forEach((a) => upload(productId, a.key, a.src));
  }

  function pickFor(slot) {
    replaceSlot.current = slot;
    fileInput.current?.click();
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()]);
    setActive(products.length);
  }

  function removeProduct(i) {
    if (!confirm(`¿Quitar «${products[i].name || `Producto ${i + 1}`}» de la tienda?`)) return;
    setProducts((prev) => prev.filter((_, j) => j !== i));
    setActive((a) => Math.max(0, a >= i ? a - 1 : a));
  }

  function toggleUpsell(id) {
    setUpsells((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  const set = (key) => (e) => setDetails((d) => ({ ...d, [key]: e.target.value }));
  const setP = (key) => (e) => updateProduct(active, { [key]: e.target.value });

  async function handleLaunch() {
    setLaunch({ status: 'sending' });
    try {
      const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: initial?.storeId,
          config: {
            ...details,
            color,
            font,
            upsells,
            products: products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              comparePrice: p.comparePrice,
              description: p.description,
              images: p.images.filter((i) => i?.status === 'ok').map((i) => ({ sha: i.sha, size: i.size })),
            })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al lanzar la tienda');
      setLaunch({ status: 'deploying', id: data.id, projectName: data.projectName, storeId: data.storeId });
    } catch (err) {
      setLaunch({ status: 'error', error: err.message });
    }
  }

  // Mientras Vercel publica la tienda, preguntamos cada 3 s si ya está lista
  useEffect(() => {
    if (launch.status !== 'deploying') return;
    let cancelled = false;
    const started = Date.now();
    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/status?id=${launch.id}&name=${encodeURIComponent(launch.projectName)}`);
        const data = await res.json();
        if (data.state === 'READY' && data.url) return setLaunch((l) => ({ ...l, status: 'ready', url: data.url }));
        if (data.state === 'ERROR' || data.state === 'CANCELED')
          return setLaunch({ status: 'error', error: 'Vercel no pudo publicar la tienda. Inténtalo de nuevo.' });
      } catch {}
      if (Date.now() - started > 180000)
        return setLaunch({ status: 'error', error: 'Está tardando demasiado. Inténtalo de nuevo en un momento.' });
      setTimeout(poll, 3000);
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [launch.status, launch.id, launch.projectName]);

  if (launch.status === 'ready') {
    const shownUrl = editing ? initial.url : launch.url;
    return (
      <div className="done">
        <div className="done-card">
          <div className="done-icon ok">
            <Icon name="check" size={26} strokeWidth={2.2} />
          </div>
          <h1>{editing ? '¡Cambios publicados!' : '¡Tu tienda está online!'}</h1>
          <p>
            {editing
              ? 'Tu tienda ya se ve con los cambios (si no, recarga la página de la tienda).'
              : 'Ya puedes compartir este enlace o ponerlo en tus anuncios de TikTok:'}
          </p>
          <div className="link-box">
            <a href={shownUrl} target="_blank" rel="noreferrer">
              {shownUrl.replace('https://', '')}
            </a>
            <button
              className="btn btn-dark btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(shownUrl);
                setCopied(true);
              }}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <a href={shownUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-xl">
            Abrir mi tienda <Icon name="external" />
          </a>
          <p className="hint">Siempre la tendrás guardada en «Mis tiendas».</p>
          {!editing && launch.storeId && <DomainPanel storeId={launch.storeId} pendingDomain={cleanDomain || ''} />}
          <div className="done-links">
            <Link href="/mis-tiendas" className="text-btn">
              Ver mis tiendas
            </Link>
            {!editing && (
              <button className="text-btn" onClick={() => window.location.reload()}>
                Crear otra tienda
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // El primer producto incompleto (empezando por el que está abierto) y qué le falta
  const pendingIdx = missingOf(product) ? active : products.findIndex((p) => missingOf(p));
  const pendingLabel =
    pendingIdx === -1
      ? null
      : missingOf(products[pendingIdx]) +
        (products.length > 1 ? ` (${products[pendingIdx].name.trim() || `producto ${pendingIdx + 1}`})` : '');

  return (
    <div className="builder">
      <aside className="panel">
        <div className="panel-top">
          <HeaderBar user={user} name={name}>
            <Link href="/mis-tiendas" className="logout">
              Mis tiendas
            </Link>
          </HeaderBar>
          {editing && (
            <p className="editing-tag">
              <Icon name="edit" size={14} /> Editando «{saved.storeName}»
            </p>
          )}
          <div className="progress">
            {STEPS.map((s, i) => (
              <button
                key={s}
                className={`progress-step ${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`}
                onClick={() => (i < step || (productsOk && i <= 4) ? setStep(i) : null)}
              >
                <span>{i < step ? '✓' : i + 1}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {step === 0 && (
            <>
              <h2>{products.length > 1 ? 'Tus productos' : 'Tu producto'}</h2>
              <p className="muted">Sube de 1 a 4 fotos de cada producto. La primera será la principal.</p>

              <div className="product-tabs">
                {products.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`product-tab ${i === active ? 'on' : ''} ${productReady(p) ? '' : 'todo'}`}
                    onClick={() => setActive(i)}
                  >
                    {p.images.find((img) => img)?.src ? <img src={p.images.find((img) => img).src} alt="" /> : <span>{i + 1}</span>}
                    {p.name.trim() || `Producto ${i + 1}`}
                  </button>
                ))}
                {products.length < MAX_PRODUCTS && (
                  <button type="button" className="product-tab add" onClick={addProduct}>
                    + Añadir producto
                  </button>
                )}
              </div>

              <div
                className="photo-grid"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                {product.images.map((img, i) => (
                  <div key={i} className={`photo-slot ${img ? 'filled' : ''}`} onClick={() => pickFor(img ? i : null)}>
                    {img ? (
                      <>
                        <img src={img.src} alt={`Foto ${i + 1}`} />
                        {img.status === 'uploading' && <span className="photo-state">Subiendo…</span>}
                        {img.status === 'error' && <span className="photo-state err">Error: pulsa para cambiarla</span>}
                        <button
                          className="remove"
                          aria-label="Quitar foto"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProduct(active, { images: product.images.map((p, j) => (j === i ? null : p)) });
                          }}
                        >
                          ×
                        </button>
                        {i === product.images.findIndex(Boolean) && <span className="main-tag">Principal</span>}
                      </>
                    ) : (
                      <span className="slot-empty">
                        <b>+</b>
                        Foto {i + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <p className="counter">{photoCount}/4 fotos · puedes arrastrarlas aquí</p>

              <div className="form">
                <label>
                  Nombre del producto *
                  <input value={product.name} onChange={setP('name')} placeholder="Ej: Lámpara de atardecer LED" maxLength={80} />
                </label>
                <div className="form-row">
                  <label>
                    Precio (€) *
                    <input type="number" min="0" step="0.01" value={product.price} onChange={setP('price')} placeholder="29.99" />
                  </label>
                  <label>
                    Precio antes (€)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.comparePrice}
                      onChange={setP('comparePrice')}
                      placeholder="59.99"
                    />
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea
                    rows={4}
                    value={product.description}
                    onChange={setP('description')}
                    placeholder="¿Qué hace tu producto y por qué lo van a querer?"
                    maxLength={1500}
                  />
                </label>
              </div>
              {products.length > 1 && (
                <button type="button" className="text-btn" onClick={() => removeProduct(active)}>
                  Quitar este producto
                </button>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h2>¿De qué color es tu marca?</h2>
              <p className="muted">Se usará en botones, precios y detalles de la tienda.</p>
              <div className="color-grid">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`color-opt ${color === c.value ? 'on' : ''}`}
                    onClick={() => setColor(c.value)}
                  >
                    <span className="swatch" style={{ background: c.value }} />
                    {c.name}
                  </button>
                ))}
              </div>
              <label className="custom-color">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <span>
                  Otro color personalizado <code>{color}</code>
                </span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Elige la fuente principal</h2>
              <p className="muted">La tipografía marca la personalidad de tu tienda.</p>
              <div className="font-list">
                {FONTS.map((f) => (
                  <button
                    key={f.name}
                    className={`font-opt ${font === f.name ? 'on' : ''}`}
                    onClick={() => setFont(f.name)}
                  >
                    <span className="font-sample" style={{ fontFamily: f.family }}>
                      {f.name}
                    </span>
                    <span className="font-vibe">{f.vibe}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Añade upsells</h2>
              <p className="muted">Hemos marcado los que mejor funcionan. Se aplican a todos tus productos.</p>
              <div className="upsell-list">
                {UPSELLS.map((u) => (
                  <label key={u.id} className={`upsell ${upsells.includes(u.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={upsells.includes(u.id)} onChange={() => toggleUpsell(u.id)} />
                    <span>
                      <b>
                        {u.title}
                        {u.price ? <em> +{u.price.toFixed(2).replace('.', ',')} €</em> : null}
                      </b>
                      <small>{u.desc}</small>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>{editing ? 'Revisa y publica los cambios' : 'Últimos detalles y ¡a lanzar!'}</h2>
              <div className="form">
                <label>
                  Nombre de tu tienda *
                  <input value={details.storeName} onChange={set('storeName')} placeholder="Ej: GlowHome" maxLength={40} />
                </label>
                <label>
                  Email de contacto
                  <input type="email" value={details.contactEmail} onChange={set('contactEmail')} placeholder="hola@tutienda.com" />
                  <span className="field-hint">Sale en la tienda para que tus clientes te escriban.</span>
                </label>
                <label>
                  Enlace de pago propio (opcional)
                  <input
                    value={details.paymentLink}
                    onChange={set('paymentLink')}
                    placeholder="https://buy.stripe.com/..."
                  />
                  {linkOk ? (
                    <span className="field-hint">
                      Si conectas tus cobros con tarjeta en «Mis tiendas», no hace falta: el pago se hace dentro de tu tienda.
                    </span>
                  ) : (
                    <span className="field-error">Tiene que empezar por https://</span>
                  )}
                </label>
                {!editing && (
                  <label>
                    Tu dominio (opcional)
                    <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mitienda.com" />
                    {domainOk ? (
                      <span className="field-hint">
                        ¿Ya compraste un dominio? Ponlo aquí y lo conectamos. Si no, tu tienda tendrá un enlace gratis.
                      </span>
                    ) : (
                      <span className="field-error">Escribe solo el dominio, por ejemplo: mitienda.com</span>
                    )}
                  </label>
                )}
              </div>

              {launch.status === 'error' && <div className="alert">{launch.error}</div>}
            </>
          )}
        </div>

        <div className="panel-foot">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              ← Atrás
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn-primary grow" disabled={!canNext} onClick={() => setStep(step + 1)}>
              {step === 0 && pendingLabel ? pendingLabel : 'Siguiente →'}
            </button>
          ) : (
            <button
              className="btn btn-primary grow"
              disabled={!detailsOk || !productsOk || !linkOk || !domainOk || busy}
              onClick={handleLaunch}
            >
              {launch.status === 'sending'
                ? 'Subiendo tu tienda…'
                : launch.status === 'deploying'
                  ? 'Publicando en internet…'
                  : editing
                    ? 'Publicar cambios'
                    : 'Lanzar mi tienda'}
            </button>
          )}
        </div>
      </aside>

      <section className="preview">
        <div className="preview-bar">
          <span>Vista previa en directo</span>
          <div className="preview-controls">
            {products.length > 1 && (
              <select
                value={previewPage}
                onChange={(e) => setPreviewPage(e.target.value === 'home' ? 'home' : Number(e.target.value))}
                aria-label="Página de la vista previa"
              >
                <option value="home">Portada (todos)</option>
                {products.map((p, i) => (
                  <option key={p.id} value={i}>
                    {p.name.trim() || `Producto ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
            <div className="device-toggle">
              <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>
                Ordenador
              </button>
              <button className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')}>
                Móvil
              </button>
            </div>
          </div>
        </div>
        <div className={`frame ${device}`}>
          <div className="frame-chrome">
            <i />
            <i />
            <i />
            <span>
              {editing
                ? initial.url.replace('https://', '')
                : cleanDomain ||
                  `${details.storeName ? details.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'tu-tienda'}.vercel.app`}
            </span>
          </div>
          <iframe title="Vista previa de la tienda" srcDoc={previewHtml} sandbox="allow-scripts" />
        </div>
      </section>
    </div>
  );
}
