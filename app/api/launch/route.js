import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeConfig } from '@/lib/storeConfig';
import { apiBaseOf, publishStore } from '@/lib/publish';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Crea una tienda nueva o, con storeId, vuelve a publicar una existente con los cambios
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { config, error } = sanitizeConfig(body.config);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const admin = createAdminClient();
    let existing = null;
    if (body.storeId) {
      const { data } = await admin
        .from('stores')
        .select('id, project_name, url, config')
        .eq('id', body.storeId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) return NextResponse.json({ error: 'No encontramos esa tienda en tu cuenta.' }, { status: 404 });
      existing = data;
    }

    const result = await publishStore({ admin, userId: user.id, config, existing, apiBase: apiBaseOf(request) });
    return NextResponse.json(result);
  } catch (err) {
    console.error('launch error', err);
    return NextResponse.json({ error: err.message || 'No se pudo lanzar la tienda.' }, { status: 500 });
  }
}
