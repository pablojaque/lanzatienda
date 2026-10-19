import { NextResponse } from 'next/server';
import { renderStore } from '@/lib/storeTemplate';
import { deployStatic } from '@/lib/vercel';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 900 * 1024;

function slugify(s) {
  return String(s || 'tienda')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'tienda';
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, { status: 401 });
    }

    const { config, images } = await request.json();

    if (!config?.storeName || !config?.productName || !(Number(config.price) > 0)) {
      return NextResponse.json({ error: 'Faltan el nombre de la tienda, el producto o el precio.' }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length !== 4) {
      return NextResponse.json({ error: 'Necesitamos exactamente 4 fotos.' }, { status: 400 });
    }
    for (const img of images) {
      if (typeof img !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(img) || img.length * 0.75 > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Alguna foto no es válida o es demasiado grande.' }, { status: 400 });
      }
    }
    if (config.paymentLink && !/^https:\/\//.test(config.paymentLink)) {
      return NextResponse.json({ error: 'El enlace de pago debe empezar por https://' }, { status: 400 });
    }

    const projectName = `${slugify(config.storeName)}-${Math.random().toString(36).slice(2, 7)}`;
    const storeConfig = {
      ...config,
      launchEndsAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      // La tienda avisa a LanzaTienda de cada visita y clic para las analíticas
      projectName,
      trackUrl: `${process.env.LANZATIENDA_URL || new URL(request.url).origin}/api/track`,
    };
    const imagePaths = images.map((_, i) => `img/${i + 1}.jpg`);
    const html = renderStore(storeConfig, imagePaths);
    const files = [
      { file: 'index.html', data: html },
      ...images.map((data, i) => ({ file: imagePaths[i], data, encoding: 'base64' })),
    ];

    const deployment = await deployStatic(projectName, files);

    // Guardamos la tienda a nombre del usuario (para "Mis tiendas" y su dominio)
    // (si falla, la tienda sigue publicada igualmente)
    let storeId = null;
    try {
      const { data: store, error: dbError } = await createAdminClient()
        .from('stores')
        .insert({
          user_id: user.id,
          store_name: String(config.storeName).slice(0, 80),
          project_name: projectName,
          deployment_id: deployment.id,
          url: `https://${projectName}.vercel.app`,
        })
        .select('id')
        .single();
      if (dbError) throw dbError;
      storeId = store.id;
    } catch (dbError) {
      console.error('no se pudo guardar la tienda', dbError);
    }

    return NextResponse.json({ id: deployment.id, projectName, storeId });
  } catch (err) {
    console.error('launch error', err);
    return NextResponse.json({ error: err.message || 'No se pudo lanzar la tienda.' }, { status: 500 });
  }
}
