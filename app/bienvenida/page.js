import { getCurrentUser } from '@/lib/currentUser';
import { safeNext } from '@/lib/safeNext';
import NameForm from '@/components/NameForm';

export const metadata = { title: 'Bienvenido — LanzaTienda' };
export const dynamic = 'force-dynamic';

export default async function BienvenidaPage({ searchParams }) {
  const { next } = await searchParams;
  const { user, name } = await getCurrentUser();
  // Si entró con Google, le proponemos el nombre de su cuenta de Google
  const suggestion = name || String(user?.user_metadata?.full_name || user?.user_metadata?.name || '').split(' ')[0];
  return <NameForm next={safeNext(next)} initial={suggestion} editing={!!name} />;
}
