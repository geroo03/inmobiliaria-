import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/data';
import { leadInputSchema } from '@/features/leads/schema';
import { buildWhatsAppUrl } from '@/features/leads/whatsapp';
import { createRateLimiter } from '@/features/leads/rateLimit';

const MAX_BODY_BYTES = 8 * 1024;
// 5 consultas cada 10 minutos por IP (en memoria de esta instancia; ver rateLimit.ts).
const limiter = createRateLimiter(5, 10 * 60 * 1000);

/** IP del cliente según el proxy de la plataforma (Vercel/Netlify la ponen primera en x-forwarded-for). */
function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }
  if (!limiter.take(clientIp(req))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'retry-after': '600' } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', fields: parsed.error.issues.map((i) => String(i.path[0])) }, { status: 422 });
  }
  const input = parsed.data;
  // Campo trampa completo: se responde como si hubiera salido bien, sin guardar nada.
  if (input.website) return NextResponse.json({ ok: true, whatsappUrl: null });

  const repo = getRepository();
  const project = await repo.getProjectBySlug(input.projectSlug);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const unit = input.unitId ? await repo.getPublicUnit(project.id, input.unitId) : null;
  if (input.unitId && !unit) return NextResponse.json({ error: 'invalid', fields: ['unitId'] }, { status: 422 });

  try {
    await repo.createLead({
      projectId: project.id,
      unitId: unit?.id ?? null,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      source: 'web',
    });
  } catch (err) {
    // Sin datos personales en el log: solo el proyecto y el error.
    console.error('lead_insert_failed', { project: project.slug, error: err instanceof Error ? err.message : 'unknown' });
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const whatsappUrl = buildWhatsAppUrl({ number: project.whatsappNumber, projectName: project.name, unitCode: unit?.code ?? null, name: input.name });
  return NextResponse.json({ ok: true, whatsappUrl }, { status: 201 });
}
