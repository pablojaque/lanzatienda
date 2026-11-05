import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteProject } from '@/lib/vercel';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Borrar la cuenta: primero sus tiendas de Vercel, luego el usuario (sus datos se borran en cascada)
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Tu sesión ha caducado.' }, { status: 401 });

  const admin = createAdminClient();
  const { data: stores } = await admin.from('stores').select('project_name').eq('user_id', user.id);
  for (const s of stores || []) {
    await deleteProject(s.project_name).catch((err) => {
      if (err.status !== 404) console.error('delete project on account delete', s.project_name, err);
    });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('delete user error', error);
    return NextResponse.json({ error: 'No hemos podido borrar la cuenta. Escríbenos y lo hacemos nosotros.' }, { status: 500 });
  }
  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ deleted: true });
}
