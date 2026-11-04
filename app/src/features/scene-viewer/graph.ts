import type { SceneTransition } from '@/types/domain';
import type { TransitionGraph } from './reducer';

export interface GraphOptions {
  night: boolean;
  mobile: boolean;
  /** Convierte la ruta guardada en una URL pública (CDN o /media). */
  resolve: (path: string) => string;
}

/** Elige el video de cada transición según día o noche y el tamaño de pantalla. */
export function buildTransitionGraph(transitions: readonly SceneTransition[], opts: GraphOptions): TransitionGraph {
  const map = new Map(transitions.map((t) => [`${t.fromSceneId}>${t.toSceneId}`, t]));
  return {
    get(from, to) {
      const t = map.get(`${from}>${to}`);
      if (!t) return undefined;
      const day = (opts.mobile && t.videoDayMobileUrl) || t.videoDayUrl;
      // De noche sin video nocturno se corta directo: un video de día en medio de la noche se ve peor que el corte.
      const night = (opts.mobile && t.videoNightMobileUrl) || t.videoNightUrl;
      const path = opts.night ? night : day;
      return path ? { videoUrl: opts.resolve(path) } : undefined;
    },
  };
}

/** Escenas vecinas en la órbita, según las transiciones disponibles. */
export function neighbors(transitions: readonly SceneTransition[], sceneId: string): { left?: string; right?: string } {
  const out: { left?: string; right?: string } = {};
  for (const t of transitions) if (t.fromSceneId === sceneId) out[t.direction] = t.toSceneId;
  return out;
}
