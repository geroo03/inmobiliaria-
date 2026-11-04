import type { Scene, SceneTransition } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { endpointAlphas, frameIndex, segmentAt } from './orbit';

interface Options {
  scenes: Scene[];
  transitions: SceneTransition[];
  night: boolean;
  mobile: boolean;
}

/** Dibuja el giro en un canvas: cuadros del video del tramo, o un fundido en movimiento si no hay. */
export function createOrbitRenderer(canvas: HTMLCanvasElement, opts: Options) {
  const ctx = canvas.getContext('2d');
  const cache = new Map<string, HTMLImageElement>();
  const n = opts.scenes.length;
  const size = opts.mobile ? 720 : 1280;

  const load = (url: string) => {
    let img = cache.get(url);
    if (!img) {
      img = new Image();
      img.decoding = 'async';
      img.src = url;
      cache.set(url, img);
    }
    return img;
  };
  const ready = (img: HTMLImageElement | undefined): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

  const photo = (i: number) => {
    const s = opts.scenes[i];
    return load(mediaUrl(opts.night && s.imageNightUrl ? s.imageNightUrl : s.imageDayUrl));
  };

  /** Cuadros del tramo entre dos escenas, en cualquiera de los dos sentidos. */
  const framesFor = (from: number, to: number) => {
    const a = opts.scenes[from].id, b = opts.scenes[to].id;
    const fwd = opts.transitions.find((t) => t.fromSceneId === a && t.toSceneId === b && t.frames);
    if (fwd?.frames) return { ...fwd.frames, reverse: false };
    const back = opts.transitions.find((t) => t.fromSceneId === b && t.toSceneId === a && t.frames);
    return back?.frames ? { ...back.frames, reverse: true } : null;
  };
  const frameUrl = (path: string, i: number) => mediaUrl(`${path}/${size}/${String(i).padStart(3, '0')}.webp`);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };

  // Como object-fit: cover, con escala y corrimiento extra para el fundido en movimiento.
  const cover = (img: HTMLImageElement, alpha: number, scale = 1, dx = 0) => {
    if (!ctx || alpha <= 0) return;
    const W = canvas.width, H = canvas.height;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * scale;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2 + dx, (H - h) / 2, w, h);
    ctx.globalAlpha = 1;
  };

  // De noche los cuadros son de día: se oscurecen y se tiñen de azul mientras se gira.
  const nightTint = () => {
    if (!ctx || !opts.night) return;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#2c3a66';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  };

  return {
    /** Precarga las fotos y los cuadros de los tramos vecinos a una escena. */
    preload(index: number) {
      for (const j of [index, (index + 1) % n, (index - 1 + n) % n]) photo(j);
      for (const [a, b] of [[index, (index + 1) % n], [(index - 1 + n) % n, index]]) {
        const f = framesFor(a, b);
        if (f) for (let i = 0; i < f.count; i += 1) load(frameUrl(f.path, i));
      }
    },
    draw(p: number) {
      if (!ctx || n === 0) return;
      resize();
      const { from, to, t } = segmentAt(p, n);
      const A = photo(from), B = photo(to);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const frames = n > 1 ? framesFor(from, to) : null;
      const frame = frames ? load(frameUrl(frames.path, frameIndex(t, frames.count, frames.reverse))) : undefined;
      if (frames && ready(frame)) {
        cover(frame, 1);
        nightTint();
        const e = endpointAlphas(t);
        if (ready(A)) cover(A, e.from);
        if (ready(B)) cover(B, e.to);
        return;
      }
      // Sin cuadros (o todavía cargando): las dos fotos se corren en sentido contrario y se funden.
      const shift = canvas.width * 0.12;
      if (ready(A)) cover(A, 1, 1.18, -t * shift);
      if (ready(B)) cover(B, t, 1.18, (1 - t) * shift);
    },
  };
}

export type OrbitRenderer = ReturnType<typeof createOrbitRenderer>;
