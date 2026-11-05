import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filterUnits } from './filters';
import { formatPrice } from './format';
import type { UnitListItem, UnitStatus } from '@/types/domain';

function item(code: string, level: number, status: UnitStatus, price: number | null, bedrooms: number, totalArea = 50): UnitListItem {
  return {
    unit: { id: code, floorId: `f${level}`, typologyId: 't', code, status, price, currency: 'USD', orientation: 'Norte', polygon: [], labelAnchor: [0, 0] },
    typology: { id: 't', name: 'Tipología', totalArea, coveredArea: totalArea, uncoveredArea: 0, rooms: bedrooms + 1, bedrooms, bathrooms: 1, images: [], tour360Url: null },
    floor: { id: `f${level}`, level, name: `${level}°` },
    building: { id: 'b', name: 'Torre' },
  };
}

const items = [
  item('2A', 2, 'available', 150000, 2, 72),
  item('1B', 1, 'available', null, 1, 49),
  item('3C', 3, 'sold', 120000, 1),
  item('4D', 4, 'available', 90000, 0, 35),
];

describe('filterUnits', () => {
  it('shows only available units by default, ordered by floor', () => {
    expect(filterUnits(items, DEFAULT_FILTERS).map((i) => i.unit.code)).toEqual(['1B', '2A', '4D']);
  });

  it('filters by bedrooms and floor range', () => {
    const r = filterUnits(items, { ...DEFAULT_FILTERS, statuses: [], bedrooms: [1], minFloor: 2 });
    expect(r.map((i) => i.unit.code)).toEqual(['3C']);
  });

  it('excludes units without a published price when there is a price cap', () => {
    const r = filterUnits(items, { ...DEFAULT_FILTERS, maxPrice: 160000 });
    expect(r.map((i) => i.unit.code)).toEqual(['2A', '4D']);
  });

  it('sorts by price with unpublished prices last in both directions', () => {
    expect(filterUnits(items, { ...DEFAULT_FILTERS, sort: 'price-asc' }).map((i) => i.unit.code)).toEqual(['4D', '2A', '1B']);
    expect(filterUnits(items, { ...DEFAULT_FILTERS, sort: 'price-desc' }).map((i) => i.unit.code)).toEqual(['2A', '4D', '1B']);
  });

  it('searches by code ignoring case and accents', () => {
    expect(filterUnits(items, { ...DEFAULT_FILTERS, statuses: [], query: '3c' }).map((i) => i.unit.code)).toEqual(['3C']);
    expect(filterUnits(items, { ...DEFAULT_FILTERS, statuses: [], query: 'TIPOLOGÍA' })).toHaveLength(4);
  });
});

describe('formatPrice', () => {
  it('formats with Argentine thousands separators', () => {
    expect(formatPrice(157500, 'USD')).toBe('USD 157.500');
  });
  it('asks to consult when the price is not published', () => {
    expect(formatPrice(null, 'USD')).toBe('Consultar precio');
  });
});
