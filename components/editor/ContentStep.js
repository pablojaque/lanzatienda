'use client';

import { DEFAULT_FAQ } from '@/lib/storeOptions';
import { MAX_CUSTOM_CODE, MAX_FAQ, MAX_REVIEWS } from '@/lib/storeConfig';
import { ListEditor, Section } from '@/components/editor/ui';

/** Paso 4: opiniones de clientes y preguntas frecuentes. */
export default function ContentStep({ store, setStore }) {
  const set = (patch) => setStore((s) => ({ ...s, ...patch }));
  const enable = (id, list) => (list.length && !store.upsells.includes(id) ? { upsells: [...store.upsells, id] } : {});

  return (
    <>
      <h2>Contenido</h2>
      <p className="muted">Lo que da confianza antes de comprar.</p>

      <Section
        title="Opiniones de clientes"
        hint="Usa opiniones reales de tus clientes (por ejemplo, las que te mandan por WhatsApp o Instagram). Salen con su nota media."
      >
        <ListEditor
          items={store.reviews}
          max={MAX_REVIEWS}
          empty={() => ({ name: '', text: '', rating: 5 })}
          addLabel="Añadir opinión"
          onChange={(reviews) => set({ reviews, ...enable('reviews', reviews) })}
          renderItem={(r, update) => (
            <div className="ed-review">
              <div className="form-row">
                <input
                  value={r.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Nombre (Ej: Laura M.)"
                  maxLength={40}
                />
                <select value={r.rating} onChange={(e) => update({ rating: Number(e.target.value) })} aria-label="Nota">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {'★'.repeat(n)} {n}/5
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={r.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Qué le pareció el producto"
                maxLength={400}
              />
            </div>
          )}
        />
      </Section>

      <Section
        title="Preguntas frecuentes"
        hint="Resuelve las dudas que frenan la compra: envíos, tallas, devoluciones…"
        action={
          <button type="button" className="text-btn ed-reset" onClick={() => set({ faq: DEFAULT_FAQ.map((f) => ({ ...f })) })}>
            Restaurar ejemplo
          </button>
        }
      >
        <ListEditor
          items={store.faq}
          max={MAX_FAQ}
          empty={() => ({ q: '', a: '' })}
          addLabel="Añadir pregunta"
          onChange={(faq) => set({ faq, ...enable('faq', faq) })}
          renderItem={(f, update) => (
            <div className="ed-review">
              <input value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Pregunta" maxLength={150} />
              <textarea
                rows={2}
                value={f.a}
                onChange={(e) => update({ a: e.target.value })}
                placeholder="Respuesta"
                maxLength={800}
              />
            </div>
          )}
        />
      </Section>

      <details className="ed-more">
        <summary>Código personalizado (avanzado)</summary>
        <p className="ed-hint">
          Aquí guarda el asistente de IA los estilos y secciones que crea para tu tienda. Puedes borrarlo para quitarlos. No se
          permiten scripts.
        </p>
        <label className="ed-label">Sección propia (HTML, sale debajo del producto)</label>
        <textarea
          className="ed-code"
          rows={6}
          value={store.customHtml}
          onChange={(e) => set({ customHtml: e.target.value })}
          maxLength={MAX_CUSTOM_CODE}
          spellCheck={false}
        />
        <label className="ed-label">Estilos (CSS)</label>
        <textarea
          className="ed-code"
          rows={6}
          value={store.customCss}
          onChange={(e) => set({ customCss: e.target.value })}
          maxLength={MAX_CUSTOM_CODE}
          spellCheck={false}
        />
      </details>
    </>
  );
}
