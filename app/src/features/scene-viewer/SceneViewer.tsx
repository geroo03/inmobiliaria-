'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FloorAvailability, Hotspot, Scene, SceneTransition } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { fitTransform, polygonPoints, toScreen } from '@/lib/geometry';
import { useElementSize, useMediaQuery } from '@/components/useElementSize';
import { ChevronLeft, ChevronRight, Moon, Search, Sun } from '@/components/icons';
import { currentScene, viewerReducer, type TransitionGraph, type ViewerEvent, type ViewerState } from './reducer';
import { buildTransitionGraph, neighbors } from './graph';

/** Si el video no arranca en este tiempo, se corta directo a la escena destino. */
const VIDEO_START_TIMEOUT_MS = 4000;

interface Props {
  base: string;
  projectName: string;
  scenes: Scene[];
  transitions: SceneTransition[];
  initialSceneId: string;
  initialNight: boolean;
  availability: FloorAvailability[];
}

export function SceneViewer({ base, projectName, scenes, transitions, initialSceneId, initialNight, availability }: Props) {
  const router = useRouter();
  const [night, setNight] = useState(initialNight);
  const mobile = useMediaQuery('(max-width: 768px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sceneById = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes]);

  const graph = useMemo<TransitionGraph>(
    () => (reducedMotion ? { get: () => undefined } : buildTransitionGraph(transitions, { night, mobile, resolve: mediaUrl })),
    [transitions, night, mobile, reducedMotion],
  );
  const [state, setState] = useState<ViewerState>({ kind: 'idle', scene: initialSceneId });
  // Video que ya está reproduciendo; se limpia al terminar cada transición.
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  // Imagen anterior que se desvanece encima de la nueva cuando se cambia sin video (o el video falla).
  const [fadeFrom, setFadeFrom] = useState<string | null>(null);
  const playing = state.kind === 'transitioning' && playingUrl === state.videoUrl;

  const imageOf = useCallback(
    (id: string) => {
      const s = sceneById.get(id);
      if (!s) return '';
      return mediaUrl(night && s.imageNightUrl ? s.imageNightUrl : s.imageDayUrl);
    },
    [sceneById, night],
  );

  const dispatch = useCallback(
    (e: ViewerEvent) => {
      const next = viewerReducer(state, e, graph);
      if (next === state) return;
      // Corte sin video: fundido desde la imagen que se estaba viendo.
      if (next.kind === 'idle' && !(state.kind === 'transitioning' && playing)) {
        setFadeFrom(imageOf(state.kind === 'idle' ? state.scene : state.from));
      }
      if (e.type !== 'NAVIGATE') setPlayingUrl(null);
      setState(next);
    },
    [state, graph, playing, imageOf],
  );

  const sceneId = currentScene(state);
  const scene = sceneById.get(sceneId) ?? scenes[0];
  const near = neighbors(transitions, sceneId);

  // Debajo del video queda la escena de origen hasta que el video arranca; después, la de destino,
  // para que al terminar no haya salto (la imagen fija es el último cuadro del video).
  const baseSceneId = state.kind === 'idle' ? state.scene : playing ? state.to : state.from;

  // La URL manda: al llegar a una escena se registra en el historial; atrás y adelante navegan.
  useEffect(() => {
    if (state.kind !== 'idle') return;
    const path = `${base}/explore/${state.scene}${night ? '?noche=1' : ''}`;
    if (window.location.pathname + window.location.search !== path) window.history.pushState(null, '', path);
  }, [state, base, night]);
  useEffect(() => {
    const onPop = () => {
      const id = window.location.pathname.split('/').pop();
      if (id && sceneById.has(id)) dispatch({ type: 'NAVIGATE', to: id });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sceneById, dispatch]);

  // Corte directo si el video no arranca a tiempo (red lenta o archivo caído).
  useEffect(() => {
    if (state.kind !== 'transitioning' || playing) return;
    const t = window.setTimeout(() => dispatch({ type: 'VIDEO_FAILED' }), VIDEO_START_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [state, playing, dispatch]);

  // Precarga de las escenas vecinas: imágenes destino y videos salientes (como mucho dos a la vez).
  useEffect(() => {
    if (state.kind !== 'idle') return;
    const targets = [near.right, near.left].filter((x): x is string => Boolean(x));
    targets.forEach((id) => { const img = new Image(); img.src = imageOf(id); });
    const ctrl = new AbortController();
    const videos = targets.map((id) => graph.get(state.scene, id)?.videoUrl).filter((x): x is string => Boolean(x));
    Promise.all(videos.slice(0, 2).map((v) => fetch(v, { signal: ctrl.signal }).then((r) => r.blob()).catch(() => undefined)));
    return () => ctrl.abort();
  }, [state, near.left, near.right, graph, imageOf]);

  const go = (to: string | undefined) => to && dispatch({ type: 'NAVIGATE', to });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') go(near.right);
      if (e.key === 'ArrowLeft') go(near.left);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleNight = () => {
    const n = !night;
    if (state.kind === 'idle') setFadeFrom(imageOf(state.scene));
    setNight(n);
    window.history.replaceState(null, '', `${base}/explore/${sceneId}${n ? '?noche=1' : ''}`);
  };

  const openHotspot = (h: Hotspot) => {
    const t = h.target;
    if (t.type === 'scene') go(t.sceneId);
    else if (t.type === 'floor') router.push(`${base}/buildings/${t.buildingId}/floors/${t.floorId}`);
    else if (t.type === 'building') router.push(`${base}/buildings/${t.buildingId}`);
    else window.open(t.url, '_blank', 'noopener');
  };

  const transitioning = state.kind === 'transitioning';
  return (
    <main className="relative h-dvh w-full select-none overflow-hidden bg-black text-ink">
      {/* eslint-disable-next-line @next/next/no-img-element -- capas que cambian sin recargar; el tamaño lo da object-cover */}
      <img src={imageOf(baseSceneId)} alt={`${projectName}: vista ${scene?.name ?? ''} (imagen ilustrativa)`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {fadeFrom && (
        // eslint-disable-next-line @next/next/no-img-element -- capa temporal del fundido
        <img
          key={fadeFrom}
          src={fadeFrom}
          alt=""
          aria-hidden
          className="scene-fade-out absolute inset-0 h-full w-full object-cover"
          onAnimationEnd={() => setFadeFrom(null)}
          draggable={false}
        />
      )}
      {state.kind === 'transitioning' && (
        <video
          key={state.videoUrl}
          src={state.videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden
          onPlaying={() => setPlayingUrl(state.videoUrl)}
          onEnded={() => dispatch({ type: 'VIDEO_ENDED' })}
          onError={() => dispatch({ type: 'VIDEO_FAILED' })}
        />
      )}

      {scene && !transitioning && <HotspotLayer scene={scene} night={night} availability={availability} onOpen={openHotspot} />}

      {/* Barra superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <Link href={base || '/'} className="pill pointer-events-auto max-w-[45vw] truncate">{projectName}</Link>
        <Link href={`${base}/units`} className="pill pill-brand pointer-events-auto"><Search className="size-4" /><span className="hidden sm:inline">Buscar unidades</span></Link>
        <div className="pill pointer-events-auto gap-1 p-1" role="group" aria-label="Momento del día">
          <button type="button" onClick={() => night && toggleNight()} aria-pressed={!night} className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${!night ? 'bg-ink text-white' : ''}`}><Sun className="size-4" /><span className="hidden sm:inline">Día</span></button>
          <button type="button" onClick={() => !night && toggleNight()} aria-pressed={night} className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${night ? 'bg-ink text-white' : ''}`}><Moon className="size-4" /><span className="hidden sm:inline">Noche</span></button>
        </div>
      </div>

      {/* Rotar la vista */}
      {near.left && (
        <button type="button" onClick={() => go(near.left)} disabled={transitioning} aria-label="Girar a la izquierda" className="pill absolute left-3 top-1/2 size-12 -translate-y-1/2 justify-center p-0 disabled:opacity-50 sm:left-5">
          <ChevronLeft className="size-6" />
        </button>
      )}
      {near.right && (
        <button type="button" onClick={() => go(near.right)} disabled={transitioning} aria-label="Girar a la derecha" className="pill absolute right-3 top-1/2 size-12 -translate-y-1/2 justify-center p-0 disabled:opacity-50 sm:right-5">
          <ChevronRight className="size-6" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
        <p className="pill pointer-events-auto whitespace-nowrap text-xs sm:text-sm" aria-live="polite">{transitioning ? 'Girando…' : `Vista ${scene?.name ?? ''}`}</p>
        <p className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-white/85">Imágenes ilustrativas<span className="hidden sm:inline"> · tocá un piso para verlo</span></p>
      </div>
    </main>
  );
}

function HotspotLayer({ scene, night, availability, onOpen }: { scene: Scene; night: boolean; availability: FloorAvailability[]; onOpen: (h: Hotspot) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const [hover, setHover] = useState<Hotspot | null>(null);
  const fit = fitTransform(size.width, size.height, scene.width, scene.height, 'cover');
  const byFloor = new Map(availability.map((a) => [a.floorId, a]));
  const hotspots = night && scene.hotspotsNight ? scene.hotspotsNight : scene.hotspots;
  const areas = hotspots.filter((h) => h.target.type === 'floor');
  const labels = hotspots.filter((h) => h.target.type !== 'floor');
  const hoverInfo = hover?.target.type === 'floor' ? byFloor.get(hover.target.floorId) : undefined;

  return (
    <div ref={ref} className="absolute inset-0">
      {/* Mismo viewBox que la imagen + slice = object-fit: cover: los polígonos quedan alineados. */}
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${scene.width} ${scene.height}`} preserveAspectRatio="xMidYMid slice">
        {areas.map((h) => (
          <polygon
            key={h.id}
            points={polygonPoints(h.polygon, scene.width, scene.height)}
            role="link"
            tabIndex={0}
            aria-label={`${h.label}: ver planta`}
            className="cursor-pointer fill-white/0 stroke-white/0 transition-colors hover:fill-white/30 hover:stroke-white focus-visible:fill-white/30 focus-visible:stroke-white focus-visible:outline-none"
            strokeWidth={2.5}
            onMouseEnter={() => setHover(h)}
            onMouseLeave={() => setHover((c) => (c === h ? null : c))}
            onFocus={() => setHover(h)}
            onBlur={() => setHover(null)}
            onClick={() => onOpen(h)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(h))}
          />
        ))}
      </svg>
      {labels.map((h) => {
        const p = toScreen(h.labelAnchor, scene.width, scene.height, fit);
        // Por debajo de la barra superior y dentro de la pantalla, aunque el recorte de la imagen lo saque.
        const top = Math.max(p.y, 104), left = Math.min(Math.max(p.x, 90), size.width - 90);
        return (
          <button key={h.id} type="button" onClick={() => onOpen(h)} className="pill absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm" style={{ left, top }}>
            <span className="size-2.5 rounded-full bg-[var(--brand)]" aria-hidden />
            {h.label}
          </button>
        );
      })}
      {hover && (() => {
        const p = toScreen(hover.labelAnchor, scene.width, scene.height, fit);
        return (
          <div className="pointer-events-none absolute rounded-xl bg-ink/90 px-3 py-2 text-sm text-white shadow-lg" style={{ left: p.x + 16, top: p.y - 18 }} role="status">
            <b>{hover.label}</b>
            {hoverInfo && <span className="block text-white/80">{hoverInfo.available} de {hoverInfo.total} disponibles · tocá para ver la planta</span>}
          </div>
        );
      })()}
    </div>
  );
}
