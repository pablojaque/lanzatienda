import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = { title: 'Página no encontrada — Dropshype' };

export default function NotFound() {
  return (
    <div className="auth">
      <div className="auth-card">
        <Logo />
        <p className="nf-code">404</p>
        <h1>Esta página no existe</h1>
        <p className="muted">Puede que el enlace esté mal escrito o que la página se haya borrado.</p>
        <div className="nf-actions">
          <Link href="/" className="btn btn-ghost">
            Ir a la portada
          </Link>
          <Link href="/mis-tiendas" className="btn btn-primary">
            Mis tiendas
          </Link>
        </div>
      </div>
    </div>
  );
}
