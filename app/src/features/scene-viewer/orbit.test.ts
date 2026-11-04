import { describe, expect, it } from 'vitest';
import { endpointAlphas, frameIndex, mod, segmentAt, snapTarget } from './orbit';

describe('orbit math', () => {
  it('wraps positions around the ring', () => {
    expect(mod(-1, 3)).toBe(2);
    expect(segmentAt(2.25, 3)).toEqual({ from: 2, to: 0, t: 0.25 });
    expect(segmentAt(-0.5, 3)).toEqual({ from: 2, to: 0, t: 0.5 });
  });

  it('maps segment progress to frames, also backwards', () => {
    expect(frameIndex(0, 71, false)).toBe(0);
    expect(frameIndex(1, 71, false)).toBe(70);
    expect(frameIndex(0.5, 71, false)).toBe(35);
    expect(frameIndex(0, 71, true)).toBe(70);
  });

  it('shows the endpoint photos only near the ends', () => {
    expect(endpointAlphas(0)).toEqual({ from: 1, to: 0 });
    expect(endpointAlphas(0.5)).toEqual({ from: 0, to: 0 });
    expect(endpointAlphas(1)).toEqual({ from: 0, to: 1 });
  });

  it('snaps to the nearest scene, pushed by a fling', () => {
    expect(snapTarget(1.2, 0, 1)).toBe(1); // poco arrastre: vuelve
    expect(snapTarget(1.35, 0, 1)).toBe(2); // más del 30 %: pasa a la vecina
    expect(snapTarget(0.65, 0, 1)).toBe(0);
    expect(snapTarget(1.2, 2, 1)).toBe(2); // impulso
    expect(snapTarget(1.1, 50, 1)).toBe(2); // el impulso nunca salta más de una escena
    expect(snapTarget(2.6, 0, 1)).toBe(3); // arrastre largo: la más cercana
  });
});
