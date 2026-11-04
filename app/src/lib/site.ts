import 'server-only';
import { headers } from 'next/headers';
import { slugFromHost } from './tenant';
import { siteUrl } from './siteUrl';

const SITE_URL = siteUrl();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

/**
 * Prefijo de las rutas del proyecto: vacío si se entró por su subdominio (el proxy reescribe),
 * o /p/{slug} si se entró por el dominio principal.
 */
export async function projectBase(slug: string): Promise<string> {
  const host = (await headers()).get('host');
  return slugFromHost(host, ROOT_DOMAIN) === slug ? '' : `/p/${slug}`;
}

/** URL canónica y absoluta del proyecto (para metadata y vista previa al compartir). */
export function projectUrl(slug: string, path = ''): string {
  if (ROOT_DOMAIN) return `https://${slug}.${ROOT_DOMAIN}${path}`;
  return `${SITE_URL}/p/${slug}${path}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** Color de marca validado antes de usarlo en estilos (viene de la base de datos). */
export const safeColor = (c: string) => (/^#[0-9A-Fa-f]{6}$/.test(c) ? c : '#164056');
