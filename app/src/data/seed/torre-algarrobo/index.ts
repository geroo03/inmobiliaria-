/**
 * Proyecto de prueba «Torre Algarrobo»: datos ficticios generados con semilla fija, con las mismas
 * tipologías, precios y estados que el showroom estático del repositorio (showroom/showroom.html).
 * Las imágenes, videos y máscaras salen de app/scripts/content (ver README).
 */
import type {
  Building,
  Floor,
  Hotspot,
  Point,
  Polygon,
  Project,
  PublicUnit,
  Scene,
  SceneTransition,
  Typology,
  UnitStatus,
} from '@/types/domain';
import scenesMeta from './scenes.json';
import floorMeta from './floor.json';

const SLUG = 'torre-algarrobo';
const media = (file: string) => `${SLUG}/${file}`;

export const project: Project = {
  id: 'prj-torre-algarrobo',
  slug: SLUG,
  name: 'Torre Algarrobo',
  tagline: 'Departamentos de 1 a 3 ambientes en Córdoba',
  developerName: 'Desarrolladora de demostración',
  address: 'Córdoba, Argentina (ubicación ficticia)',
  primaryColor: '#164056',
  whatsappNumber: null,
  seoDescription: 'Recorré Torre Algarrobo: elegí piso y departamento, mirá disponibilidad y precios y consultá por WhatsApp.',
  ogImageUrl: media('scenes/frente-dia.webp'),
  entrySceneId: 'frente',
  disclaimer: 'Proyecto ficticio de demostración. Imágenes, superficies y precios ilustrativos.',
};

const building: Building = { id: 'torre', name: 'Torre Algarrobo', status: 'selling' };

const LETTERS = ['A', 'B', 'C', 'D'] as const;
type Letter = (typeof LETTERS)[number];

interface TypologySpec {
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  covered: number;
  balcony: number;
  orientation: string;
  front: boolean;
  images: { url: string; caption: string }[];
}

const apartmentImages = [
  { url: media('tipologias/living.webp'), caption: 'Living' },
  { url: media('tipologias/dormitorio.webp'), caption: 'Dormitorio' },
  { url: media('tipologias/bano.webp'), caption: 'Baño' },
];

const SPECS: Record<Letter, TypologySpec> = {
  A: { rooms: 3, bedrooms: 2, bathrooms: 1, covered: 68, balcony: 9, orientation: 'Norte · frente', front: true, images: apartmentImages },
  B: { rooms: 2, bedrooms: 1, bathrooms: 1, covered: 46, balcony: 6, orientation: 'Norte · frente', front: true, images: apartmentImages },
  C: { rooms: 2, bedrooms: 1, bathrooms: 1, covered: 44, balcony: 5, orientation: 'Sur · contrafrente', front: false, images: apartmentImages },
  D: {
    rooms: 1, bedrooms: 0, bathrooms: 1, covered: 33, balcony: 4, orientation: 'Sur · contrafrente', front: false,
    images: [
      { url: media('tipologias/monoambiente.webp'), caption: 'Ambiente único' },
      { url: media('tipologias/kitchenette.webp'), caption: 'Kitchenette' },
      { url: media('tipologias/bano.webp'), caption: 'Baño' },
    ],
  },
};

const typologies: Typology[] = LETTERS.map((l) => {
  const s = SPECS[l];
  return {
    id: `tip-${l.toLowerCase()}`,
    name: `Tipología ${l}`,
    coveredArea: s.covered,
    uncoveredArea: s.balcony,
    totalArea: s.covered + s.balcony,
    rooms: s.rooms,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    images: s.images,
  };
});

const FLOORS = 9;
const floors: Floor[] = Array.from({ length: FLOORS }, (_, i) => ({
  id: `piso-${i + 1}`,
  buildingId: building.id,
  name: `${i + 1}°`,
  level: i + 1,
  image3dUrl: media('pisos/planta-3d.webp'),
  image2dUrl: media('pisos/planta-2d.svg'),
  width: floorMeta.width,
  height: floorMeta.height,
}));

/** Generador pseudoaleatorio con semilla (mulberry32): los datos se ven siempre igual. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toPoint = (p: number[]): Point => [p[0], p[1]];
const toPolygon = (ps: number[][]): Polygon => ps.map(toPoint);

/** Sin precio publicado: la desarrolladora prefiere que consulten (se muestra «Consultar precio»). */
const HIDDEN_PRICE = new Set(['3A', '6B', '8A', '9C']);

/** Fila completa de la unidad (como en la tabla units), con el precio de lista aunque no se publique. */
interface UnitRow {
  unit: PublicUnit;
  listPrice: number;
  showPrice: boolean;
}

function buildUnits(): UnitRow[] {
  const rnd = mulberry32(20261104); // la misma semilla y secuencia que el showroom estático
  const out: UnitRow[] = [];
  for (let p = 1; p <= FLOORS; p++) {
    for (const l of LETTERS) {
      const s = SPECS[l];
      const surface = s.covered + s.balcony * 0.5;
      const pricePerM2 = 1950 * (1 + 0.012 * (p - 1)) * (s.front ? 1.04 : 1);
      const r = rnd();
      const pSold = 0.52 - p * 0.04;
      let status: UnitStatus = r < pSold ? 'sold' : r < pSold + 0.14 ? 'reserved' : 'available';
      if (p === 1 && l === 'D') status = 'blocked'; // reservada para la unidad modelo
      const mask = floorMeta.units.find((u) => u.letter === l);
      if (!mask) throw new Error(`Falta la máscara de la unidad ${l} en floor.json`);
      const code = `${p}${l}`;
      const listPrice = Math.round((surface * pricePerM2) / 500) * 500;
      const showPrice = !HIDDEN_PRICE.has(code);
      out.push({
        listPrice,
        showPrice,
        unit: {
          id: `u-${code.toLowerCase()}`,
          floorId: `piso-${p}`,
          typologyId: `tip-${l.toLowerCase()}`,
          code,
          status,
          price: showPrice ? listPrice : null,
          currency: 'USD',
          orientation: s.orientation,
          polygon: toPolygon(mask.polygon),
          labelAnchor: toPoint(mask.anchor),
        },
      });
    }
  }
  return out;
}

const unitRows = buildUnits();
/** Lo que se expone al público: sin precio de lista cuando no se publica. */
const units: PublicUnit[] = unitRows.map((r) => r.unit);

const SCENE_ORDER = scenesMeta.scenes.map((s) => s.id);

const scenes: Scene[] = scenesMeta.scenes.map((s) => {
  const floorHotspots: Hotspot[] = s.floors.map((f) => ({
    id: `${s.id}-piso-${f.level}`,
    label: `Piso ${f.level}`,
    polygon: toPolygon(f.polygon),
    labelAnchor: toPoint(f.anchor),
    target: { type: 'floor', buildingId: building.id, floorId: `piso-${f.level}` },
  }));
  return {
    id: s.id,
    name: s.name,
    imageDayUrl: media(`scenes/${s.id}-dia.webp`),
    imageNightUrl: media(`scenes/${s.id}-noche.webp`),
    width: scenesMeta.width,
    height: scenesMeta.height,
    hotspots: [
      {
        id: `${s.id}-torre`,
        label: building.name,
        polygon: toPolygon(s.tower),
        labelAnchor: toPoint(s.towerAnchor),
        target: { type: 'building', buildingId: building.id },
      },
      ...floorHotspots,
    ],
  };
});

/** Órbita: hacia la derecha se pasa a la escena siguiente; hacia la izquierda, a la anterior (video invertido). */
const transitions: SceneTransition[] = SCENE_ORDER.flatMap((from, i) => {
  const to = SCENE_ORDER[(i + 1) % SCENE_ORDER.length];
  const file = (moment: 'dia' | 'noche', reverse: boolean, size: '1080' | '720') =>
    media(`transiciones/${reverse ? `${to}__${from}` : `${from}__${to}`}-${moment}-${size}.mp4`);
  const make = (a: string, b: string, reverse: boolean, direction: 'left' | 'right'): SceneTransition => ({
    fromSceneId: a,
    toSceneId: b,
    direction,
    videoDayUrl: file('dia', reverse, '1080'),
    videoDayMobileUrl: file('dia', reverse, '720'),
    videoNightUrl: file('noche', reverse, '1080'),
    videoNightMobileUrl: file('noche', reverse, '720'),
  });
  return [make(from, to, false, 'right'), make(to, from, true, 'left')];
});

export const torreAlgarrobo = { project, building, floors, typologies, units, scenes, transitions };
export type SeedProject = typeof torreAlgarrobo;
