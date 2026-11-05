import { renderSite } from '@/lib/storeTemplate';
import { deployFiles } from '@/lib/vercel';
import { imagePath, slugify } from '@/lib/storeConfig';

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

/**
 * Publica una tienda (ya validada con sanitizeConfig) y la guarda a nombre del usuario.
 * - existing: la tienda que se está editando (se vuelve a publicar en el mismo sitio)
 * - photosFrom: dirección de una tienda publicada de donde recuperar fotos que Vercel ya no tenga
 */
export async function publishStore({ admin, userId, config, existing = null, apiBase, photosFrom = null }) {
  // Al editar se mantiene la cuenta atrás que ya tenía la tienda
  config.launchEndsAt = existing?.config?.launchEndsAt || new Date(Date.now() + 72 * 3600 * 1000).toISOString();

  const projectName = existing?.project_name || `${slugify(config.storeName)}-${Math.random().toString(36).slice(2, 7)}`;
  const files = siteFiles(config, projectName, apiBase);

  // Si Vercel ya no guarda alguna foto, la recuperamos de la tienda publicada
  const recover = async (sha) => {
    const from = photosFrom || existing?.url || `https://${projectName}.vercel.app`;
    const res = await fetch(`${from}${imagePath(sha)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falta una foto: vuelve a subirla.');
    return Buffer.from(await res.arrayBuffer());
  };
  const deployment = await deployFiles(projectName, files, recover);

  let storeId = existing?.id || null;
  try {
    if (existing) {
      const { error } = await admin
        .from('stores')
        .update({ store_name: config.storeName, deployment_id: deployment.id, config })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Guardamos la tienda a nombre del usuario (para "Mis tiendas", editarla y su dominio)
      // (si falla, la tienda sigue publicada igualmente)
      const row = {
        user_id: userId,
        store_name: config.storeName,
        project_name: projectName,
        deployment_id: deployment.id,
        url: `https://${projectName}.vercel.app`,
        config,
      };
      let { data: store, error } = await admin.from('stores').insert(row).select('id').single();
      // Si aún no se ha añadido la columna config en Supabase, la guardamos sin ella (no se podrá editar)
      if (error && /config/.test(error.message || '')) {
        const { config: _omit, ...withoutConfig } = row;
        ({ data: store, error } = await admin.from('stores').insert(withoutConfig).select('id').single());
      }
      if (error) throw error;
      storeId = store.id;
    }
  } catch (dbError) {
    console.error('no se pudo guardar la tienda', dbError);
  }

  return { id: deployment.id, projectName, storeId };
}

/** Dirección de Dropshype a la que llaman las tiendas (analíticas y cobros). */
export const apiBaseOf = (request) => process.env.LANZATIENDA_URL || new URL(request.url).origin;
