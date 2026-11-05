'use client';

import { useEffect, useRef, useState } from 'react';
import { Close } from '@/components/icons';

/**
 * Recorrido 360: la panorámica equirectangular se pega por dentro de una esfera y la cámara,
 * en el centro, mira alrededor arrastrando. Rueda o pellizco para acercar.
 * Three.js se carga recién al abrir el recorrido, para no sumarlo al resto de la página.
 */
export function Tour360({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
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

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100);
        const geometry = new THREE.SphereGeometry(10, 64, 32);
        geometry.scale(-1, 1, 1); // la imagen se ve desde adentro
        const material = new THREE.MeshBasicMaterial();
        scene.add(new THREE.Mesh(geometry, material));

        new THREE.TextureLoader().load(
          src,
          (tex) => {
            if (disposed) { tex.dispose(); return; }
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            material.map = tex;
            material.needsUpdate = true;
            setStatus('ready');
          },
          undefined,
          () => !disposed && setStatus('error'),
        );

        // Mirada en grados: lon alrededor, lat arriba/abajo. Gira solo hasta que se toca.
        // lon = -90 mira al centro de la panorámica, donde está el ventanal al balcón.
        let lon = -90, lat = 0, auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pointers = new Map<number, { x: number; y: number }>();
        let pinch = 0;
        const el = renderer.domElement;
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
        const zoom = (delta: number) => { camera.fov = Math.min(90, Math.max(35, camera.fov + delta)); camera.updateProjectionMatrix(); };
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

        const resize = () => {
          renderer.setSize(mount.clientWidth, mount.clientHeight);
          camera.aspect = mount.clientWidth / mount.clientHeight;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        let raf = 0;
        const target = new THREE.Vector3();
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (auto) lon += 0.04;
          lat = Math.max(-80, Math.min(80, lat));
          const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lon);
          target.setFromSphericalCoords(1, phi, theta);
          camera.lookAt(target);
          renderer.render(scene, camera);
        };
        loop();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          window.removeEventListener('keydown', key);
          material.map?.dispose();
          material.dispose();
          geometry.dispose();
          renderer.dispose();
          el.remove();
        };
      })
      .catch(() => !disposed && setStatus('error'));

    return () => { disposed = true; cleanup(); };
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Recorrido 360: ${title}`} className="fixed inset-0 z-50 bg-black">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 sm:p-4">
        <p className="pill">{title} · 360°</p>
        <button type="button" onClick={onClose} autoFocus className="pill pointer-events-auto" aria-label="Cerrar recorrido 360"><Close className="size-4" /><span className="hidden sm:inline">Cerrar</span></button>
      </div>
      {status === 'loading' && <p className="pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" role="status">Cargando recorrido…</p>}
      {status === 'error' && <p className="pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" role="alert">No se pudo cargar el recorrido 360 en este navegador.</p>}
      <p className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-xs text-white/90">Arrastrá para mirar alrededor · rueda o pellizco para acercar · imagen ilustrativa</p>
    </div>
  );
}
