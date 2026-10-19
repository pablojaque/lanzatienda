import { getCurrentUser } from '@/lib/currentUser';
import { safeNext } from '@/lib/safeNext';
import NameForm from '@/components/NameForm';

export const metadata = { title: 'Bienvenido — LanzaTienda' };
export const dynamic = 'force-dynamic';

export default async function BienvenidaPage({ searchParams }) {
  const { next } = await searchParams;
  const { name } = await getCurrentUser();
  return <NameForm next={safeNext(next)} initial={name} editing={!!name} />;
}
