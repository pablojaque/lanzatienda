'use client';

import { UPSELLS, UPSELL_GROUPS } from '@/lib/storeOptions';
import { MAX_CUSTOM_ADDONS, newProductId } from '@/lib/storeConfig';
import { ListEditor, Section } from '@/components/editor/ui';

const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';

/** Paso 3: todo lo que sube las ventas, con los ajustes de cada upsell al lado. */
export default function UpsellStep({ store, setStore }) {
  const set = (patch) => setStore((s) => ({ ...s, ...patch }));
  const on = (id) => store.upsells.includes(id);
  const toggle = (id) => set({ upsells: on(id) ? store.upsells.filter((u) => u !== id) : [...store.upsells, id] });

  // Ajustes que aparecen debajo de cada upsell cuando está activado
  function settings(id) {
    if (id === 'bundles')
      return (
        <div className="form-row">
          {[0, 1].map((i) => (
            <label key={i} className="ed-label">
              Descuento pack de {i + 2} (%)
              <input
                type="number"
                min="0"
                max="60"
                value={store.bundleOffs[i]}
                onChange={(e) => set({ bundleOffs: store.bundleOffs.map((v, j) => (j === i ? e.target.value : v)) })}
              />
            </label>
          ))}
        </div>
      );
    if (id === 'freeShippingBar')
      return (
        <label className="ed-label">
          Texto de la barra
          <input value={store.announcement} onChange={(e) => set({ announcement: e.target.value })} maxLength={120} />
        </label>
      );
    if (id === 'deliveryEstimate')
      return (
        <div className="form-row">
          {['min', 'max'].map((k) => (
            <label key={k} className="ed-label">
              {k === 'min' ? 'Llega en (días, mínimo)' : 'Llega en (días, máximo)'}
              <input
                type="number"
                min="1"
                max="90"
                value={store.shipping[k]}
                onChange={(e) => set({ shipping: { ...store.shipping, [k]: e.target.value } })}
              />
            </label>
          ))}
        </div>
      );
    if (id === 'reviews') return <p className="ed-hint">Escribe las opiniones en el paso «Contenido».</p>;
    if (id === 'faq') return <p className="ed-hint">Puedes cambiar las preguntas en el paso «Contenido».</p>;
    if (id === 'whatsapp') return <p className="ed-hint">Pon tu número en el paso «Lanzar».</p>;
    return null;
  }

  return (
    <>
      <h2>Upsells y conversión</h2>
      <p className="muted">Hemos marcado los que mejor funcionan. Se aplican a todos tus productos.</p>

      {UPSELL_GROUPS.map((g) => (
        <Section key={g.id} title={g.title}>
          <div className="upsell-list">
            {UPSELLS.filter((u) => u.group === g.id).map((u) => (
              <div key={u.id} className={`upsell ${on(u.id) ? 'on' : ''}`}>
                <label className="upsell-main">
                  <input type="checkbox" checked={on(u.id)} onChange={() => toggle(u.id)} />
                  <span>
                    <b>
                      {u.title}
                      {u.price ? <em> +{eur(u.price)}</em> : null}
                    </b>
                    <small>{u.desc}</small>
                  </span>
                </label>
                {on(u.id) && settings(u.id) && <div className="upsell-settings">{settings(u.id)}</div>}
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Extras propios" hint="Añade al pedido lo que quieras ofrecer: un cargador, una funda, garantía ampliada…">
        <ListEditor
          items={store.customAddons}
          max={MAX_CUSTOM_ADDONS}
          empty={() => ({ id: newProductId(), title: '', price: '' })}
          addLabel="Añadir extra"
          onChange={(customAddons) => set({ customAddons })}
          renderItem={(a, update) => (
            <div className="form-row ed-addon">
              <input value={a.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ej: Cargador rápido" maxLength={60} />
              <input type="number" min="0" step="0.01" value={a.price} onChange={(e) => update({ price: e.target.value })} placeholder="Precio €" />
            </div>
          )}
        />
      </Section>
    </>
  );
}
