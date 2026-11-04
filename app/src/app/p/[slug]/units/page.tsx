import { notFound } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { projectBase } from '@/lib/site';
import { UnitSearch } from '@/features/units/UnitSearch';

export default async function UnitsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const [items, base] = await Promise.all([getRepository().listUnits(project.id), projectBase(slug)]);
  return <UnitSearch base={base} projectName={project.name} entrySceneId={project.entrySceneId} items={items} />;
}
