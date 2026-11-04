import type { NextConfig } from 'next';

const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Si los medios salen de un bucket (R2), next/image necesita conocer su host.
    remotePatterns: mediaBase && /^https:\/\//.test(mediaBase) ? [new URL(`${mediaBase.replace(/\/$/, '')}/**`)] : [],
  },
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
