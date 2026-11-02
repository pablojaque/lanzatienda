import { NextResponse } from 'next/server';
import { getOwnedStore, fail } from '@/lib/ownedStore';
import { deleteProject } from '@/lib/vercel';

export const runtime = 'nodejs';

// Borrar una tienda: desaparece de internet y de "Mis tiendas" (con sus analíticas)
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { admin, store, error } = await getOwnedStore(id);
  if (error) return error;

  try {
    await deleteProject(store.project_name);
  } catch (err) {
    // Si ya no estaba en Vercel, seguimos y la quitamos de la lista igualmente
    if (err.status !== 404) {
      console.error('delete project error', err);
      return fail('No hemos podido borrar la tienda. Inténtalo de nuevo.', 502);
    }
  }
  const { error: dbError } = await admin.from('stores').delete().eq('id', store.id);
  if (dbError) {
    console.error('delete store error', dbError);
    return fail('La tienda ya no está publicada, pero no hemos podido quitarla de tu lista.', 500);
  }
  return NextResponse.json({ deleted: true });
}
