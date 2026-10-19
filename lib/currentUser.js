import { createClient } from '@/lib/supabase/server';
import { displayName } from '@/lib/displayName';

/** Quién está viendo la página (o null) y cómo se llama. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user, name: displayName(user) };
}
