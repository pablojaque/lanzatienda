import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeDomain } from '@/lib/domains';
import { getDomainPrice, isDomainAvailable } from '@/lib/vercel';
import { MAX_DOMAIN_USD, retailCents } from '@/lib/domainPricing';
import { stripeEnabled } from '@/lib/stripe';

export const runtime = 'nodejs';

// Terminaciones que proponemos, en este orden
const TLDS = ['com', 'es', 'shop', 'store', 'online', 'net'];

/** "Mi Tienda Bonita" → "mitiendabonita" · "mitienda.es" → "mitienda" */
function baseName(q) {
  const asDomain = normalizeDomain(q);
  const label = asDomain ? asDomain.split('.')[0] : String(q || '');
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

async function check(domain) {
  try {
    if (!(await isDomainAvailable(domain))) return { domain, available: false };
    const price = await getDomainPrice(domain);
    if (!(price.purchaseUsd > 0) || price.purchaseUsd > MAX_DOMAIN_USD) return { domain, available: false, premium: true };
    return {
      domain,
      available: true,
      priceCents: retailCents(price.purchaseUsd),
      renewalCents: price.renewalUsd > 0 ? retailCents(price.renewalUsd) : null,
    };
  } catch {
    return { domain, available: false, unsupported: true };
  }
}

// Busca un nombre en varias terminaciones y dice cuáles están libres y a qué precio
export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, { status: 401 });

  const q = new URL(request.url).searchParams.get('q') || '';
  const name = baseName(q);
  if (name.length < 2) return NextResponse.json({ error: 'Escribe al menos 2 letras o números.' }, { status: 400 });

  // Si escribió una terminación concreta (mitienda.shop), va la primera
  const typed = normalizeDomain(q);
  const wanted = typed && typed.split('.').length === 2 ? typed : null; // los subdominios no se compran
  const domains = [...new Set([wanted, ...TLDS.map((t) => `${name}.${t}`)].filter(Boolean))].slice(0, 7);

  const results = await Promise.all(domains.map(check));
  return NextResponse.json({ results, canBuy: stripeEnabled() });
}
