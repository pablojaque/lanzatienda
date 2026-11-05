import Link from 'next/link';
import { getCurrentUser } from '@/lib/currentUser';
import HeaderBar from '@/components/HeaderBar';
import AccountSettings from '@/components/AccountSettings';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Ajustes de cuenta — Dropshype' };
export const dynamic = 'force-dynamic';

export default async function CuentaPage() {
  const { user, name } = await getCurrentUser();
  return (
    <>
      <header className="site-header">
        <div className="container">
          <HeaderBar user={user} name={name}>
            <Link href="/mis-tiendas" className="logout">
              Mis tiendas
            </Link>
          </HeaderBar>
        </div>
      </header>
      <main className="container stores">
        <h1>Ajustes de cuenta</h1>
        <p className="muted">{user?.email}</p>
        <AccountSettings name={name} email={user?.email || ''} />
      </main>
      <SiteFooter />
    </>
  );
}
