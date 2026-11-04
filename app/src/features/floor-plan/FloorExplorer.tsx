'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Building, Floor, FloorAvailability, PublicUnit, Typology } from '@/types/domain';
import { mediaUrl } from '@/lib/media';
import { fitTransform, polygonPoints, toScreen } from '@/lib/geometry';
import { useElementSize } from '@/components/useElementSize';
import { Building as BuildingIcon, Search } from '@/components/icons';
import { STATUS } from '@/features/units/status';
import { UnitPanel } from '@/features/units/UnitPanel';

type View = '3d' | '2d';

interface Props {
  base: string;
  projectSlug: string;
  entrySceneId: string;
  building: Building;
  floors: Floor[];
  availability: FloorAvailability[];
  floor: Floor;
  units: PublicUnit[];
  typologies: Typology[];
  initialUnitId: string | null;
  initialView: View;
}

export function FloorExplorer(props: Props) {
  const { base, projectSlug, entrySceneId, building, floors, availability, floor, units, typologies } = props;
  const [view, setView] = useState<View>(floor.image2dUrl ? props.initialView : '3d');
  const [selectedId, setSelectedId] = useState<string | null>(units.some((u) => u.id === props.initialUnitId) ? props.initialUnitId : null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(planRef);
  const fit = fitTransform(size.width, size.height, floor.width, floor.height, 'contain');
  const typologyById = useMemo(() => new Map(typologies.map((t) => [t.id, t])), [typologies]);
  const selected = units.find((u) => u.id === selectedId) ?? null;
  const selectedTypology = selected ? typologyById.get(selected.typologyId) : undefined;
  const floorsDesc = [...floors].sort((a, b) => b.level - a.level);
  const avail = new Map(availability.map((a) => [a.floorId, a]));
  const pathFor = (floorId: string, unitId: string | null, v: View) => {
    const q = new URLSearchParams();
    if (unitId) q.set('unit', unitId);
    if (v === '2d') q.set('vista', '2d');
    const s = q.toString();
    return `${base}/buildings/${building.id}/floors/${floorId}${s ? `?${s}` : ''}`;
  };

  // Link profundo: la unidad elegida y la vista quedan en la URL sin recargar la página.
  useEffect(() => {
    const path = pathFor(floor.id, selectedId, view);
    if (window.location.pathname + window.location.search !== path) window.history.replaceState(null, '', path);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const imageUrl = mediaUrl(view === '2d' && floor.image2dUrl ? floor.image2dUrl : floor.image3dUrl);

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-paper text-ink">
      {/* Barra superior */}
      <header className="z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <Link href={`${base}/explore/${entrySceneId}`} className="pill"><BuildingIcon className="size-4" /><span className="hidden sm:inline">Volver al edificio</span></Link>
        <h1 className="pill whitespace-nowrap text-sm sm:text-base"><span className="hidden sm:inline">{building.name} · </span>Piso {floor.level}</h1>
        <div className="flex items-center gap-2">
          {floor.image2dUrl && (
            <div className="pill gap-1 p-1" role="group" aria-label="Tipo de planta">
              {([['3d', 'Render'], ['2d', 'Plano']] as const).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 ${view === v ? 'bg-ink text-white' : ''}`}>{label}</button>
              ))}
            </div>
          )}
          <Link href={`${base}/units`} className="pill pill-brand" aria-label="Buscar unidades"><Search className="size-4" /><span className="hidden lg:inline">Buscar unidades</span></Link>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {/* Planta: contain, para que se vea el piso entero. Deja lugar al panel y al selector de pisos. */}
        <div ref={planRef} className={`absolute inset-0 bottom-14 right-20 sm:right-24 ${selected ? 'md:left-[400px]' : 'md:left-4'} left-2`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- la planta cambia entre 3D y 2D sin recargar */}
          <img src={imageUrl} alt={`Planta del piso ${floor.level} (${view === '2d' ? 'plano técnico' : 'vista cenital'}, ilustrativa)`} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${floor.width} ${floor.height}`} preserveAspectRatio="xMidYMid meet">
            {units.map((u) => {
              const isSel = u.id === selectedId, isHover = u.id === hoverId;
              return (
                <polygon
                  key={u.id}
                  points={polygonPoints(u.polygon, floor.width, floor.height)}
                  fill={STATUS[u.status].color}
                  fillOpacity={isSel ? 0.42 : isHover ? 0.3 : view === '2d' ? 0.14 : 0.18}
                  stroke={isSel ? STATUS[u.status].color : 'transparent'}
                  strokeWidth={isSel ? 10 : 0}
                  className="cursor-pointer transition-[fill-opacity]"
                  onMouseEnter={() => setHoverId(u.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setSelectedId(u.id)}
                  aria-hidden
                />
              );
            })}
          </svg>
          {units.map((u) => {
            const p = toScreen(u.labelAnchor, floor.width, floor.height, fit);
            const st = STATUS[u.status];
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedId(u.id)}
                onMouseEnter={() => setHoverId(u.id)}
                onMouseLeave={() => setHoverId(null)}
                aria-pressed={u.id === selectedId}
                aria-label={`Unidad ${u.code}, ${st.label}`}
                className={`pill absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 text-sm ${u.id === selectedId ? 'ring-2 ring-[var(--brand)]' : ''}`}
                style={{ left: p.x, top: p.y }}
              >
                <span className="size-2.5 rounded-full" style={{ background: st.color }} aria-hidden />
                {u.code}
              </button>
            );
          })}
        </div>

        {/* Selector de pisos */}
        <nav aria-label="Pisos" className="absolute bottom-14 right-2 top-0 z-10 flex w-16 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-white/80 p-1.5 shadow-lg sm:right-4 sm:w-[72px]">
          {floorsDesc.map((f) => {
            const a = avail.get(f.id);
            const current = f.id === floor.id;
            return (
              <Link
                key={f.id}
                href={pathFor(f.id, null, view)}
                aria-current={current ? 'page' : undefined}
                className={`flex flex-col items-center rounded-xl py-2 text-sm font-bold ${current ? 'bg-[var(--brand)] text-white' : 'bg-white hover:bg-paper'}`}
              >
                {f.name}
                {a && <span className={`text-[10px] font-medium ${current ? 'text-white/80' : 'text-muted'}`}>{a.available} disp.</span>}
              </Link>
            );
          })}
        </nav>

        {/* Leyenda */}
        <ul className="absolute bottom-3 left-2 right-24 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:left-4" aria-label="Referencias">
          {(['available', 'reserved', 'sold', 'blocked'] as const).map((s) => (
            <li key={s} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: STATUS[s].color }} />{STATUS[s].label}</li>
          ))}
          <li>Planta ilustrativa</li>
        </ul>

        {selected && selectedTypology && (
          <div className="absolute inset-x-2 bottom-2 top-[30%] z-30 md:inset-auto md:bottom-14 md:left-4 md:top-0 md:w-[372px]">
            <UnitPanel projectSlug={projectSlug} buildingName={building.name} unit={selected} typology={selectedTypology} floor={floor} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </main>
  );
}
