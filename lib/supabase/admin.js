import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con la secret key: se salta las reglas de seguridad (RLS).
 * SOLO para el servidor, y siempre después de comprobar quién es el usuario.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
