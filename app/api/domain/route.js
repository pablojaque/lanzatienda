import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeDomain } from '@/lib/domains';
import { addDomain, getProjectDomain, verifyProjectDomain, getDomainConfig, removeDomain } from '@/lib/vercel';

export const runtime = 'nodejs';

const DEFAULT_IP = '76.76.21.21';
const DEFAULT_CNAME = 'cname.vercel-dns.com';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

/** Comprueba la sesión y que la tienda sea del usuario. */
async function getOwnedStore(storeId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: fail('Tu sesión ha caducado. Vuelve a iniciar sesión.', 401) };
  if (!/^[0-9a-f-]{36}$/i.test(storeId || '')) return { error: fail('Tienda no válida.') };

  const admin = createAdminClient();
  const { data: store } = await admin
    .from('stores')
    .select('id, project_name, domain')
    .eq('id', storeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!store) return { error: fail('No encontramos esa tienda en tu cuenta.', 404) };
  return { admin, store };
}

function friendlyError(err) {
  if (err.status === 409 || err.code === '23505' || /already|in use/i.test(err.message || ''))
    return 'Ese dominio ya está conectado a otra web. Si es tuyo, quítalo de allí primero y vuelve a intentarlo.';
  if (err.code === 'invalid_domain' || err.status === 400) return 'Ese dominio no es válido. Revisa que esté bien escrito.';
  if (err.status === 403) return 'No se puede usar ese dominio. Prueba con otro.';
  return 'No hemos podido conectar el dominio. Inténtalo de nuevo en un momento.';
}

/** Lo que ve el usuario: si ya funciona y, si no, qué registros DNS tiene que poner. */
async function domainStatus(projectName, domain) {
  let pd = await getProjectDomain(projectName, domain);
  if (!pd.verified) pd = await verifyProjectDomain(projectName, domain).catch(() => pd);
  const config = await getDomainConfig(domain).catch(() => ({ misconfigured: true }));

  const apex = pd.apexName || domain;
  const isApex = apex === domain;
  const ip = config.recommendedIPv4?.find((r) => r.rank === 1)?.value?.[0] || DEFAULT_IP;
  const cnameRaw = config.recommendedCNAME?.find((r) => r.rank === 1)?.value;
  const cname = (Array.isArray(cnameRaw) ? cnameRaw[0] : cnameRaw || DEFAULT_CNAME).replace(/\.$/, '');
  const hostOf = (name) => (name === apex ? '@' : name.slice(0, -(apex.length + 1)));

  const records = isApex
    ? [
        { type: 'A', name: '@', value: ip },
        { type: 'CNAME', name: 'www', value: cname },
      ]
    : [{ type: 'CNAME', name: hostOf(domain), value: cname }];

  // Si el dominio estuvo en otra cuenta de Vercel, hay que demostrar que es tuyo con un TXT
  if (!pd.verified) {
    for (const v of pd.verification || []) records.push({ type: v.type, name: hostOf(v.domain), value: v.value });
  }

  return {
    domain,
    isApex,
    verified: !!pd.verified,
    configured: !config.misconfigured,
    ready: !!pd.verified && !config.misconfigured,
    records,
  };
}

async function detach(projectName, domain) {
  await removeDomain(projectName, domain).catch(() => {});
  await removeDomain(projectName, `www.${domain}`).catch(() => {});
}

// Estado del dominio de una tienda
export async function GET(request) {
  const storeId = new URL(request.url).searchParams.get('storeId');
  const { store, error } = await getOwnedStore(storeId);
  if (error) return error;
  if (!store.domain) return NextResponse.json({ domain: null });

  try {
    return NextResponse.json(await domainStatus(store.project_name, store.domain));
  } catch (err) {
    console.error('domain status error', err);
    return fail('No hemos podido comprobar el dominio. Inténtalo de nuevo.', 500);
  }
}

// Conectar (o cambiar) el dominio de una tienda
export async function POST(request) {
  const { storeId, domain: input } = await request.json().catch(() => ({}));
  const { admin, store, error } = await getOwnedStore(storeId);
  if (error) return error;

  const domain = normalizeDomain(input);
  if (!domain) return fail('Escribe un dominio válido, por ejemplo: mitienda.com');

  try {
    if (store.domain && store.domain !== domain) await detach(store.project_name, store.domain);

    if (store.domain !== domain) {
      const added = await addDomain(store.project_name, domain).catch(async (err) => {
        // Si ya estaba en esta misma tienda (p. ej. al reintentar), seguimos
        if (err.status === 409) {
          const existing = await getProjectDomain(store.project_name, domain).catch(() => null);
          if (existing) return existing;
        }
        throw err;
      });
      // Con un dominio raíz (mitienda.com), www.mitienda.com redirige a él
      if ((added.apexName || domain) === domain) {
        await addDomain(store.project_name, `www.${domain}`, domain).catch(() => {});
      }
      const { error: dbError } = await admin.from('stores').update({ domain }).eq('id', store.id);
      if (dbError) {
        await detach(store.project_name, domain);
        throw dbError;
      }
    }

    return NextResponse.json(await domainStatus(store.project_name, domain));
  } catch (err) {
    console.error('domain connect error', err);
    return fail(friendlyError(err), err.status === 409 ? 409 : 400);
  }
}

// Quitar el dominio de una tienda
export async function DELETE(request) {
  const { storeId } = await request.json().catch(() => ({}));
  const { admin, store, error } = await getOwnedStore(storeId);
  if (error) return error;

  if (store.domain) await detach(store.project_name, store.domain);
  await admin.from('stores').update({ domain: null }).eq('id', store.id);
  return NextResponse.json({ domain: null });
}
