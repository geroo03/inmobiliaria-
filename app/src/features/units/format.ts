const number = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const area = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** «USD 157.500», o «Consultar precio» cuando no se publica. */
export function formatPrice(price: number | null, currency: string): string {
  return price === null ? 'Consultar precio' : `${currency} ${number.format(price)}`;
}

export const formatArea = (m2: number) => `${area.format(m2)} m²`;

export function formatRooms(rooms: number): string {
  return rooms === 1 ? 'Monoambiente' : `${rooms} ambientes`;
}
