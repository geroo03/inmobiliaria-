'use client';

import { useEffect, useRef, useState } from 'react';
import type { TourScene, TourSpot } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { Close } from '@/components/icons';

/** Punto de la imagen (0–1) a dirección de mirada, en grados: lon alrededor, lat arriba/abajo. */
export function spotToLook(s: TourSpot): { lon: number; lat: number } {
  return { lon: 90 - 360 * s.u, lat: 90 - 180 * s.v };
}

/**
 * Recorrido 360: cada ambiente es una panorámica equirectangular pegada por dentro de una esfera;
 * la cámara, en el centro, mira alrededor arrastrando. Las puertas llevan a otros ambientes.
 * Three.js se carga recién al abrir el recorrido, para no sumarlo al resto de la página.
 */
export function Tour360({ scenes, title, onClose }: { scenes: TourScene[]; title: string; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const goRef = useRef<(id: string) => void>(() => {});
  const [sceneId, setSceneId] = useState(scenes[0]?.id ?? '');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fading, setFading] = useState(false);
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const nameOf = (id: string) => scenes.find((s) => s.id === id)?.name ?? id;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || scenes.length === 0) return;
    let disposed = false;
    let cleanup = () => {};

    import('three')
      .then((THREE) => {
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.touchAction = 'none';

        const world = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100);
        const geometry = new THREE.SphereGeometry(10, 64, 32);
        geometry.scale(-1, 1, 1); // la imagen se ve desde adentro
        const material = new THREE.MeshBasicMaterial();
        world.add(new THREE.Mesh(geometry, material));
        const loader = new THREE.TextureLoader();
        const textures = new Map<string, InstanceType<typeof THREE.Texture>>();

        let lon = 0, lat = 0, auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let current = scenes[0];

        const load = (s: TourScene) =>
          new Promise<InstanceType<typeof THREE.Texture>>((resolve, reject) => {
            const cached = textures.get(s.id);
            if (cached) return resolve(cached);
            loader.load(mediaUrl(s.url), (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
              textures.set(s.id, tex);
              resolve(tex);
            }, undefined, reject);
          });

        const show = async (id: string, first = false) => {
          const next = scenes.find((s) => s.id === id);
          if (!next) return;
          if (!first) setFading(true);
          try {
            const [tex] = await Promise.all([load(next), first ? null : new Promise((r) => setTimeout(r, 250))]);
            if (disposed) return;
            material.map = tex;
            material.needsUpdate = true;
            current = next;
            ({ lon, lat } = spotToLook(next.start));
            camera.fov = 75; camera.updateProjectionMatrix();
            setSceneId(next.id);
            setStatus('ready');
            // Precarga de los ambientes vecinos.
            next.links.forEach((l) => { const s = scenes.find((x) => x.id === l.to); if (s) load(s).catch(() => {}); });
          } catch {
            if (!disposed) setStatus('error');
          } finally {
            if (!disposed) setFading(false);
          }
        };
        goRef.current = (id) => { auto = false; show(id); };
        show(scenes[0].id, true);

        const pointers = new Map<number, { x: number; y: number }>();
        let pinch = 0;
        const el = renderer.domElement;
        const zoom = (delta: number) => { camera.fov = Math.min(90, Math.max(35, camera.fov + delta)); camera.updateProjectionMatrix(); };
        const down = (e: PointerEvent) => { auto = false; el.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); };
        const move = (e: PointerEvent) => {
          const prev = pointers.get(e.pointerId);
          if (!prev) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinch) zoom((pinch - d) * 0.15);
            pinch = d;
            return;
          }
          const k = camera.fov / mount.clientHeight;
          lon -= (e.clientX - prev.x) * k;
          lat += (e.clientY - prev.y) * k;
        };
        const up = (e: PointerEvent) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = 0; };
        const wheel = (e: WheelEvent) => { e.preventDefault(); auto = false; zoom(e.deltaY * 0.03); };
        const key = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') lon -= 5;
          else if (e.key === 'ArrowRight') lon += 5;
          else if (e.key === 'ArrowUp') lat += 5;
          else if (e.key === 'ArrowDown') lat -= 5;
          else return;
          auto = false;
        };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('wheel', wheel, { passive: false });
        window.addEventListener('keydown', key);

        const ro = new ResizeObserver(() => {
          renderer.setSize(mount.clientWidth, mount.clientHeight);
          camera.aspect = mount.clientWidth / mount.clientHeight;
          camera.updateProjectionMatrix();
        });
        ro.observe(mount);

        let raf = 0;
        const target = new THREE.Vector3(), p = new THREE.Vector3();
        const dir = (lo: number, la: number) => target.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - la), THREE.MathUtils.degToRad(lo));
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (auto) lon += 0.04;
          lat = Math.max(-80, Math.min(80, lat));
          camera.lookAt(dir(lon, lat));
          camera.updateMatrixWorld();
          renderer.render(world, camera);
          // Las puertas siguen a la imagen: se proyectan a la pantalla en cada cuadro.
          current.links.forEach((l, i) => {
            const btn = linkRefs.current[i];
            if (!btn) return;
            const look = spotToLook(l.at);
            p.copy(dir(look.lon, look.lat)).multiplyScalar(5).project(camera);
            const visible = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
            btn.style.visibility = visible ? 'visible' : 'hidden';
            btn.style.transform = `translate(${((p.x + 1) / 2) * mount.clientWidth}px, ${((1 - p.y) / 2) * mount.clientHeight}px) translate(-50%, -50%)`;
          });
        };
        loop();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          window.removeEventListener('keydown', key);
          textures.forEach((t) => t.dispose());
          material.dispose();
          geometry.dispose();
          renderer.dispose();
          el.remove();
        };
      })
      .catch(() => !disposed && setStatus('error'));

    return () => { disposed = true; cleanup(); };
  }, [scenes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Recorrido 360: ${title}`} className="fixed inset-0 z-50 overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      {scene?.links.map((l, i) => (
        <button
          key={`${scene.id}-${l.to}`}
          ref={(el) => { linkRefs.current[i] = el; }}
          type="button"
          onClick={() => goRef.current(l.to)}
          style={{ visibility: 'hidden' }}
          className="pill absolute left-0 top-0 gap-2 border-2 border-white/80 bg-white/85 text-sm"
        >
          <span className="grid size-6 place-items-center rounded-full bg-[var(--brand)] text-white" aria-hidden>↗</span>
          Ir al {nameOf(l.to).toLowerCase()}
        </button>
      ))}
      <div aria-hidden className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-200 ${fading ? 'opacity-100' : 'opacity-0'}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          <p className="pill">{title} · 360°</p>
          {scenes.length > 1 && (
            <div className="pill pointer-events-auto gap-1 self-start p-1" role="group" aria-label="Ambientes">
              {scenes.map((s) => (
                <button key={s.id} type="button" aria-pressed={s.id === sceneId} onClick={() => goRef.current(s.id)} className={`rounded-full px-3 py-1 text-xs ${s.id === sceneId ? 'bg-ink text-white' : ''}`}>{s.name}</button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={onClose} autoFocus className="pill pointer-events-auto" aria-label="Cerrar recorrido 360"><Close className="size-4" /><span className="hidden sm:inline">Cerrar</span></button>
      </div>
      {status === 'loading' && <p className="pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" role="status">Cargando recorrido…</p>}
      {status === 'error' && <p className="pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" role="alert">No se pudo cargar el recorrido 360 en este navegador.</p>}
      <p className="absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[90vw] rounded-full bg-black/55 px-3 py-1 text-center text-xs text-white/90">Arrastrá para mirar alrededor · tocá una puerta para pasar · imagen ilustrativa</p>
    </div>
  );
}
