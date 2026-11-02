'use client';

import Icon from '@/components/Icon';

/** Bloque con título dentro de un paso del editor. */
export function Section({ title, hint, children, action }) {
  return (
    <section className="ed-section">
      <div className="ed-head">
        <div>
          <h3>{title}</h3>
          {hint && <p className="ed-hint">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Lista editable (beneficios, extras, opiniones, preguntas…): una fila por elemento y botón para añadir. */
export function ListEditor({ items, max, onChange, empty, addLabel, renderItem }) {
  const update = (i, patch) => onChange(items.map((it, j) => (j === i ? (typeof it === 'object' ? { ...it, ...patch } : patch) : it)));
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div className="ed-list">
      {items.map((it, i) => (
        <div key={i} className="ed-item">
          <div className="ed-item-body">{renderItem(it, (patch) => update(i, patch), i)}</div>
          <button type="button" className="ed-remove" onClick={() => remove(i)} aria-label="Quitar">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="ed-add" onClick={() => onChange([...items, typeof empty === 'function' ? empty() : empty])}>
          <Icon name="plus" size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Botones para elegir una opción entre pocas (tema, forma de botones…). */
export function Choice({ options, value, onChange }) {
  return (
    <div className="ed-choice">
      {options.map((o) => (
        <button key={o.id} type="button" className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.preview}
          <b>{o.name}</b>
          {o.desc && <small>{o.desc}</small>}
        </button>
      ))}
    </div>
  );
}
