import { NextResponse } from 'next/server';
import { getDeployment } from '@/lib/vercel';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const projectName = searchParams.get('name') || '';
  if (!/^dpl_[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
  }

  try {
    const d = await getDeployment(id);
    const state = d.readyState; // QUEUED | BUILDING | READY | ERROR | CANCELED
    let url = null;
    if (state === 'READY') {
      const aliases = d.alias || [];
      const preferred = aliases.find((a) => a === `${projectName}.vercel.app`);
      const shortest = [...aliases].sort((a, b) => a.length - b.length)[0];
      // Sin alias todavía: esperar a que Vercel asigne el dominio público
      if (!preferred && !shortest) return NextResponse.json({ state: 'BUILDING' });
      url = `https://${preferred || shortest}`;
    }
    return NextResponse.json({ state, url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
