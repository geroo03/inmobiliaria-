import { describe, expect, it } from 'vitest';
import { fitTransform, polygonPoints, toScreen } from './geometry';

describe('fitTransform', () => {
  it('cover crops the sides of a wide image in a tall container', () => {
    const t = fitTransform(400, 800, 1920, 1080, 'cover');
    expect(t.scale).toBeCloseTo(800 / 1080);
    expect(t.offsetY).toBeCloseTo(0);
    expect(t.offsetX).toBeLessThan(0);
    // El centro de la imagen queda en el centro del contenedor.
    const c = toScreen([0.5, 0.5], 1920, 1080, t);
    expect(c.x).toBeCloseTo(200);
    expect(c.y).toBeCloseTo(400);
  });

  it('contain letterboxes a tall image in a wide container', () => {
    const t = fitTransform(1600, 900, 1680, 2270, 'contain');
    expect(t.scale).toBeCloseTo(900 / 2270);
    expect(t.offsetX).toBeGreaterThan(0);
    expect(toScreen([0, 0], 1680, 2270, t).y).toBeCloseTo(0);
  });

  it('returns a zero transform for empty sizes', () => {
    expect(fitTransform(0, 100, 10, 10, 'cover')).toEqual({ scale: 0, offsetX: 0, offsetY: 0 });
  });
});

describe('polygonPoints', () => {
  it('scales normalized points to image pixels', () => {
    expect(polygonPoints([[0, 0], [0.5, 1]], 200, 100)).toBe('0.0,0.0 100.0,100.0');
  });
});
