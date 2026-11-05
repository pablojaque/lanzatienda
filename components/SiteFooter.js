import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

/** Pie de página de Dropshype, con los enlaces legales. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span className="brand">
          <LogoMark size={22} />
          <span>Dropshype</span>
        </span>
        <nav className="foot-links" aria-label="Legal">
          <Link href="/legal/terminos">Términos</Link>
          <Link href="/legal/privacidad">Privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </nav>
        <span>© {new Date().getFullYear()} Dropshype</span>
      </div>
    </footer>
  );
}
