'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { GallerySection } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { ChevronLeft, ChevronRight, Close } from '@/components/icons';

/** Galería a pantalla completa: una imagen por vez, con flechas, teclado y miniaturas. */
export function Gallery({ section, backHref }: { section: GallerySection; backHref: string }) {
  const [i, setI] = useState(0);
  const n = section.items.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % n);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  const item = section.items[i];
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black text-white">
      {item && (
        // eslint-disable-next-line @next/next/no-img-element -- cambia de imagen sin recargar
        <img key={item.url} src={mediaUrl(item.url)} alt={`${item.caption} (imagen ilustrativa)`} className="scene-fade-in absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 sm:p-4">
        <h1 className="pill">{section.title}</h1>
        <Link href={backHref} className="pill" aria-label="Volver al edificio"><Close className="size-4" /><span className="hidden sm:inline">Volver</span></Link>
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="pill absolute left-3 top-1/2 size-12 -translate-y-1/2 justify-center p-0 sm:left-5"><ChevronLeft className="size-6" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="pill absolute right-3 top-1/2 size-12 -translate-y-1/2 justify-center p-0 sm:right-5"><ChevronRight className="size-6" /></button>
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
        <p className="text-lg font-bold" aria-live="polite">{item?.caption}</p>
        <div className="flex gap-2" role="group" aria-label="Imágenes">
          {section.items.map((it, j) => (
            <button key={it.url} type="button" onClick={() => setI(j)} aria-label={it.caption} aria-current={j === i} className={`h-12 w-18 overflow-hidden rounded-lg ring-2 ${j === i ? 'ring-white' : 'ring-transparent opacity-70'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura */}
              <img src={mediaUrl(it.url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/70">Imágenes ilustrativas</p>
      </div>
    </main>
  );
}
