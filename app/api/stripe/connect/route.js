import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createConnectedAccount, createOnboardingLink, stripeEnabled } from '@/lib/stripe';
import { accountStatus, getUserAccountId } from '@/lib/payments';

export const runtime = 'nodejs';

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ¿Tiene ya los cobros con tarjeta activados?
export async function GET() {
  const user = await session();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado.' }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ available: false });
  try {
    const status = await accountStatus(await getUserAccountId(createAdminClient(), user.id));
    return NextResponse.json({ available: true, ...status });
  } catch (err) {
    console.error('connect status error', err);
    return NextResponse.json({ error: 'No hemos podido comprobar tus cobros.' }, { status: 502 });
  }
}

// Crea su cuenta de cobros (si no la tiene) y le manda al alta de Stripe
export async function POST(request) {
  const user = await session();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado.' }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ error: 'Los cobros con tarjeta todavía no están activados.' }, { status: 503 });

  const admin = createAdminClient();
  try {
    let accountId = await getUserAccountId(admin, user.id);
    if (!accountId) {
      const account = await createConnectedAccount({ userId: user.id, email: user.email });
      const { error } = await admin.from('stripe_accounts').insert({ user_id: user.id, account_id: account.id });
      if (error) throw error;
      accountId = account.id;
    }
    const origin = new URL(request.url).origin;
    const link = await createOnboardingLink(accountId, {
      refreshUrl: `${origin}/mis-tiendas?cobros=reintentar`,
      returnUrl: `${origin}/mis-tiendas?cobros=listo`,
    });
    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error('connect onboarding error', err);
    return NextResponse.json({ error: 'No hemos podido abrir Stripe. Inténtalo de nuevo.' }, { status: 502 });
  }
}
