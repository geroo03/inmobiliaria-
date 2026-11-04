import { describe, expect, it } from 'vitest';
import { slugFromHost } from './tenant';

describe('slugFromHost', () => {
  it('reads the project slug from the subdomain', () => {
    expect(slugFromHost('torre-algarrobo.showroom.com.ar', 'showroom.com.ar')).toBe('torre-algarrobo');
    expect(slugFromHost('torre-algarrobo.localhost:3000', 'localhost:3000')).toBe('torre-algarrobo');
  });

  it('ignores the root domain, www, nested subdomains and other hosts', () => {
    expect(slugFromHost('showroom.com.ar', 'showroom.com.ar')).toBeNull();
    expect(slugFromHost('www.showroom.com.ar', 'showroom.com.ar')).toBeNull();
    expect(slugFromHost('a.b.showroom.com.ar', 'showroom.com.ar')).toBeNull();
    expect(slugFromHost('evil.com', 'showroom.com.ar')).toBeNull();
    expect(slugFromHost('x.showroom.com.ar', undefined)).toBeNull();
  });
});
