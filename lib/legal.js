// Datos del titular de Dropshype que aparecen en las páginas legales.
// Rellénalos con tus datos reales (Stripe y la ley española los piden).
export const LEGAL = {
  owner: 'Pablo Jaque García', // Nombre y apellidos, o razón social
  nif: '03515984C', // NIF / NIE / CIF
  address: '', // Dirección completa
  email: 'pablojaquevfx@gmail.com', // Email de contacto para temas legales y de privacidad
  updated: '5 de noviembre de 2026',
};

export const legalComplete = () => Boolean(LEGAL.owner && LEGAL.nif && LEGAL.address && LEGAL.email);
