/**
 * Tipos de dominio del showroom. Son independientes de la base de datos: la capa de datos
 * (local o Supabase) traduce sus filas a estos tipos.
 */

/** Punto en coordenadas normalizadas (0–1) respecto de la imagen, desde la esquina superior izquierda. */
export type Point = readonly [x: number, y: number];
export type Polygon = readonly Point[];

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'blocked' | 'not_available';

export interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  developerName: string;
  address: string;
  primaryColor: string;
  /** Número de WhatsApp en formato E.164 sin el signo +, por ejemplo 5493510000000. */
  whatsappNumber: string | null;
  seoDescription: string;
  ogImageUrl: string;
  entrySceneId: string;
  disclaimer: string;
}

export type HotspotTarget =
  | { type: 'scene'; sceneId: string }
  | { type: 'building'; buildingId: string }
  | { type: 'floor'; buildingId: string; floorId: string }
  | { type: 'url'; url: string };

export interface Hotspot {
  id: string;
  label: string;
  polygon: Polygon;
  labelAnchor: Point;
  target: HotspotTarget;
}

export interface Scene {
  id: string;
  name: string;
  imageDayUrl: string;
  /** Mismo encuadre que la imagen de día, para que los hotspots sirvan para las dos. */
  imageNightUrl: string | null;
  width: number;
  height: number;
  hotspots: Hotspot[];
  /** Polígonos propios de la imagen de noche cuando no tiene el mismo encuadre que la de día. */
  hotspotsNight: Hotspot[] | null;
}

export type TransitionDirection = 'left' | 'right';

export interface SceneTransition {
  fromSceneId: string;
  toSceneId: string;
  direction: TransitionDirection;
  /** Sin video, el visor pasa de una escena a otra con un fundido. */
  videoDayUrl: string | null;
  videoDayMobileUrl: string | null;
  videoNightUrl: string | null;
  videoNightMobileUrl: string | null;
  /**
   * Cuadros del video de día para girar arrastrando: `${path}/{1280|720}/{000..count-1}.webp`.
   * Sirven también para el sentido contrario (se recorren al revés).
   */
  frames: { path: string; count: number } | null;
}

export type BuildingStatus = 'selling' | 'sold_out' | 'coming_soon' | 'not_for_sale';

export interface Building {
  id: string;
  name: string;
  status: BuildingStatus;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  level: number;
  /** Render cenital del piso. */
  image3dUrl: string;
  /** Plano técnico con el mismo encuadre que el render. */
  image2dUrl: string | null;
  /**
   * Contorno del edificio (con balcones) sobre el render, en 0–1. Separa el edificio del suelo
   * para mostrar el suelo más lejos cuanto más alto es el piso.
   */
  outline: Polygon | null;
  /** Foto aérea del suelo de alrededor, vista desde arriba; se aleja cuanto más alto es el piso. */
  groundImageUrl: string | null;
  width: number;
  height: number;
}

export interface Typology {
  id: string;
  name: string;
  totalArea: number;
  coveredArea: number;
  uncoveredArea: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  images: { url: string; caption: string }[];
}

/**
 * Unidad tal como se expone al público: el precio ya viene en null cuando la desarrolladora
 * no quiere mostrarlo (equivale a la vista public_units de la base de datos).
 */
export interface PublicUnit {
  id: string;
  floorId: string;
  typologyId: string;
  code: string;
  status: UnitStatus;
  price: number | null;
  currency: string;
  orientation: string;
  polygon: Polygon;
  labelAnchor: Point;
}

export interface BuildingDetail {
  building: Building;
  floors: Floor[];
  units: PublicUnit[];
  typologies: Typology[];
}

/** Fila del buscador: la unidad con lo que hace falta para mostrarla y filtrarla. */
export interface UnitListItem {
  unit: PublicUnit;
  typology: Typology;
  floor: Pick<Floor, 'id' | 'level' | 'name'>;
  building: Pick<Building, 'id' | 'name'>;
}

export interface FloorAvailability {
  floorId: string;
  level: number;
  available: number;
  total: number;
}

/** Sección de galería del proyecto: amenities, unidad modelo u otras. */
export interface GallerySection {
  slug: string;
  title: string;
  items: { url: string; caption: string }[];
}

export interface NewLead {
  projectId: string;
  unitId: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: 'web' | 'kiosk';
}
