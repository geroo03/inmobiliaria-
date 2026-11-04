import type {
  BuildingDetail,
  FloorAvailability,
  GallerySection,
  NewLead,
  Project,
  PublicUnit,
  Scene,
  SceneTransition,
  UnitListItem,
} from '@/types/domain';

/**
 * Acceso a los datos de un proyecto. Toda consulta parte del proyecto resuelto en el servidor
 * por su slug: nunca se confía en un id de proyecto enviado por el cliente.
 */
export interface ShowroomRepository {
  getProjectBySlug(slug: string): Promise<Project | null>;
  getScenes(projectId: string): Promise<Scene[]>;
  getTransitions(projectId: string): Promise<SceneTransition[]>;
  /** Edificio con sus pisos, unidades y tipologías; null si no pertenece al proyecto. */
  getBuildingDetail(projectId: string, buildingId: string): Promise<BuildingDetail | null>;
  getDefaultBuildingId(projectId: string): Promise<string | null>;
  getGallerySections(projectId: string): Promise<GallerySection[]>;
  getFloorAvailability(projectId: string, buildingId: string): Promise<FloorAvailability[]>;
  listUnits(projectId: string): Promise<UnitListItem[]>;
  /** La unidad si existe y pertenece al proyecto; si no, null. */
  getPublicUnit(projectId: string, unitId: string): Promise<PublicUnit | null>;
  createLead(lead: NewLead): Promise<{ id: string }>;
}
