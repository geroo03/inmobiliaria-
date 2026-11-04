import { notFound } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { projectBase } from '@/lib/site';
import { FloorExplorer } from '@/features/floor-plan/FloorExplorer';

type Props = {
  params: Promise<{ slug: string; buildingId: string; floorId: string }>;
  searchParams: Promise<{ unit?: string; vista?: string }>;
};

export default async function FloorPage({ params, searchParams }: Props) {
  const [{ slug, buildingId, floorId }, sp] = await Promise.all([params, searchParams]);
  const project = await getProject(slug);
  if (!project) notFound();
  const repo = getRepository();
  const [detail, availability, base] = await Promise.all([
    repo.getBuildingDetail(project.id, buildingId),
    repo.getFloorAvailability(project.id, buildingId),
    projectBase(slug),
  ]);
  const floor = detail?.floors.find((f) => f.id === floorId);
  if (!detail || !floor) notFound();
  return (
    <FloorExplorer
      base={base}
      projectSlug={project.slug}
      entrySceneId={project.entrySceneId}
      building={detail.building}
      floors={detail.floors}
      availability={availability}
      floor={floor}
      units={detail.units.filter((u) => u.floorId === floor.id)}
      typologies={detail.typologies}
      initialUnitId={typeof sp.unit === 'string' ? sp.unit : null}
      initialView={sp.vista === '2d' ? '2d' : '3d'}
    />
  );
}
