import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { displayName } from '@/lib/displayName';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refresca la sesión si ha caducado y nos dice quién es el usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const redirectTo = (path) => {
    const url = request.nextUrl.clone();
    const [p, q] = path.split('?');
    url.pathname = p;
    url.search = q ? `?${q}` : '';
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  // En la portada solo refrescamos la sesión (para saludar), no obligamos a entrar
  if (pathname === '/') return response;

  // Para crear o ver tus tiendas hay que tener cuenta
  if (!user && pathname !== '/entrar') return redirectTo(`/entrar?next=${encodeURIComponent(pathname)}`);
  // Si ya has iniciado sesión, no tiene sentido ver el formulario de entrada
  if (user && pathname === '/entrar') return redirectTo('/crear');
  // Recién registrado: antes de nada le pedimos cómo se llama
  if (user && !displayName(user) && pathname !== '/bienvenida') {
    return redirectTo(`/bienvenida?next=${encodeURIComponent(pathname)}`);
  }

  return response;
}

export const config = {
  matcher: ['/', '/crear/:path*', '/mis-tiendas/:path*', '/analiticas/:path*', '/bienvenida', '/entrar'],
};
