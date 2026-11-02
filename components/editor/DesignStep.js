'use client';

import { BUTTON_STYLES, COLORS, FONTS, THEMES } from '@/lib/storeOptions';
import { Choice, Section } from '@/components/editor/ui';
import Icon from '@/components/Icon';

/** Paso 2: cómo se ve la tienda (logo, colores, fondo, botones y letra). */
export default function DesignStep({ store, setStore, multi, onLogo, removeLogo }) {
  const set = (patch) => setStore((s) => ({ ...s, ...patch }));

  return (
    <>
      <h2>Diseño de tu tienda</h2>
      <p className="muted">Que parezca una marca de verdad. Los cambios se ven al momento en la vista previa.</p>

      <Section title="Logo" hint="Opcional. Mejor en PNG con fondo transparente. Si no subes uno, se usa el nombre de la tienda.">
        <div className="logo-box">
          {store.logo ? (
            <>
              <div className={`logo-preview ${store.theme}`}>
                <img src={store.logo.src} alt="Logo" />
                {store.logo.status === 'uploading' && <span className="photo-state">Subiendo…</span>}
                {store.logo.status === 'error' && <span className="photo-state err">Error al subir</span>}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={removeLogo}>
                Quitar logo
              </button>
            </>
          ) : (
            <label className="btn btn-ghost btn-sm">
              <Icon name="plus" /> Subir logo
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && onLogo(e.target.files[0])} />
            </label>
          )}
        </div>
      </Section>

      <Section title="Color de marca" hint="Se usa en botones, precios y detalles.">
        <div className="color-grid">
          {COLORS.map((c) => (
            <button key={c.value} className={`color-opt ${store.color === c.value ? 'on' : ''}`} onClick={() => set({ color: c.value })}>
              <span className="swatch" style={{ background: c.value }} />
              {c.name}
            </button>
          ))}
        </div>
        <label className="custom-color">
          <input type="color" value={store.color} onChange={(e) => set({ color: e.target.value })} />
          <span>
            Otro color personalizado <code>{store.color}</code>
          </span>
        </label>
      </Section>

      <Section title="Fondo">
        <Choice
          options={THEMES.map((t) => ({ ...t, preview: <span className={`theme-swatch ${t.id}`} /> }))}
          value={store.theme}
          onChange={(theme) => set({ theme })}
        />
      </Section>

      <Section title="Forma de los botones">
        <Choice
          options={BUTTON_STYLES.map((b) => ({
            ...b,
            preview: <span className="btn-swatch" style={{ borderRadius: b.radius, background: store.color }} />,
          }))}
          value={store.buttonStyle}
          onChange={(buttonStyle) => set({ buttonStyle })}
        />
      </Section>

      <Section title="Tipografía" hint="La letra marca la personalidad de tu tienda.">
        <div className="font-list">
          {FONTS.map((f) => (
            <button key={f.name} className={`font-opt ${store.font === f.name ? 'on' : ''}`} onClick={() => set({ font: f.name })}>
              <span className="font-sample" style={{ fontFamily: f.family }}>
                {f.name}
              </span>
              <span className="font-vibe">{f.vibe}</span>
            </button>
          ))}
        </div>
      </Section>

      {multi && (
        <Section title="Frase de la portada" hint="Sale bajo el nombre de la tienda, encima de tus productos.">
          <div className="form">
            <input value={store.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Descubre nuestros productos" maxLength={120} />
          </div>
        </Section>
      )}
    </>
  );
}
