import { notFound } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { projectBase } from '@/lib/site';
import { SceneViewer } from '@/features/scene-viewer/SceneViewer';

type Props = { params: Promise<{ slug: string; sceneId: string }>; searchParams: Promise<{ noche?: string }> };

export default async function ExplorePage({ params, searchParams }: Props) {
  const [{ slug, sceneId }, { noche }] = await Promise.all([params, searchParams]);
  const project = await getProject(slug);
  if (!project) notFound();
  const repo = getRepository();
  const [scenes, transitions, buildingId, base] = await Promise.all([
    repo.getScenes(project.id),
    repo.getTransitions(project.id),
    repo.getDefaultBuildingId(project.id),
    projectBase(slug),
  ]);
  if (!scenes.some((s) => s.id === sceneId)) notFound();
  const availability = buildingId ? await repo.getFloorAvailability(project.id, buildingId) : [];
  return (
    <SceneViewer
      base={base}
      projectName={project.name}
      scenes={scenes}
      transitions={transitions}
      initialSceneId={sceneId}
      initialNight={noche === '1'}
      availability={availability}
    />
  );
}
