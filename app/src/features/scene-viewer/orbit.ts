/**
 * Giro libre alrededor del edificio. La posición `p` es continua sobre el anillo de escenas:
 * p = 0 es la primera escena, p = 1 la segunda, y así; entre dos enteros se está en el tramo
 * que las une (con los cuadros de su video, si los hay, o con un fundido en movimiento).
 */
export const mod = (a: number, n: number) => ((a % n) + n) % n;

export interface SegmentPosition {
  /** Escena de partida del tramo (índice en el anillo). */
  from: number;
  /** Escena de llegada del tramo. */
  to: number;
  /** Avance dentro del tramo, de 0 a 1. */
  t: number;
}

export function segmentAt(p: number, n: number): SegmentPosition {
  const k = Math.floor(p);
  return { from: mod(k, n), to: mod(k + 1, n), t: p - k };
}

/** Cuadro a mostrar de un tramo con `count` cuadros; `reverse` si el video va de `to` a `from`. */
export function frameIndex(t: number, count: number, reverse: boolean): number {
  const x = reverse ? 1 - t : t;
  return Math.min(count - 1, Math.max(0, Math.round(x * (count - 1))));
}

/**
 * Cuánto se ven las fotos de los extremos sobre los cuadros del video, para que al empezar y al
 * terminar de girar no haya salto entre la foto y el cuadro (la IA redibuja algunos detalles).
 */
export function endpointAlphas(t: number, edge = 0.15): { from: number; to: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { from: clamp(1 - t / edge), to: clamp((t - (1 - edge)) / edge) };
}

/**
 * Escena en la que se apoya el giro al soltar: la más cercana, corrida hacia donde se venía
 * moviendo si se soltó con impulso. Desde `start`, con arrastrar un 30 % ya pasa a la vecina.
 * `velocity` en escenas por segundo.
 */
export function snapTarget(p: number, velocity: number, start: number): number {
  const fling = Math.max(-0.6, Math.min(0.6, velocity * 0.35));
  const target = Math.round(p + fling);
  if (target === start && Math.abs(p - start) > 0.3) return start + Math.sign(p - start);
  return target;
}
