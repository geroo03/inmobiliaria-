'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { UnitListItem, UnitStatus } from '@/types/domain';
import { ChevronLeft } from '@/components/icons';
import { DEFAULT_FILTERS, filterUnits, type SortKey, type UnitFilters } from './filters';
import { STATUS } from './status';
import { formatArea, formatPrice, formatRooms } from './format';

const SORTS: [SortKey, string][] = [
  ['floor-asc', 'Piso (menor a mayor)'],
  ['floor-desc', 'Piso (mayor a menor)'],
  ['price-asc', 'Precio (menor a mayor)'],
  ['price-desc', 'Precio (mayor a menor)'],
  ['area-desc', 'Superficie (mayor a menor)'],
];
const STATUS_FILTERS: UnitStatus[] = ['available', 'reserved', 'sold'];

export function UnitSearch({ base, projectName, entrySceneId, items }: { base: string; projectName: string; entrySceneId: string; items: UnitListItem[] }) {
  const [f, setF] = useState<UnitFilters>(DEFAULT_FILTERS);
  const results = useMemo(() => filterUnits(items, f), [items, f]);
  const levels = useMemo(() => [...new Set(items.map((i) => i.floor.level))].sort((a, b) => a - b), [items]);
  const bedroomOptions = useMemo(() => [...new Set(items.map((i) => i.typology.bedrooms))].sort(), [items]);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-line bg-white'}`;
  const select = 'rounded-xl border border-line bg-white px-3 py-2 text-sm';

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 p-3 sm:p-4">
          <Link href={`${base}/explore/${entrySceneId}`} className="pill"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Volver al edificio</span></Link>
          <h1 className="text-lg font-extrabold sm:text-xl">Buscar unidades · {projectName}</h1>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-4 p-3 sm:p-4">
        <section aria-label="Filtros" className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <input type="search" value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} placeholder="Buscar por unidad, por ejemplo 7A" aria-label="Buscar unidad" className={`${select} min-w-0 flex-1`} />
            <select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as SortKey })} aria-label="Ordenar" className={select}>
              {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Estado">
            <span className="w-24 text-sm text-muted">Estado</span>
            {STATUS_FILTERS.map((s) => <button key={s} type="button" aria-pressed={f.statuses.includes(s)} onClick={() => setF({ ...f, statuses: toggle(f.statuses, s) })} className={chip(f.statuses.includes(s))}>{STATUS[s].label}s</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dormitorios">
            <span className="w-24 text-sm text-muted">Dormitorios</span>
            {bedroomOptions.map((b) => <button key={b} type="button" aria-pressed={f.bedrooms.includes(b)} onClick={() => setF({ ...f, bedrooms: toggle(f.bedrooms, b) })} className={chip(f.bedrooms.includes(b))}>{b === 0 ? 'Monoambiente' : b}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-sm text-muted">Piso</span>
            <select aria-label="Piso desde" value={f.minFloor ?? ''} onChange={(e) => setF({ ...f, minFloor: e.target.value ? Number(e.target.value) : null })} className={select}>
              <option value="">Desde</option>{levels.map((l) => <option key={l} value={l}>{l}°</option>)}
            </select>
            <select aria-label="Piso hasta" value={f.maxFloor ?? ''} onChange={(e) => setF({ ...f, maxFloor: e.target.value ? Number(e.target.value) : null })} className={select}>
              <option value="">Hasta</option>{levels.map((l) => <option key={l} value={l}>{l}°</option>)}
            </select>
            <select aria-label="Precio máximo" value={f.maxPrice ?? ''} onChange={(e) => setF({ ...f, maxPrice: e.target.value ? Number(e.target.value) : null })} className={select}>
              <option value="">Cualquier precio</option>
              {[80000, 100000, 120000, 150000, 180000].map((p) => <option key={p} value={p}>Hasta {formatPrice(p, 'USD')}</option>)}
            </select>
            <button type="button" onClick={() => setF(DEFAULT_FILTERS)} className="ml-auto text-sm font-semibold underline">Limpiar</button>
          </div>
        </section>

        <p className="text-sm text-muted" aria-live="polite"><b className="text-ink">{results.length}</b> {results.length === 1 ? 'unidad' : 'unidades'}</p>
        {results.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted">No hay unidades con esos filtros. Probá sacando alguno.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ unit, typology, floor, building }) => (
              <li key={unit.id}>
                <Link href={`${base}/buildings/${building.id}/floors/${floor.id}?unit=${unit.id}`} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm ring-[var(--brand)] transition hover:ring-2">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-lg">{unit.code}</b>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: STATUS[unit.status].color }}>{STATUS[unit.status].label}</span>
                  </div>
                  <p className={unit.price === null ? 'text-sm text-muted' : 'font-bold'}>{unit.status === 'available' ? formatPrice(unit.price, unit.currency) : '—'}</p>
                  <dl className="grid gap-1 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Superficie total</dt><dd>{formatArea(typology.totalArea)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Ambientes</dt><dd>{formatRooms(typology.rooms)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Piso</dt><dd>{floor.name}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Orientación</dt><dd>{unit.orientation}</dd></div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
