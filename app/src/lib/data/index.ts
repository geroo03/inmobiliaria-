import 'server-only';
import { cache } from 'react';
import type { ShowroomRepository } from './repository';
import { createLocalRepository } from './local';

let repository: ShowroomRepository | null = null;

/**
 * Devuelve el repositorio de datos. Hoy solo existe el local (datos de prueba); cuando se conecte
 * Supabase, acá se elige la implementación según las variables de entorno.
 */
export function getRepository(): ShowroomRepository {
  repository ??= createLocalRepository();
  return repository;
}

/** El proyecto se resuelve una vez por request aunque lo pidan el layout, la página y la metadata. */
export const getProject = cache(async (slug: string) => getRepository().getProjectBySlug(slug));
