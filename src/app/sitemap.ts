import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: {
        published: true,
        createdAt: { lte: now },
      },
      select: {
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/category/audio`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...categories.map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/post/${post.slug}`,
      lastModified: post.updatedAt || post.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
