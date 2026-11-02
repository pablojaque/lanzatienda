'use client';

import { MAX_BENEFITS, MAX_PRODUCTS } from '@/lib/storeConfig';
import { ListEditor, Section } from '@/components/editor/ui';
import { productReady } from '@/components/editor/model';

/** Paso 1: productos, con sus fotos, precios, texto, beneficios y opciones (talla, color…). */
export default function ProductStep({ products, active, setActive, updateProduct, addProduct, removeProduct, photos }) {
  const product = products[active] || products[0];
  const set = (key) => (e) => updateProduct(active, { [key]: e.target.value });

  return (
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

      {photos}

      <div className="form">
        <label>
          Nombre del producto *
          <input value={product.name} onChange={set('name')} placeholder="Ej: Lámpara de atardecer LED" maxLength={80} />
        </label>
        <div className="form-row">
          <label>
            Precio (€) *
            <input type="number" min="0" step="0.01" value={product.price} onChange={set('price')} placeholder="29.99" />
          </label>
          <label>
            Precio antes (€)
            <input type="number" min="0" step="0.01" value={product.comparePrice} onChange={set('comparePrice')} placeholder="59.99" />
          </label>
        </div>
        <label>
          Descripción
          <textarea
            rows={4}
            value={product.description}
            onChange={set('description')}
            placeholder="¿Qué hace tu producto y por qué lo van a querer?"
            maxLength={1500}
          />
        </label>
      </div>

      <Section title="Beneficios" hint="Frases cortas con un check al lado. Venden más que un párrafo largo.">
        <ListEditor
          items={product.benefits}
          max={MAX_BENEFITS}
          empty=""
          addLabel="Añadir beneficio"
          onChange={(benefits) => updateProduct(active, { benefits })}
          renderItem={(b, update) => (
            <input value={b} onChange={(e) => update(e.target.value)} placeholder="Ej: Carga en 2 horas, dura toda la noche" maxLength={90} />
          )}
        />
      </Section>

      <Section title="Opciones a elegir" hint="Si se vende en varias tallas, colores o modelos. Déjalo vacío si no.">
        <div className="form-row">
          <label className="ed-label">
            Nombre
            <input value={product.variantName} onChange={set('variantName')} placeholder="Color, Talla…" maxLength={30} />
          </label>
          <label className="ed-label">
            Valores (separados por comas)
            <input value={product.variantValues} onChange={set('variantValues')} placeholder="Blanco, Negro, Rosa" />
          </label>
        </div>
      </Section>

      {products.length > 1 && (
        <button type="button" className="text-btn" onClick={() => removeProduct(active)}>
          Quitar este producto
        </button>
      )}
    </>
  );
}
