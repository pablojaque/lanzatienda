import { NextResponse } from 'next/server';
import { getOwnedStore, fail } from '@/lib/ownedStore';
import { sanitizeConfig } from '@/lib/storeConfig';
import { apiBaseOf, publishStore } from '@/lib/publish';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Duplicar una tienda: se publica una copia con todo igual, en una dirección nueva
export async function POST(request, { params }) {
  const { id } = await params;
  const { admin, store, user, error } = await getOwnedStore(id);
  if (error) return error;

  const { data: full } = await admin.from('stores').select('url, config').eq('id', store.id).single();
  if (!full?.config) return fail('Esta tienda se creó antes de poder copiarse. Edítala y publícala una vez, y después ya podrás duplicarla.');

  const { config, error: invalid } = sanitizeConfig({ ...full.config, storeName: `${full.config.storeName} (copia)`.slice(0, 40) });
  if (invalid) return fail(invalid);

  try {
    const result = await publishStore({ admin, userId: user.id, config, apiBase: apiBaseOf(request), photosFrom: full.url });
    return NextResponse.json(result);
  } catch (err) {
    console.error('duplicate store error', err);
    return fail('No hemos podido duplicar la tienda. Inténtalo de nuevo.', 502);
  }
}
