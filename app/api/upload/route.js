import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { uploadFile } from '@/lib/vercel';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 900 * 1024;

// Sube una foto (ya reducida en el navegador) a Vercel y devuelve su sha para usarla al publicar.
// Van de una en una para no pasar el límite de tamaño de cada petición.
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, { status: 401 });

  const { image } = await request.json().catch(() => ({}));
  if (typeof image !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return NextResponse.json({ error: 'La foto no es válida.' }, { status: 400 });
  }
  const buffer = Buffer.from(image, 'base64');
  // Solo JPEG (fotos) o PNG (logos con fondo transparente): el navegador las convierte antes de subirlas
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const png = buffer.subarray(0, 4).toString('hex') === '89504e47';
  if (buffer.length > MAX_IMAGE_BYTES || !(jpeg || png)) {
    return NextResponse.json({ error: 'La foto no es válida o es demasiado grande.' }, { status: 400 });
  }

  const sha = crypto.createHash('sha1').update(buffer).digest('hex');
  try {
    await uploadFile(buffer, sha);
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'No hemos podido subir la foto. Inténtalo de nuevo.' }, { status: 502 });
  }
  return NextResponse.json({ sha, size: buffer.length });
}
