'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { COLORS, FONTS, UPSELLS, DEFAULT_UPSELLS } from '@/lib/storeOptions';
import { renderStore } from '@/lib/storeTemplate';
import { normalizeDomain } from '@/lib/domains';
import DomainPanel from '@/components/DomainPanel';

const STEPS = ['Fotos', 'Color', 'Fuente', 'Upsells', 'Lanzar'];

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

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState([null, null, null, null]);
  const [color, setColor] = useState(COLORS[0].value);
  const [font, setFont] = useState(FONTS[0].name);
  const [upsells, setUpsells] = useState(DEFAULT_UPSELLS);
  const [details, setDetails] = useState({
    storeName: '',
    productName: '',
    price: '',
    comparePrice: '',
    description: '',
    paymentLink: '',
    contactEmail: '',
  });
  const [domain, setDomain] = useState('');
  const [device, setDevice] = useState('desktop');
  const [launch, setLaunch] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);
  const replaceSlot = useRef(null);

  const photoCount = images.filter(Boolean).length;
  const detailsOk = details.storeName.trim() && details.productName.trim() && Number(details.price) > 0;
  const linkOk = !details.paymentLink || /^https:\/\//.test(details.paymentLink);
  const cleanDomain = normalizeDomain(domain);
  const domainOk = !domain.trim() || !!cleanDomain;
  const canNext = step === 0 ? photoCount === 4 : true;

  const config = useMemo(
    () => ({
      ...details,
      color,
      font,
      upsells,
      launchEndsAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    }),
    [details, color, font, upsells]
  );
  const previewHtml = useMemo(() => renderStore(config, images), [config, images]);

  async function addFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const resized = await Promise.all(files.map(resizeImage));
    setImages((prev) => {
      const next = [...prev];
      if (replaceSlot.current !== null) {
        next[replaceSlot.current] = resized[0];
        replaceSlot.current = null;
        return next;
      }
      for (const r of resized) {
        const empty = next.indexOf(null);
        if (empty === -1) break;
        next[empty] = r;
      }
      return next;
    });
  }

  function pickFor(slot) {
    replaceSlot.current = slot;
    fileInput.current?.click();
  }

  function toggleUpsell(id) {
    setUpsells((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  const set = (key) => (e) => setDetails((d) => ({ ...d, [key]: e.target.value }));

  async function handleLaunch() {
    setLaunch({ status: 'sending' });
    try {
      const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...details, color, font, upsells },
          images: images.map((d) => d.split(',')[1]),
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
    return (
      <div className="done">
        <div className="done-card">
          <div className="done-emoji">🎉</div>
          <h1>¡Tu tienda está online!</h1>
          <p>Ya puedes compartir este enlace o ponerlo en tus anuncios de TikTok:</p>
          <div className="link-box">
            <a href={launch.url} target="_blank" rel="noreferrer">
              {launch.url.replace('https://', '')}
            </a>
            <button
              className="btn btn-dark btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(launch.url);
                setCopied(true);
              }}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <a href={launch.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-xl">
            Abrir mi tienda ↗
          </a>
          <p className="hint">Siempre la tendrás guardada en «Mis tiendas».</p>
          {launch.storeId && <DomainPanel storeId={launch.storeId} pendingDomain={cleanDomain || ''} />}
          <div className="done-links">
            <Link href="/mis-tiendas" className="text-btn">
              Ver mis tiendas
            </Link>
            <button className="text-btn" onClick={() => window.location.reload()}>
              Crear otra tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="builder">
      <aside className="panel">
        <div className="panel-top">
          <div className="row">
            <Link href="/" className="brand">
              Lanza<span>Tienda</span>
            </Link>
            <div className="header-actions">
              <Link href="/mis-tiendas" className="logout">
                Mis tiendas
              </Link>
              <form action="/auth/salir" method="post">
                <button className="logout">Salir</button>
              </form>
            </div>
          </div>
          <div className="progress">
            {STEPS.map((s, i) => (
              <button
                key={s}
                className={`progress-step ${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`}
                onClick={() => (i < step || (photoCount === 4 && i <= 4) ? setStep(i) : null)}
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
              <h2>Sube 4 fotos de tu producto</h2>
              <p className="muted">La primera será la foto principal. Mejor si son cuadradas y con buena luz.</p>
              <div
                className="photo-grid"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                {images.map((src, i) => (
                  <div key={i} className={`photo-slot ${src ? 'filled' : ''}`} onClick={() => pickFor(src ? i : null)}>
                    {src ? (
                      <>
                        <img src={src} alt={`Foto ${i + 1}`} />
                        <button
                          className="remove"
                          aria-label="Quitar foto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImages((prev) => prev.map((p, j) => (j === i ? null : p)));
                          }}
                        >
                          ×
                        </button>
                        {i === 0 && <span className="main-tag">Principal</span>}
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
              <p className="muted">Hemos marcado los que mejor funcionan. Elige los que quieras.</p>
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
              <h2>Últimos detalles y ¡a lanzar!</h2>
              <div className="form">
                <label>
                  Nombre de tu tienda *
                  <input value={details.storeName} onChange={set('storeName')} placeholder="Ej: GlowHome" maxLength={40} />
                </label>
                <label>
                  Nombre del producto *
                  <input
                    value={details.productName}
                    onChange={set('productName')}
                    placeholder="Ej: Lámpara de atardecer LED"
                    maxLength={80}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Precio (€) *
                    <input type="number" min="0" step="0.01" value={details.price} onChange={set('price')} placeholder="29.99" />
                  </label>
                  <label>
                    Precio antes (€)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={details.comparePrice}
                      onChange={set('comparePrice')}
                      placeholder="59.99"
                    />
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea
                    rows={4}
                    value={details.description}
                    onChange={set('description')}
                    placeholder="¿Qué hace tu producto y por qué lo van a querer?"
                    maxLength={1500}
                  />
                </label>
                <label>
                  Enlace de pago (Stripe, PayPal…)
                  <input
                    value={details.paymentLink}
                    onChange={set('paymentLink')}
                    placeholder="https://buy.stripe.com/..."
                  />
                  {!linkOk && <span className="field-error">Tiene que empezar por https://</span>}
                </label>
                <label>
                  Email de contacto
                  <input type="email" value={details.contactEmail} onChange={set('contactEmail')} placeholder="hola@tutienda.com" />
                  <span className="field-hint">Si no pones enlace de pago, los pedidos te llegarán a este email.</span>
                </label>
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
              </div>

              {launch.status === 'error' && <div className="alert">{launch.error}</div>}
            </>
          )}
        </div>

        <div className="panel-foot">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={launch.status !== 'idle' && launch.status !== 'error'}>
              ← Atrás
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn-primary grow" disabled={!canNext} onClick={() => setStep(step + 1)}>
              {step === 0 && photoCount < 4 ? `Faltan ${4 - photoCount} fotos` : 'Siguiente →'}
            </button>
          ) : (
            <button
              className="btn btn-primary grow"
              disabled={!detailsOk || !linkOk || !domainOk || launch.status === 'sending' || launch.status === 'deploying'}
              onClick={handleLaunch}
            >
              {launch.status === 'sending'
                ? 'Subiendo tu tienda…'
                : launch.status === 'deploying'
                  ? 'Publicando en internet…'
                  : '🚀 Lanzar mi tienda'}
            </button>
          )}
        </div>
      </aside>

      <section className="preview">
        <div className="preview-bar">
          <span>Vista previa en directo</span>
          <div className="device-toggle">
            <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>
              Ordenador
            </button>
            <button className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')}>
              Móvil
            </button>
          </div>
        </div>
        <div className={`frame ${device}`}>
          <div className="frame-chrome">
            <i />
            <i />
            <i />
            <span>
              {cleanDomain ||
                `${details.storeName ? details.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'tu-tienda'}.vercel.app`}
            </span>
          </div>
          <iframe title="Vista previa de la tienda" srcDoc={previewHtml} sandbox="allow-scripts" />
        </div>
      </section>
    </div>
  );
}
