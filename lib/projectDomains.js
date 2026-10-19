import { removeDomain } from '@/lib/vercel';

/** Quita el dominio (y su www) de la tienda en Vercel. No falla si ya no estaban. */
export async function detachDomain(projectName, domain) {
  await removeDomain(projectName, domain).catch(() => {});
  await removeDomain(projectName, `www.${domain}`).catch(() => {});
}
