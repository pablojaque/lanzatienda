/** Solo deja volver a rutas de nuestra propia web (evita redirecciones a otras webs). */
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/crear';
}
