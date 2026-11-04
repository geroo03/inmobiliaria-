import { notFound, redirect } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { projectBase } from '@/lib/site';

// Entrar al edificio lleva al piso con más unidades disponibles (a igualdad, el más alto).
export default async function BuildingPage({ params }: { params: Promise<{ slug: string; buildingId: string }> }) {
  const { slug, buildingId } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const availability = await getRepository().getFloorAvailability(project.id, buildingId);
  if (!availability.length) notFound();
  const best = [...availability].sort((a, b) => b.available - a.available || b.level - a.level)[0];
  redirect(`${await projectBase(slug)}/buildings/${buildingId}/floors/${best.floorId}`);
}
