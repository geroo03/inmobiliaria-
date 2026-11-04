import type { UnitListItem, UnitStatus } from '@/types/domain';

export type SortKey = 'floor-asc' | 'floor-desc' | 'price-asc' | 'price-desc' | 'area-desc';

export interface UnitFilters {
  query: string;
  statuses: UnitStatus[];
  bedrooms: number[];
  minFloor: number | null;
  maxFloor: number | null;
  maxPrice: number | null;
  sort: SortKey;
}

export const DEFAULT_FILTERS: UnitFilters = {
  query: '',
  statuses: ['available'],
  bedrooms: [],
  minFloor: null,
  maxFloor: null,
  maxPrice: null,
  sort: 'floor-asc',
};

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function filterUnits(items: readonly UnitListItem[], f: UnitFilters): UnitListItem[] {
  const q = normalize(f.query);
  const out = items.filter(({ unit, typology, floor }) => {
    if (f.statuses.length && !f.statuses.includes(unit.status)) return false;
    if (f.bedrooms.length && !f.bedrooms.includes(typology.bedrooms)) return false;
    if (f.minFloor !== null && floor.level < f.minFloor) return false;
    if (f.maxFloor !== null && floor.level > f.maxFloor) return false;
    // Con tope de precio, las que no publican precio quedan afuera: no se puede saber si entran.
    if (f.maxPrice !== null && (unit.price === null || unit.price > f.maxPrice)) return false;
    if (q && !normalize(`${unit.code} ${typology.name} ${unit.orientation}`).includes(q)) return false;
    return true;
  });
  return sortUnits(out, f.sort);
}

export function sortUnits(items: UnitListItem[], key: SortKey): UnitListItem[] {
  const byFloor = (a: UnitListItem, b: UnitListItem) => a.floor.level - b.floor.level || a.unit.code.localeCompare(b.unit.code);
  // Sin precio publicado va al final en los dos sentidos.
  const price = (i: UnitListItem, dir: 1 | -1) => (i.unit.price === null ? Infinity : dir * i.unit.price);
  const cmp: Record<SortKey, (a: UnitListItem, b: UnitListItem) => number> = {
    'floor-asc': byFloor,
    'floor-desc': (a, b) => -byFloor(a, b),
    'price-asc': (a, b) => price(a, 1) - price(b, 1) || byFloor(a, b),
    'price-desc': (a, b) => price(a, -1) - price(b, -1) || byFloor(a, b),
    'area-desc': (a, b) => b.typology.totalArea - a.typology.totalArea || byFloor(a, b),
  };
  return [...items].sort(cmp[key]);
}
