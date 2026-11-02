'use client';

import { useEffect } from 'react';

/**
 * Interacción sutil con el cursor en la portada:
 * - [data-fx]: un foco de luz suave sigue al cursor (variables --mx/--my)
 * - [data-tilt]: la maqueta se inclina como mucho 2° hacia el cursor
 * - [data-depth]: tarjetas que se desplazan unos píxeles (parallax)
 * - .spot: el borde de las tarjetas se ilumina donde está el cursor (--x/--y)
 * No hace nada en pantallas táctiles ni si el usuario prefiere menos movimiento.
 */
export default function CursorFx() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;

    let frame = 0;
    let last = null;

    function apply() {
      frame = 0;
      const { clientX: x, clientY: y } = last;

      document.querySelectorAll('[data-fx]').forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${x - r.left}px`);
        el.style.setProperty('--my', `${y - r.top}px`);
      });

      // Posición del cursor respecto al centro de la pantalla, de -1 a 1
      const nx = (x / window.innerWidth) * 2 - 1;
      const ny = (y / window.innerHeight) * 2 - 1;
      document.querySelectorAll('[data-tilt]').forEach((el) => {
        el.style.setProperty('--ry', `${(nx * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-ny * 1.5).toFixed(2)}deg`);
      });
      document.querySelectorAll('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth) || 6;
        el.style.setProperty('--px', `${(nx * d).toFixed(1)}px`);
        el.style.setProperty('--py', `${(ny * d).toFixed(1)}px`);
      });

      document.querySelectorAll('.spot').forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', `${x - r.left}px`);
        el.style.setProperty('--y', `${y - r.top}px`);
      });
    }

    function onMove(e) {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
