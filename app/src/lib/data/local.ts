import 'server-only';
import { randomUUID } from 'node:crypto';
import type { ShowroomRepository } from './repository';
import type { NewLead } from '@/types/domain';
import { torreAlgarrobo, type SeedProject } from '@/data/seed/torre-algarrobo';

/**
 * Repositorio con los datos de prueba en memoria. Sirve para desarrollar y mostrar la demo sin
 * base de datos. Los leads quedan en memoria del proceso y se pierden al reiniciar: en producción
 * van a la tabla leads de Supabase.
 */
export function createLocalRepository(projects: SeedProject[] = [torreAlgarrobo]): ShowroomRepository {
  const bySlug = new Map(projects.map((p) => [p.project.slug, p]));
  const byId = new Map(projects.map((p) => [p.project.id, p]));
  const leads: (NewLead & { id: string; createdAt: string })[] = [];

  const get = (projectId: string) => byId.get(projectId) ?? null;

  return {
    async getProjectBySlug(slug) {
      return bySlug.get(slug)?.project ?? null;
    },
    async getScenes(projectId) {
      return get(projectId)?.scenes ?? [];
    },
    async getTransitions(projectId) {
      return get(projectId)?.transitions ?? [];
    },
    async getGallerySections(projectId) {
      return get(projectId)?.galleries ?? [];
    },
    async getDefaultBuildingId(projectId) {
      return get(projectId)?.building.id ?? null;
    },
    async getBuildingDetail(projectId, buildingId) {
      const p = get(projectId);
      if (!p || p.building.id !== buildingId) return null;
      const floorIds = new Set(p.floors.map((f) => f.id));
      return {
        building: p.building,
        floors: p.floors,
        units: p.units.filter((u) => floorIds.has(u.floorId)),
        typologies: p.typologies,
      };
    },
    async getFloorAvailability(projectId, buildingId) {
      const p = get(projectId);
      if (!p || p.building.id !== buildingId) return [];
      return p.floors.map((f) => {
        const us = p.units.filter((u) => u.floorId === f.id);
        return { floorId: f.id, level: f.level, total: us.length, available: us.filter((u) => u.status === 'available').length };
      });
    },
    async listUnits(projectId) {
      const p = get(projectId);
      if (!p) return [];
      const floors = new Map(p.floors.map((f) => [f.id, f]));
      const typologies = new Map(p.typologies.map((t) => [t.id, t]));
      return p.units.flatMap((unit) => {
        const floor = floors.get(unit.floorId);
        const typology = typologies.get(unit.typologyId);
        if (!floor || !typology) return [];
        return [{
          unit,
          typology,
          floor: { id: floor.id, level: floor.level, name: floor.name },
          building: { id: p.building.id, name: p.building.name },
        }];
      });
    },
    async getPublicUnit(projectId, unitId) {
      return get(projectId)?.units.find((u) => u.id === unitId) ?? null;
    },
    async createLead(lead) {
      const id = randomUUID();
      leads.push({ ...lead, id, createdAt: new Date().toISOString() });
      return { id };
    },
  };
}
