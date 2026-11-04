/**
 * Máquina de estados del visor de escenas: o se muestra una escena, o se reproduce el video
 * de transición hacia otra. Es pura para poder testearla sin navegador.
 */
export type SceneId = string;

export type ViewerState =
  | { kind: 'idle'; scene: SceneId }
  | { kind: 'transitioning'; from: SceneId; to: SceneId; videoUrl: string };

export type ViewerEvent =
  | { type: 'NAVIGATE'; to: SceneId }
  | { type: 'VIDEO_ENDED' }
  | { type: 'VIDEO_FAILED' };

export interface TransitionGraph {
  get(from: SceneId, to: SceneId): { videoUrl: string } | undefined;
}

export function viewerReducer(state: ViewerState, event: ViewerEvent, graph: TransitionGraph): ViewerState {
  switch (state.kind) {
    case 'idle': {
      if (event.type !== 'NAVIGATE' || event.to === state.scene) return state;
      const t = graph.get(state.scene, event.to);
      // Sin video, corte directo: nunca se bloquea la navegación por falta de un archivo.
      return t
        ? { kind: 'transitioning', from: state.scene, to: event.to, videoUrl: t.videoUrl }
        : { kind: 'idle', scene: event.to };
    }
    case 'transitioning':
      if (event.type === 'VIDEO_ENDED' || event.type === 'VIDEO_FAILED') return { kind: 'idle', scene: state.to };
      return state; // los clics durante la transición se ignoran
  }
}

/** Escena que se ve (o a la que se está yendo). */
export const currentScene = (s: ViewerState): SceneId => (s.kind === 'idle' ? s.scene : s.to);
