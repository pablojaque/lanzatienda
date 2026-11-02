'use client';

import { useEffect } from 'react';

/** Marca la barra de arriba con un borde en cuanto se hace scroll. */
export default function NavShadow({ target = '.lp-nav' }) {
  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [target]);
  return null;
}
