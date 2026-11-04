/**
 * Resuelve el proyecto a partir del host: {slug}.dominio.com → slug.
 * Devuelve null para el dominio raíz, www, hosts ajenos o slugs inválidos.
 */
export function slugFromHost(host: string | null, rootDomain: string | undefined): string | null {
  if (!host || !rootDomain) return null;
  const h = host.toLowerCase().replace(/:\d+$/, '');
  const root = rootDomain.toLowerCase().replace(/:\d+$/, '');
  if (!h.endsWith(`.${root}`)) return null;
  const sub = h.slice(0, -(root.length + 1));
  if (!/^[a-z0-9-]{2,40}$/.test(sub) || sub === 'www') return null;
  return sub;
}
