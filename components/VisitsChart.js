'use client';

import { useEffect, useRef, useState } from 'react';

const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 34 };

const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

/** "Bonito" máximo del eje: 1, 2, 5, 10, 20, 50… */
function niceMax(n) {
  if (n <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(n));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= n);
}

/** Barras de visitas por día, con el dato de cada día al pasar el ratón o tocar. */
export default function VisitsChart({ daily }) {
  const [hover, setHover] = useState(null);
  const [W, setW] = useState(720);
  const box = useRef(null);

  // El gráfico mide lo mismo que su caja, para que el texto no se vea diminuto en el móvil
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  if (!daily.length) return <p className="drawer-empty">Sin datos todavía.</p>;

  const max = niceMax(Math.max(...daily.map((d) => d.views)));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const step = iw / daily.length;
  const bw = Math.max(2, Math.min(28, step - 2));
  const y = (v) => PAD.top + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(daily.length / Math.max(2, Math.floor(W / 110)));
  const h = hover != null ? daily[hover] : null;

  return (
    <div className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitas por día" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="axis">
              {t}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const x = PAD.left + i * step + (step - bw) / 2;
          const bh = PAD.top + ih - y(d.views);
          const r = Math.min(4, bw / 2, bh); // punta redondeada, la base pegada al eje
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              {/* zona de toque más grande que la barra */}
              <rect x={PAD.left + i * step} y={PAD.top} width={step} height={ih} fill="transparent" />
              {d.views > 0 && (
                <path
                  className={`bar ${hover === i ? 'on' : ''}`}
                  d={`M${x},${PAD.top + ih} v${r - bh} q0,${-r} ${r},${-r} h${bw - 2 * r} q${r},0 ${r},${r} v${bh - r} z`}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={PAD.left + i * step + step / 2} y={H - 8} textAnchor="middle" className="axis">
                  {fmtDay(d.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="chart-tip" aria-live="polite">
        {h ? (
          <>
            <b>{fmtDay(h.day)}</b> · {h.views} visitas · {h.visitors} visitantes
          </>
        ) : (
          'Pasa el ratón (o toca) una barra para ver el día'
        )}
      </div>
    </div>
  );
}
