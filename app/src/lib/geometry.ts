import type { Point, Polygon } from '@/types/domain';

export type Fit = 'cover' | 'contain';

export interface FitTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Cómo se ubica una imagen de (iw × ih) dentro de un contenedor de (cw × ch) con object-fit.
 * Es la misma cuenta que hace el SVG con preserveAspectRatio slice (cover) o meet (contain).
 */
export function fitTransform(cw: number, ch: number, iw: number, ih: number, fit: Fit): FitTransform {
  if (cw <= 0 || ch <= 0 || iw <= 0 || ih <= 0) return { scale: 0, offsetX: 0, offsetY: 0 };
  const scale = fit === 'cover' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
  return { scale, offsetX: (cw - iw * scale) / 2, offsetY: (ch - ih * scale) / 2 };
}

/** Punto normalizado (0–1 de la imagen) a píxeles del contenedor. */
export function toScreen(p: Point, iw: number, ih: number, t: FitTransform): { x: number; y: number } {
  return { x: t.offsetX + p[0] * iw * t.scale, y: t.offsetY + p[1] * ih * t.scale };
}

/** Polígono normalizado a la lista de puntos de un <polygon> con viewBox = tamaño de la imagen. */
export function polygonPoints(poly: Polygon, iw: number, ih: number): string {
  return poly.map(([x, y]) => `${(x * iw).toFixed(1)},${(y * ih).toFixed(1)}`).join(' ');
}
