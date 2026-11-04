import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteUrl } from './siteUrl';

afterEach(() => vi.unstubAllEnvs());

describe('siteUrl', () => {
  it('prefers the explicit URL and trims the trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://showroom.com.ar/');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'algo.vercel.app');
    expect(siteUrl()).toBe('https://showroom.com.ar');
  });
  it('uses the Vercel production domain when nothing is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'torre.vercel.app');
    expect(siteUrl()).toBe('https://torre.vercel.app');
  });
  it('falls back to localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', '');
    expect(siteUrl()).toBe('http://localhost:3000');
  });
});
