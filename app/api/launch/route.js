import { NextResponse } from 'next/server';
import { renderSite } from '@/lib/storeTemplate';
import { deployFiles } from '@/lib/vercel';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { imagePath, sanitizeConfig, slugify } from '@/lib/storeConfig';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Archivos de la tienda: sus páginas y las fotos (ya subidas, se mandan solo por su sha). */
function siteFiles(config, projectName, apiBase) {
  const baseUrl = `https://${projectName}.vercel.app`;
  const pages = renderSite(config, {
    imageUrl: (img) => imagePath(img.sha),
    baseUrl,
    // La tienda avisa a Dropshype de visitas y clics, y le pide el cobro con tarjeta
    api: { track: `${apiBase}/api/track`, checkout: `${apiBase}/api/store-checkout`, p: projectName },
  });
  const images = new Map();
  for (const p of config.products) for (const img of p.images) images.set(img.sha, img);
  if (config.logo) images.set(config.logo.sha, config.logo);
  return [
    ...pages,
    ...[...images.values()].map((img) => ({ file: imagePath(img.sha).slice(1), sha: img.sha, size: img.size })),
  ];
}

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

    // Al editar se mantiene la cuenta atrás que ya tenía la tienda
    config.launchEndsAt = existing?.config?.launchEndsAt || new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const projectName = existing?.project_name || `${slugify(config.storeName)}-${Math.random().toString(36).slice(2, 7)}`;
    const apiBase = process.env.LANZATIENDA_URL || new URL(request.url).origin;
    const files = siteFiles(config, projectName, apiBase);

    // Si Vercel ya no guarda alguna foto, la recuperamos de la tienda publicada
    const recover = async (sha) => {
      const res = await fetch(`${existing?.url || `https://${projectName}.vercel.app`}${imagePath(sha)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Falta una foto: vuelve a subirla.');
      return Buffer.from(await res.arrayBuffer());
    };
    const deployment = await deployFiles(projectName, files, recover);

    let storeId = existing?.id || null;
    try {
      if (existing) {
        const { error: dbError } = await admin
          .from('stores')
          .update({ store_name: config.storeName, deployment_id: deployment.id, config })
          .eq('id', existing.id);
        if (dbError) throw dbError;
      } else {
        // Guardamos la tienda a nombre del usuario (para "Mis tiendas", editarla y su dominio)
        // (si falla, la tienda sigue publicada igualmente)
        const row = {
          user_id: user.id,
          store_name: config.storeName,
          project_name: projectName,
          deployment_id: deployment.id,
          url: `https://${projectName}.vercel.app`,
          config,
        };
        let { data: store, error: dbError } = await admin.from('stores').insert(row).select('id').single();
        // Si aún no se ha añadido la columna config en Supabase, la guardamos sin ella (no se podrá editar)
        if (dbError && /config/.test(dbError.message || '')) {
          const { config: _omit, ...withoutConfig } = row;
          ({ data: store, error: dbError } = await admin.from('stores').insert(withoutConfig).select('id').single());
        }
        if (dbError) throw dbError;
        storeId = store.id;
      }
    } catch (dbError) {
      console.error('no se pudo guardar la tienda', dbError);
    }

    return NextResponse.json({ id: deployment.id, projectName, storeId });
  } catch (err) {
    console.error('launch error', err);
    return NextResponse.json({ error: err.message || 'No se pudo lanzar la tienda.' }, { status: 500 });
  }
}
