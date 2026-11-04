/**
 * Proyecto de prueba «Torre Algarrobo»: datos ficticios generados con semilla fija, con las mismas
 * tipologías, precios y estados que el showroom estático del repositorio (showroom/showroom.html).
 * Las fotos de las vistas son imágenes ilustrativas generadas con IA; sus polígonos salen de
 * scripts/content/photos.params.json. La planta sale del modelo 3D (scripts/content, ver README).
 */
import type {
  Building,
  Floor,
  GallerySection,
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
import photos from './fotos.json';
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
  ogImageUrl: media('fotos/frente-dia.webp'),
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

/** Interiores propios de cada tipología (imágenes ilustrativas), más el baño compartido. */
const interiors = (l: 'a' | 'b' | 'c', bedroom: string) => [
  { url: media(`tipologias/${l}-living.webp`), caption: 'Living comedor y cocina' },
  { url: media(`tipologias/${l}-dormitorio.webp`), caption: bedroom },
  { url: media('tipologias/bano.webp'), caption: 'Baño' },
];

const SPECS: Record<Letter, TypologySpec> = {
  A: { rooms: 3, bedrooms: 2, bathrooms: 1, covered: 68, balcony: 9, orientation: 'Norte · frente', front: true, images: interiors('a', 'Dormitorio principal') },
  B: { rooms: 2, bedrooms: 1, bathrooms: 1, covered: 46, balcony: 6, orientation: 'Norte · frente', front: true, images: interiors('b', 'Dormitorio') },
  C: { rooms: 2, bedrooms: 1, bathrooms: 1, covered: 44, balcony: 5, orientation: 'Sur · contrafrente', front: false, images: interiors('c', 'Dormitorio') },
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

/** Contorno del edificio en el render de la planta (medido sobre la imagen; ver scripts/content/floors.mjs). */
const BUILDING_OUTLINE: Polygon = [
  [0.0565, 0.1429], [0.0893, 0.1429], [0.0893, 0.0813], [0.3869, 0.0813], [0.3869, 0.1429], [0.619, 0.1429],
  [0.619, 0.0933], [0.8571, 0.0933], [0.8571, 0.1429], [0.9435, 0.1429], [0.9435, 0.847], [0.628, 0.847],
  [0.628, 0.908], [0.4286, 0.908], [0.4286, 0.847], [0.2798, 0.847], [0.2798, 0.908], [0.119, 0.908],
  [0.119, 0.847], [0.0565, 0.847],
];

const FLOORS = 8; // planta baja + 8 pisos, como en las fotos
const floors: Floor[] = Array.from({ length: FLOORS }, (_, i) => ({
  id: `piso-${i + 1}`,
  buildingId: building.id,
  name: `${i + 1}°`,
  level: i + 1,
  image3dUrl: media('pisos/planta-3d.webp'),
  image2dUrl: media('pisos/planta-2d.svg'),
  outline: BUILDING_OUTLINE,
  groundImageUrl: media('pisos/suelo.webp'),
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
const HIDDEN_PRICE = new Set(['3A', '6B', '8A', '7C']);

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

type PhotoKey = keyof typeof photos;

function photoHotspots(sceneId: string, key: PhotoKey, variant: 'dia' | 'noche'): Hotspot[] {
  const ph = photos[key];
  return [
    {
      id: `${sceneId}-${variant}-torre`,
      label: building.name,
      polygon: toPolygon(ph.tower),
      labelAnchor: toPoint(ph.towerAnchor),
      target: { type: 'building', buildingId: building.id },
    },
    ...ph.floors.map((f): Hotspot => ({
      id: `${sceneId}-${variant}-piso-${f.level}`,
      label: `Piso ${f.level}`,
      polygon: toPolygon(f.polygon),
      labelAnchor: toPoint(f.anchor),
      target: { type: 'floor', buildingId: building.id, floorId: `piso-${f.level}` },
    })),
  ];
}

/**
 * Vistas con foto. Cada una tiene su foto de día y, si existe, la de noche con sus propios polígonos
 * (la IA no siempre respeta el encuadre). Para sumar una vista: medirla en photos.params.json,
 * regenerar fotos.json y agregarla acá.
 */
const SCENE_DEFS: { id: string; name: string; day: PhotoKey; night: PhotoKey | null }[] = [
  { id: 'frente', name: 'Frente', day: 'frente-dia', night: 'frente-noche' },
  { id: 'esquina', name: 'Esquina', day: 'esquina-dia', night: 'esquina-noche' },
  { id: 'lateral', name: 'Lateral', day: 'lateral-dia', night: 'lateral-noche' },
];

const scenes: Scene[] = SCENE_DEFS.map((d) => {
  const day = photos[d.day];
  return {
    id: d.id,
    name: d.name,
    imageDayUrl: media(`fotos/${day.file}`),
    imageNightUrl: d.night ? media(`fotos/${photos[d.night].file}`) : null,
    width: day.width,
    height: day.height,
    hotspots: photoHotspots(d.id, d.day, 'dia'),
    hotspotsNight: d.night ? photoHotspots(d.id, d.night, 'noche') : null,
  };
});

/**
 * Videos de giro de día (generados con IA). La vuelta es el mismo video invertido.
 * Los pares que no están acá se pasan con un fundido; de noche, siempre fundido.
 */
const DAY_VIDEOS = new Set(['frente>esquina']);
/** Cuadros extraídos de cada video (scripts/content/orbit-frames.sh), para girar arrastrando. */
const ORBIT_FRAMES: Record<string, number> = { 'frente>esquina': 71 };

function videosFor(from: string, to: string) {
  const forward = DAY_VIDEOS.has(`${from}>${to}`), backward = DAY_VIDEOS.has(`${to}>${from}`);
  const count = ORBIT_FRAMES[`${from}>${to}`];
  const frames = count ? { path: media(`orbita/${from}__${to}`), count } : null;
  if (!forward && !backward) return { videoDayUrl: null, videoDayMobileUrl: null, frames };
  const name = forward ? `${from}__${to}` : `${to}__${from}-reversa`;
  return {
    videoDayUrl: media(`transiciones/${name}-1080.mp4`),
    videoDayMobileUrl: media(`transiciones/${name}-720.mp4`),
    frames,
  };
}

/** Órbita entre las vistas: hacia la derecha la siguiente, hacia la izquierda la anterior. */
const transitions: SceneTransition[] =
  scenes.length < 2
    ? []
    : scenes.slice(0, scenes.length === 2 ? 1 : scenes.length).flatMap((from, i) => {
        // Con dos vistas alcanza un par (ida y vuelta); con más, se cierra el anillo.
        const to = scenes[(i + 1) % scenes.length];
        const night = { videoNightUrl: null, videoNightMobileUrl: null };
        return [
          { fromSceneId: from.id, toSceneId: to.id, direction: 'right' as const, ...videosFor(from.id, to.id), ...night },
          { fromSceneId: to.id, toSceneId: from.id, direction: 'left' as const, ...videosFor(to.id, from.id), ...night },
        ];
      });

const galleries: GallerySection[] = [
  {
    slug: 'amenities',
    title: 'Amenities',
    items: [
      { url: media('amenities/hall.webp'), caption: 'Hall de entrada' },
      { url: media('amenities/terraza.webp'), caption: 'Terraza con parrilla' },
    ],
  },
];

export const torreAlgarrobo = { project, building, floors, typologies, units, scenes, transitions, galleries };
export type SeedProject = typeof torreAlgarrobo;
