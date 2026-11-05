'use client';

import { TEMPLATES } from '@/lib/templates';

/** Al crear una tienda: empezar con una plantilla de ejemplo (todo se puede cambiar después). */
export default function TemplatePicker({ onPick, onSkip }) {
  return (
    <section className="tpl">
      <div className="ed-head">
        <div>
          <h3>Empieza con una plantilla</h3>
          <p className="ed-hint">Colores, letra, upsells y un producto de ejemplo. Después lo cambias todo.</p>
        </div>
        <button type="button" className="text-btn ed-reset" onClick={onSkip}>
          Empezar de cero
        </button>
      </div>
      <div className="tpl-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" className="tpl-card" onClick={() => onPick(t)}>
            <img src={t.image} alt="" />
            <span>
              <b>{t.name}</b>
              <small>{t.desc}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
