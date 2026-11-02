import Link from 'next/link';

/** Marca de Dropshype: doble flecha hacia arriba (subir, hype) en el color de la marca. */
export function LogoMark({ size = 28 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13l6-6 6 6" />
        <path d="M6 19l6-6 6 6" opacity="0.55" />
      </svg>
    </span>
  );
}

/** Logo completo que lleva a la portada. */
export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`brand ${className}`} aria-label="Dropshype, ir a la portada">
      <LogoMark />
      <span>Dropshype</span>
    </Link>
  );
}
