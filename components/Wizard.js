'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { renderPreview } from '@/lib/storeTemplate';
import { normalizeDomain } from '@/lib/domains';
import DomainPanel from '@/components/DomainPanel';
import HeaderBar from '@/components/HeaderBar';
import Icon from '@/components/Icon';
import ProductStep from '@/components/editor/ProductStep';
import DesignStep from '@/components/editor/DesignStep';
import UpsellStep from '@/components/editor/UpsellStep';
import ContentStep from '@/components/editor/ContentStep';
import LaunchStep from '@/components/editor/LaunchStep';
import TemplatePicker from '@/components/editor/TemplatePicker';
import { buildConfig, emptyProduct, fromSaved, missingOf, newStore, padPhotos, productReady } from '@/components/editor/model';

const STEPS = ['Productos', 'Diseño', 'Upsells', 'Contenido', 'Lanzar'];
const LAST = STEPS.length - 1;

// Reduce la imagen y la convierte para que la tienda cargue rápido:
// fotos de producto a JPEG de 1200 px; el logo a PNG de 400 px (conserva la transparencia)
function resizeImage(file, { max = 1200, type = 'image/jpeg' } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(type, 0.82));
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

// Cada imagen se sube en cuanto se elige; al publicar solo se manda su sha
async function uploadImage(dataUrl) {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl.split(',')[1] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error);
  return { sha: data.sha, size: data.size, status: 'ok' };
}

/**
 * Creador y editor de tiendas. Con `initial` ({ storeId, url, config }) sirve para editar una tienda ya publicada.
 */
export default function Wizard({ user, name, initial = null }) {
  const editing = !!initial;
  const [start] = useState(() => (initial ? fromSaved(initial.config, initial.url) : { store: newStore(), products: [emptyProduct()] }));
  const savedName = initial?.config?.storeName;

  const [step, setStep] = useState(0);
  const [store, setStore] = useState(start.store);
  const [products, setProducts] = useState(start.products);
  const [active, setActive] = useState(0);
  const [domain, setDomain] = useState('');
  const [device, setDevice] = useState('desktop');
  const [previewPage, setPreviewPage] = useState(0);
  const [launch, setLaunch] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  // Las plantillas solo se ofrecen al crear una tienda, hasta que se elige una o se empieza de cero
  const [showTemplates, setShowTemplates] = useState(!initial);
  const fileInput = useRef(null);
  const replaceSlot = useRef(null);

  const product = products[active] || products[0];
  const photoCount = product.images.filter(Boolean).length;
  const productsOk = products.every(productReady);
  const logoBusy = store.logo?.status === 'uploading';
  const detailsOk = !!store.storeName.trim();
  const linkOk = !store.paymentLink || /^https:\/\//.test(store.paymentLink);
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
          ...buildConfig(store, products, { preview: true }),
          launchEndsAt: initial?.config?.launchEndsAt || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        },
        { imageUrl: (img) => img.src, page: products.length > 1 ? previewPage : 'home' }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, products, previewPage]
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

  async function addFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const { id: productId } = product;
    const resized = await Promise.all(files.map((f) => resizeImage(f)));
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
    (slot !== null ? added.slice(0, 1) : added).forEach((a) =>
      uploadImage(a.src)
        .then((done) => patchImage(productId, a.key, done))
        .catch(() => patchImage(productId, a.key, { status: 'error' }))
    );
  }

  // Plantilla: estilo de tienda + un producto de ejemplo con su foto (que se sube como cualquier otra)
  async function applyTemplate(t) {
    setShowTemplates(false);
    const key = Math.random().toString(36).slice(2);
    const product = { ...emptyProduct(), ...t.product, images: padPhotos([{ key, src: t.image, status: 'uploading' }]) };
    setStore((s) => ({ ...s, ...t.store }));
    setProducts([product]);
    setActive(0);
    try {
      const blob = await (await fetch(t.image)).blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      patchImage(product.id, key, { src: dataUrl, ...(await uploadImage(dataUrl)) });
    } catch {
      patchImage(product.id, key, { status: 'error' });
    }
  }

  async function addLogo(file) {
    const src = await resizeImage(file, { max: 400, type: 'image/png' });
    const key = Math.random().toString(36).slice(2);
    setStore((s) => ({ ...s, logo: { key, src, status: 'uploading' } }));
    const patch = await uploadImage(src).catch(() => ({ status: 'error' }));
    setStore((s) => (s.logo?.key === key ? { ...s, logo: { ...s.logo, ...patch } } : s));
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

  async function handleLaunch() {
    setLaunch({ status: 'sending' });
    try {
      const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: initial?.storeId, config: buildConfig(store, products) }),
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

  const photos = (
    <>
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
    </>
  );

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
              <Icon name="edit" size={14} /> Editando «{savedName}»
            </p>
          )}
          <div className="progress">
            {STEPS.map((s, i) => (
              <button
                key={s}
                className={`progress-step ${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`}
                onClick={() => (i < step || productsOk ? setStep(i) : null)}
              >
                <span>{i < step ? '✓' : i + 1}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {step === 0 && (
            <ProductStep
              products={products}
              active={active}
              setActive={setActive}
              updateProduct={updateProduct}
              addProduct={addProduct}
              removeProduct={removeProduct}
              photos={photos}
              templates={
                showTemplates && <TemplatePicker onPick={applyTemplate} onSkip={() => setShowTemplates(false)} />
              }
            />
          )}
          {step === 1 && (
            <DesignStep
              store={store}
              setStore={setStore}
              multi={products.length > 1}
              onLogo={addLogo}
              removeLogo={() => setStore((s) => ({ ...s, logo: null }))}
            />
          )}
          {step === 2 && <UpsellStep store={store} setStore={setStore} />}
          {step === 3 && <ContentStep store={store} setStore={setStore} />}
          {step === LAST && (
            <LaunchStep
              store={store}
              setStore={setStore}
              editing={editing}
              domain={domain}
              setDomain={setDomain}
              domainOk={domainOk}
              linkOk={linkOk}
              error={launch.status === 'error' ? launch.error : ''}
            />
          )}
        </div>

        <div className="panel-foot">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              ← Atrás
            </button>
          )}
          {step < LAST ? (
            <button className="btn btn-primary grow" disabled={!canNext} onClick={() => setStep(step + 1)}>
              {step === 0 && pendingLabel ? pendingLabel : 'Siguiente →'}
            </button>
          ) : (
            <button
              className="btn btn-primary grow"
              disabled={!detailsOk || !productsOk || !linkOk || !domainOk || logoBusy || busy}
              onClick={handleLaunch}
            >
              {launch.status === 'sending'
                ? 'Subiendo tu tienda…'
                : launch.status === 'deploying'
                  ? 'Publicando en internet…'
                  : logoBusy
                    ? 'Subiendo el logo…'
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
                  `${store.storeName ? store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'tu-tienda'}.vercel.app`}
            </span>
          </div>
          <iframe title="Vista previa de la tienda" srcDoc={previewHtml} sandbox="allow-scripts" />
        </div>
      </section>
    </div>
  );
}
