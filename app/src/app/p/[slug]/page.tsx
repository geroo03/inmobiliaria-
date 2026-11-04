import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject, getRepository } from '@/lib/data';
import { mediaUrl } from '@/lib/media';
import { projectBase } from '@/lib/site';

export default async function Landing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const scenes = await getRepository().getScenes(project.id);
  const entry = scenes.find((s) => s.id === project.entrySceneId) ?? scenes[0];
  const base = await projectBase(slug);
  return (
    <main className="relative h-dvh w-full overflow-hidden text-white">
      {entry && (
        <Image src={mediaUrl(entry.imageDayUrl)} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
      <div className="relative flex h-full flex-col justify-end gap-6 p-6 pb-12 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-white/80">{project.developerName}</p>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">{project.name}</h1>
        <p className="max-w-xl text-lg text-white/85">{project.tagline}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`${base}/explore/${entry?.id ?? ''}`} className="pill pill-brand px-7 py-3 text-base">Ingresar</Link>
          <Link href={`${base}/units`} className="pill px-6 py-3 text-base">Buscar unidades</Link>
        </div>
        <p className="text-xs text-white/70">{project.disclaimer}</p>
      </div>
    </main>
  );
}
