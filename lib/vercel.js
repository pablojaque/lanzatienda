const API = 'https://api.vercel.com';

function withTeam(path) {
  const team = process.env.LANZATIENDA_TEAM_ID;
  if (!team) return API + path;
  return API + path + (path.includes('?') ? '&' : '?') + 'teamId=' + encodeURIComponent(team);
}

async function call(path, options = {}) {
  const token = process.env.LANZATIENDA_TOKEN;
  if (!token) throw new Error('Falta LANZATIENDA_TOKEN en las variables de entorno.');
  const res = await fetch(withTeam(path), {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message || `Vercel respondió ${res.status}`);
    err.status = res.status;
    err.code = body?.error?.code;
    throw err;
  }
  return body;
}

const project = (name) => `/projects/${encodeURIComponent(name)}`;

/** Crea un proyecto nuevo en Vercel con los archivos dados y lo lanza a producción. */
export async function deployStatic(projectName, files) {
  const deployment = await call('/v13/deployments?skipAutoDetectionConfirmation=1', {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      target: 'production',
      files,
      projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null },
    }),
  });

  // Que la tienda sea pública para cualquiera (sin login de Vercel)
  await call(`/v9${project(projectName)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ssoProtection: null }),
  }).catch(() => {});

  return deployment;
}

export async function getDeployment(id) {
  return call(`/v13/deployments/${encodeURIComponent(id)}`);
}

/** Añade un dominio a la tienda. `redirectTo` hace que redirija a otro dominio (www → sin www). */
export async function addDomain(projectName, domain, redirectTo) {
  return call(`/v10${project(projectName)}/domains`, {
    method: 'POST',
    body: JSON.stringify(redirectTo ? { name: domain, redirect: redirectTo, redirectStatusCode: 308 } : { name: domain }),
  });
}

export async function getProjectDomain(projectName, domain) {
  return call(`/v9${project(projectName)}/domains/${encodeURIComponent(domain)}`);
}

/** Pide a Vercel que vuelva a comprobar el registro TXT de propiedad (solo si hacía falta). */
export async function verifyProjectDomain(projectName, domain) {
  return call(`/v9${project(projectName)}/domains/${encodeURIComponent(domain)}/verify`, { method: 'POST' });
}

/** Dice si los DNS del dominio ya apuntan a Vercel y qué valores recomienda. */
export async function getDomainConfig(domain) {
  return call(`/v6/domains/${encodeURIComponent(domain)}/config`);
}

export async function removeDomain(projectName, domain) {
  return call(`/v9${project(projectName)}/domains/${encodeURIComponent(domain)}`, { method: 'DELETE' });
}
