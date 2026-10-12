const API = 'https://api.vercel.com';

function withTeam(path) {
  const team = process.env.VERCEL_TEAM_ID;
  if (!team) return API + path;
  return API + path + (path.includes('?') ? '&' : '?') + 'teamId=' + encodeURIComponent(team);
}

async function call(path, options = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('Falta VERCEL_TOKEN en las variables de entorno.');
  const res = await fetch(withTeam(path), {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `Vercel respondió ${res.status}`);
  return body;
}

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
  await call(`/v9/projects/${encodeURIComponent(projectName)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ssoProtection: null }),
  }).catch(() => {});

  return deployment;
}

export async function getDeployment(id) {
  return call(`/v13/deployments/${encodeURIComponent(id)}`);
}
