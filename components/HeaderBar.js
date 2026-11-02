import Logo from '@/components/Logo';
import SideMenu from '@/components/SideMenu';

/**
 * Barra de arriba común: menú (si hay sesión), marca, saludo y acciones.
 * `user` y `name` vienen de getCurrentUser(); `children` son los botones de la derecha.
 */
export default function HeaderBar({ user, name, nav = null, children }) {
  return (
    <div className="row app-bar">
      <div className="app-bar-left">
        {user && <SideMenu name={name} />}
        <Logo />
      </div>
      {nav}
      <div className="header-actions">
        {user && name && <span className="hello">Hola, {name} 👋</span>}
        {children}
      </div>
    </div>
  );
}
