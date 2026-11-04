import type { UnitStatus } from '@/types/domain';

export interface StatusMeta {
  label: string;
  /** Color del pin y del relleno de la unidad en la planta. */
  color: string;
}

export const STATUS: Record<UnitStatus, StatusMeta> = {
  available: { label: 'Disponible', color: '#1F9D55' },
  reserved: { label: 'Reservada', color: '#D99A1E' },
  sold: { label: 'Vendida', color: '#D64545' },
  blocked: { label: 'No disponible', color: '#8A949A' },
  not_available: { label: 'No disponible', color: '#8A949A' },
};

/** Solo una unidad disponible se puede consultar para comprar. */
export const isOpenForSale = (s: UnitStatus) => s === 'available';
