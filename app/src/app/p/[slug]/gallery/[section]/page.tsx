import { notFound } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { projectBase } from '@/lib/site';
import { Gallery } from '@/features/gallery/Gallery';

export default async function GalleryPage({ params }: { params: Promise<{ slug: string; section: string }> }) {
  const { slug, section } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const [sections, base] = await Promise.all([getRepository().getGallerySections(project.id), projectBase(slug)]);
  const found = sections.find((s) => s.slug === section);
  if (!found || found.items.length === 0) notFound();
  return <Gallery section={found} backHref={`${base}/explore/${project.entrySceneId}`} />;
}
