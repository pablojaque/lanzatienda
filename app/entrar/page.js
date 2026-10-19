import AuthForm from '@/components/AuthForm';
import { safeNext } from '@/lib/safeNext';

export const metadata = { title: 'Entrar — LanzaTienda' };

export default async function EntrarPage({ searchParams }) {
  const { next, error } = await searchParams;
  return <AuthForm next={safeNext(next)} linkError={error} />;
}
