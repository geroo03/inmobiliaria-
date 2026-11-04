'use client';

import { useState } from 'react';
import type { Floor, PublicUnit, Typology } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { ChevronLeft, ChevronRight, Close } from '@/components/icons';
import { LeadForm } from '@/features/leads/LeadForm';
import { STATUS, isOpenForSale } from './status';
import { formatArea, formatPrice, formatRooms } from './format';

interface Props {
  projectSlug: string;
  buildingName: string;
  unit: PublicUnit;
  typology: Typology;
  floor: Floor;
  onClose: () => void;
}

export function UnitPanel({ projectSlug, buildingName, unit, typology, floor, onClose }: Props) {
  const [img, setImg] = useState(0);
  const [asking, setAsking] = useState(false);
  const st = STATUS[unit.status];
  const images = typology.images;
  const rows: [string, string][] = [
    ['Superficie total', formatArea(typology.totalArea)],
    ['Superficie cubierta', formatArea(typology.coveredArea)],
    ['Balcón', formatArea(typology.uncoveredArea)],
    ['Ambientes', formatRooms(typology.rooms)],
    ['Dormitorios', typology.bedrooms === 0 ? '—' : String(typology.bedrooms)],
    ['Baños', String(typology.bathrooms)],
    ['Piso', floor.name],
    ['Orientación', unit.orientation],
  ];

  return (
    <aside aria-labelledby="unit-title" className="flex max-h-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="relative aspect-[16/10] shrink-0 bg-paper">
        {images[img] && (
          // eslint-disable-next-line @next/next/no-img-element -- galería simple de la tipología
          <img src={mediaUrl(images[img].url)} alt={`${images[img].caption} de la ${typology.name} (imagen ilustrativa)`} className="h-full w-full object-cover" />
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">{images[img]?.caption} · imagen ilustrativa</span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Imagen anterior" onClick={() => setImg((i) => (i - 1 + images.length) % images.length)} className="pill absolute left-2 top-1/2 size-9 -translate-y-1/2 justify-center p-0"><ChevronLeft className="size-5" /></button>
            <button type="button" aria-label="Imagen siguiente" onClick={() => setImg((i) => (i + 1) % images.length)} className="pill absolute right-2 top-1/2 size-9 -translate-y-1/2 justify-center p-0"><ChevronRight className="size-5" /></button>
          </>
        )}
        <button type="button" onClick={onClose} aria-label="Cerrar ficha" className="pill absolute right-2 top-2 size-9 justify-center p-0"><Close className="size-5" /></button>
      </div>
      <div className="grid gap-4 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="unit-title" className="text-2xl font-extrabold tracking-tight">Unidad {unit.code}</h2>
            <p className="text-sm text-muted">{buildingName} · {typology.name}</p>
          </div>
          <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: st.color }}>{st.label}</span>
        </div>
        {isOpenForSale(unit.status) && (
          <p className="text-xl font-bold">{formatPrice(unit.price, unit.currency)}</p>
        )}
        <dl className="divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        {isOpenForSale(unit.status) ? (
          asking ? (
            <LeadForm projectSlug={projectSlug} unitId={unit.id} unitCode={unit.code} onClose={() => setAsking(false)} />
          ) : (
            <button type="button" onClick={() => setAsking(true)} className="pill pill-brand justify-center py-3">
              {unit.price === null ? 'Consultar precio' : 'Consultar por esta unidad'}
            </button>
          )
        ) : (
          <p className="rounded-xl bg-paper p-3 text-sm text-muted">Esta unidad no está a la venta. Mirá las disponibles en este u otros pisos.</p>
        )}
        <p className="text-[11px] leading-snug text-muted">Superficies, precios e imágenes ilustrativos, sujetos a cambios. Proyecto ficticio de demostración.</p>
      </div>
    </aside>
  );
}
