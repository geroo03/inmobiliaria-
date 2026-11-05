import { describe, expect, it } from 'vitest';
import { spotToLook } from './Tour360';

describe('spotToLook', () => {
  it('maps the panorama center to looking straight ahead at the horizon', () => {
    expect(spotToLook({ u: 0.5, v: 0.5 })).toEqual({ lon: -90, lat: 0 });
  });
  it('maps the top of the image to looking up and wraps around horizontally', () => {
    expect(spotToLook({ u: 0.25, v: 0 })).toEqual({ lon: 0, lat: 90 });
    expect(spotToLook({ u: 0, v: 1 }).lat).toBe(-90);
    expect(spotToLook({ u: 1, v: 0.5 }).lon - spotToLook({ u: 0, v: 0.5 }).lon).toBe(-360);
  });
});
