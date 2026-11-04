/**
 * URL pública de un archivo de medios. En desarrollo salen de /public/media; en producción,
 * del bucket (Cloudflare R2) configurado en NEXT_PUBLIC_MEDIA_BASE_URL.
 */
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '/media').replace(/\/$/, '');

export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}/${path.replace(/^\/+/, '')}`;
}
