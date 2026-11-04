// Íconos de trazo simple, en línea para no sumar dependencias.
type P = { className?: string };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
export const ChevronLeft = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="m15 18-6-6 6-6" /></svg>;
export const ChevronRight = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="m9 18 6-6-6-6" /></svg>;
export const Search = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const Sun = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Moon = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
export const Close = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>;
export const Building = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="M6 22V3h12v19M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 22v-3h4v3" /></svg>;
export const Chat = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...base}><path d="M21 12a8 8 0 0 1-11.8 7L4 20.5 5.5 15.6A8 8 0 1 1 21 12Z" /></svg>;
