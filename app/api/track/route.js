import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// Las tiendas están en otros dominios: dejamos que nos llamen desde cualquiera
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const TYPES = ['view', 'checkout', 'pay'];

// De dónde viene la visita, en palabras que entienda el dueño de la tienda
const SOURCES = [
  [/tiktok/, 'TikTok'],
  [/instagram|^ig$/, 'Instagram'],
  [/facebook|^fb$|fb\.com|fb\.me/, 'Facebook'],
  [/google/, 'Google'],
  [/youtube|youtu\.be/, 'YouTube'],
  [/^t\.co$|twitter|^x\.com$/, 'X / Twitter'],
  [/whatsapp|wa\.me/, 'WhatsApp'],
  [/pinterest/, 'Pinterest'],
];

function sourceOf(utm, referrer, ownHost) {
  let key = String(utm || '').toLowerCase().trim();
  if (!key && referrer) {
    try {
      key = new URL(referrer).hostname.replace(/^www\./, '');
    } catch {}
  }
  if (!key || key === ownHost) return null; // directo
  return SOURCES.find(([re]) => re.test(key))?.[1] || key.slice(0, 60);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  const done = () => new Response(null, { status: 204, headers: CORS });
  let e;
  try {
    e = JSON.parse((await request.text()).slice(0, 2000));
  } catch {
    return done();
  }
  if (!TYPES.includes(e?.t) || typeof e.p !== 'string' || !/^[a-z0-9-]{3,60}$/.test(e.p)) return done();

  try {
    const admin = createAdminClient();
    const { data: store } = await admin.from('stores').select('id').eq('project_name', e.p).maybeSingle();
    if (!store) return done();

    let ownHost = null;
    try {
      ownHost = new URL(request.headers.get('origin') || '').hostname.replace(/^www\./, '');
    } catch {}

    await admin.from('store_events').insert({
      store_id: store.id,
      type: e.t,
      visitor: typeof e.v === 'string' ? e.v.slice(0, 40) : null,
      source: sourceOf(e.u, e.r, ownHost),
      device: e.m ? 'Móvil' : 'Ordenador',
    });
  } catch (err) {
    console.error('track error', err);
  }
  return done();
}
