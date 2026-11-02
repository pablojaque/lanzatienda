import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createDashboardLink } from '@/lib/stripe';
import { getUserAccountId } from '@/lib/payments';

export const runtime = 'nodejs';

// Abre su panel de Stripe (ventas, devoluciones y cuándo le llega el dinero al banco)
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado.' }, { status: 401 });

  const accountId = await getUserAccountId(createAdminClient(), user.id);
  if (!accountId) return NextResponse.json({ error: 'Todavía no has activado los cobros.' }, { status: 404 });
  try {
    const link = await createDashboardLink(accountId);
    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error('dashboard link error', err);
    return NextResponse.json({ error: 'Termina primero el alta en Stripe.' }, { status: 409 });
  }
}
