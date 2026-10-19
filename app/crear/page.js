import Wizard from '@/components/Wizard';
import { getCurrentUser } from '@/lib/currentUser';

export const metadata = { title: 'Crear mi tienda — LanzaTienda' };

export const dynamic = 'force-dynamic';

export default async function CrearPage() {
  const { user, name } = await getCurrentUser();
  return <Wizard user={user ? { id: user.id } : null} name={name} />;
}
