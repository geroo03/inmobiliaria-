'use client';

import { useState } from 'react';
import { leadInputSchema } from './schema';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; whatsappUrl: string | null } | { kind: 'error'; message: string };

export function LeadForm({ projectSlug, unitId, unitCode, onClose }: { projectSlug: string; unitId: string | null; unitCode: string | null; onClose?: () => void }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      projectSlug,
      unitId,
      name: String(fd.get('name') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      message: String(fd.get('message') ?? ''),
      website: String(fd.get('website') ?? ''),
    };
    // La misma validación que el servidor, para avisar antes de mandar.
    const parsed = leadInputSchema.safeParse(input);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[String(issue.path[0])] ??= issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = res.status === 429 ? 'Recibimos muchas consultas desde tu conexión. Probá de nuevo en unos minutos.' : 'No pudimos enviar la consulta. Revisá los datos y probá de nuevo.';
        setStatus({ kind: 'error', message: msg });
        return;
      }
      const url = data && typeof data === 'object' && 'whatsappUrl' in data && typeof data.whatsappUrl === 'string' ? data.whatsappUrl : null;
      setStatus({ kind: 'done', whatsappUrl: url });
    } catch {
      setStatus({ kind: 'error', message: 'Sin conexión. Probá de nuevo.' });
    }
  }

  if (status.kind === 'done') {
    return (
      <div className="grid gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
        <p><b>¡Listo!</b> Recibimos tu consulta{unitCode ? ` por la unidad ${unitCode}` : ''}. Te vamos a contactar a la brevedad.</p>
        {status.whatsappUrl && (
          <a href={status.whatsappUrl} target="_blank" rel="noopener noreferrer" className="pill justify-center bg-[#1F9D55] text-white">Seguir por WhatsApp</a>
        )}
        {onClose && <button type="button" onClick={onClose} className="text-left text-emerald-900 underline">Cerrar</button>}
      </div>
    );
  }

  const field = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]';
  return (
    <form onSubmit={submit} noValidate className="grid gap-2.5">
      <label className="grid gap-1 text-sm font-medium">Nombre
        <input name="name" autoComplete="name" required className={field} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="text-xs text-red-700">{errors.name}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium">Teléfono
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="351 555-1234" required className={field} aria-invalid={Boolean(errors.phone)} />
        {errors.phone && <span className="text-xs text-red-700">{errors.phone}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium">Email <span className="font-normal text-muted">(opcional)</span>
        <input name="email" type="email" autoComplete="email" className={field} aria-invalid={Boolean(errors.email)} />
        {errors.email && <span className="text-xs text-red-700">{errors.email}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium">Mensaje <span className="font-normal text-muted">(opcional)</span>
        <textarea name="message" rows={2} maxLength={600} className={field} defaultValue={unitCode ? `Quiero saber más de la unidad ${unitCode}.` : ''} />
      </label>
      {/* Campo trampa para bots: oculto para personas y lectores de pantalla. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {status.kind === 'error' && <p className="text-sm text-red-700" role="alert">{status.message}</p>}
      <button type="submit" disabled={status.kind === 'sending'} className="pill pill-brand justify-center py-3 disabled:opacity-60">
        {status.kind === 'sending' ? 'Enviando…' : 'Enviar consulta'}
      </button>
      <p className="text-[11px] leading-snug text-muted">Usamos tus datos solo para responder esta consulta.</p>
    </form>
  );
}
