/**
 * Límite de pedidos por clave (IP) con ventana deslizante, en memoria del proceso.
 * Alcanza para un solo servidor; con varias instancias (serverless) hace falta un almacén
 * compartido, por ejemplo una tabla en Postgres o Redis.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    /** true si el pedido entra en el límite (y lo cuenta). */
    take(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((h) => t - h < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.every((h) => t - h >= windowMs)) hits.delete(k);
      return true;
    },
  };
}
