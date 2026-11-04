import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/data';
import { mediaUrl } from '@/lib/media';
import { absoluteUrl, projectUrl, safeColor } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  const title = `${project.name} · Showroom virtual`;
  const image = absoluteUrl(mediaUrl(project.ogImageUrl));
  return {
    title,
    description: project.seoDescription,
    alternates: { canonical: projectUrl(slug) },
    openGraph: { title, description: project.seoDescription, url: projectUrl(slug), siteName: project.name, locale: 'es_AR', type: 'website', images: [{ url: image, width: 1920, height: 1080 }] },
    twitter: { card: 'summary_large_image', title, description: project.seoDescription, images: [image] },
  };
}

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return <div style={{ '--brand': safeColor(project.primaryColor) } as React.CSSProperties}>{children}</div>;
}
