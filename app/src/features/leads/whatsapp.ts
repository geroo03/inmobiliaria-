export interface WhatsAppContext {
  number: string | null;
  projectName: string;
  unitCode: string | null;
  name: string;
}

/**
 * Link de WhatsApp con el mensaje prellenado. Sin número configurado devuelve null:
 * la consulta queda guardada igual y la UI no ofrece el botón.
 */
export function buildWhatsAppUrl(ctx: WhatsAppContext): string | null {
  const digits = (ctx.number ?? '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const about = ctx.unitCode ? `la unidad ${ctx.unitCode} de ${ctx.projectName}` : ctx.projectName;
  const text = `Hola, soy ${ctx.name}. Quiero consultar por ${about}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
