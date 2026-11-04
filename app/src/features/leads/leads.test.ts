import { describe, expect, it } from 'vitest';
import { leadInputSchema } from './schema';
import { buildWhatsAppUrl } from './whatsapp';
import { createRateLimiter } from './rateLimit';

const valid = { projectSlug: 'torre-algarrobo', unitId: 'u-7a', name: 'Ana Pérez', phone: '+54 351 555-1234', email: '', message: '' };

describe('leadInputSchema', () => {
  it('accepts a minimal lead and normalizes empty optionals to null', () => {
    const r = leadInputSchema.parse(valid);
    expect(r.email).toBeNull();
    expect(r.message).toBeNull();
  });

  it('rejects a short phone and an invalid email', () => {
    expect(leadInputSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...valid, email: 'no-es-email' }).success).toBe(false);
  });

  it('rejects a slug with unexpected characters', () => {
    expect(leadInputSchema.safeParse({ ...valid, projectSlug: '../admin' }).success).toBe(false);
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with the unit in the message', () => {
    const url = buildWhatsAppUrl({ number: '+54 9 351 000-0000', projectName: 'Torre Algarrobo', unitCode: '7A', name: 'Ana' });
    expect(url).toBe(`https://wa.me/5493510000000?text=${encodeURIComponent('Hola, soy Ana. Quiero consultar por la unidad 7A de Torre Algarrobo.')}`);
  });

  it('returns null without a configured number', () => {
    expect(buildWhatsAppUrl({ number: null, projectName: 'X', unitCode: null, name: 'Ana' })).toBeNull();
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit inside the window and recovers after it', () => {
    let t = 0;
    const rl = createRateLimiter(2, 1000, () => t);
    expect(rl.take('ip')).toBe(true);
    expect(rl.take('ip')).toBe(true);
    expect(rl.take('ip')).toBe(false);
    expect(rl.take('otra-ip')).toBe(true);
    t = 1001;
    expect(rl.take('ip')).toBe(true);
  });
});
