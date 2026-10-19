import Link from 'next/link';
import SideMenu from '@/components/SideMenu';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Barra de arriba común: menú (si hay sesión), marca, saludo, modo claro/oscuro y acciones.
 * `user` y `name` vienen de getCurrentUser(); `children` son los botones de la derecha.
 */
export default function HeaderBar({ user, name, children }) {
  return (
    <div className="row app-bar">
      <div className="app-bar-left">
        {user && <SideMenu name={name} />}
        <Link href="/" className="brand">
          Lanza<span>Tienda</span>
        </Link>
      </div>
      <div className="header-actions">
        {user && name && <span className="hello">Hola, {name} 👋</span>}
        <ThemeToggle />
        {children}
      </div>
    </div>
  );
}
