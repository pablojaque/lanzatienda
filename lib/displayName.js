/** El nombre que eligió al registrarse (se guarda en los datos de su cuenta de Supabase). */
export const displayName = (user) => String(user?.user_metadata?.display_name || '').trim();
