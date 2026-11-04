import { NextResponse, type NextRequest } from 'next/server';
import { slugFromHost } from '@/lib/tenant';

/**
 * Multi-proyecto por subdominio: {slug}.ROOT_DOMAIN/... se sirve desde /p/{slug}/...
 * Sin ROOT_DOMAIN configurado (desarrollo) no hace nada y se usa /p/{slug}.
 */
export function proxy(request: NextRequest) {
  const slug = slugFromHost(request.headers.get('host'), process.env.ROOT_DOMAIN);
  if (!slug) return NextResponse.next();
  const url = request.nextUrl.clone();
  if (url.pathname.startsWith('/p/')) return NextResponse.next();
  url.pathname = `/p/${slug}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next|media|favicon.ico|robots.txt).*)'],
};
