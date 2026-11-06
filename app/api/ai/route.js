import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AI_SYSTEM, AI_TOOL, cleanProducts, cleanStorePatch } from '@/lib/aiEditor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || 'claude-opus-5-5';
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 20;
const MAX_HISTORY = 16;
// Estos modelos admiten que, si uno rechaza la petición, la responda otro automáticamente
const WITH_FALLBACKS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1', 'claude-opus-5'];

const fail = (error, status) => NextResponse.json({ error }, { status });

// El asistente del editor: recibe la conversación y el estado de la tienda, y devuelve
// la respuesta de la IA más los cambios ya limpios para aplicarlos en el editor.
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('Tu sesión ha caducado. Vuelve a iniciar sesión.', 401);
  if (!process.env.ANTHROPIC_API_KEY) return fail('El asistente de IA aún no está activado.', 503);

  const raw = await request.text();
  if (raw.length > 200_000) return fail('La tienda es demasiado grande para el asistente.', 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail('Petición no válida.', 400);
  }

  // Conversación: turnos alternos que empiezan y acaban por el usuario
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.text.trim().slice(0, 4000) }));
  while (history.length && history[0].role !== 'user') history.shift();
  const messages = history.filter((m, i) => i === 0 || m.role !== history[i - 1].role);
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return fail('Escribe qué quieres cambiar.', 400);

  // Límite diario de mensajes por usuario (cada mensaje cuesta dinero)
  const { data: allowed, error: limitError } = await createAdminClient().rpc('ai_take', {
    p_user: user.id,
    p_limit: DAILY_LIMIT,
  });
  if (limitError) {
    console.error('ai_take error', limitError);
    return fail('El asistente de IA aún no está activado.', 503);
  }
  if (!allowed) return fail(`Has llegado al límite de ${DAILY_LIMIT} mensajes de hoy. Mañana puedes seguir.`, 429);

  last.content = `${last.content}\n\n<estado_tienda>\n${JSON.stringify(body.state ?? {}).slice(0, 120_000)}\n</estado_tienda>`;

  const client = new Anthropic();
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      ...(WITH_FALLBACKS.includes(MODEL) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
      output_config: { effort: process.env.AI_EFFORT || 'low' },
      system: [{ type: 'text', text: AI_SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: [AI_TOOL],
      messages,
    });
  } catch (err) {
    console.error('ai error', err?.status, err?.message);
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      return fail('El asistente está muy ocupado ahora mismo. Inténtalo en un minuto.', 503);
    }
    return fail('El asistente no ha podido responder. Inténtalo de nuevo.', 502);
  }

  if (response.stop_reason === 'refusal') {
    return NextResponse.json({ reply: 'Eso no lo puedo hacer. Prueba a pedírmelo de otra forma.' });
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  const call = response.content.find((b) => b.type === 'tool_use' && b.name === AI_TOOL.name);
  const store = call ? cleanStorePatch(call.input?.tienda) : {};
  const products = call ? cleanProducts(call.input?.productos) : null;
  const changed = Object.keys(store).length > 0 || !!products;

  let reply = text;
  if (!reply)
    reply = changed
      ? 'Listo, ya está aplicado. Míralo en la vista previa.'
      : 'No he entendido qué quieres cambiar. ¿Me lo explicas de otra forma?';
  if (response.stop_reason === 'max_tokens' && !changed) reply = 'Era demasiado de golpe. Pídemelo por partes.';

  return NextResponse.json({ reply, ...(changed ? { changes: { store, products } } : {}) });
}
