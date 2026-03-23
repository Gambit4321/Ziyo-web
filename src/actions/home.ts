'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getHomeSections() {
    return await prisma.homeSection.findMany({
        orderBy: { order: 'asc' }
    });
}

export async function toggleSectionVisibility(id: string, isVisible: boolean) {
    await prisma.homeSection.update({
        where: { id },
        data: { isVisible }
    });
    revalidatePath('/');
    revalidatePath('/admin/settings/home');
}

export async function updateSectionsOrder(items: { id: string; order: number }[]) {
    try {
        await prisma.$transaction(
            items.map((item) =>
                prisma.homeSection.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );
        revalidatePath('/');
        revalidatePath('/admin/settings/home');
    } catch (error) {
        console.error('Failed to update section order:', error);
    }
}

export async function seedHomeSections() {
    const count = await prisma.homeSection.count();
    if (count > 0) return;

    const sections = [
        { type: 'HERO', title: 'Asosiy Slayder', order: 0 },
        { type: 'CAROUSEL', title: 'LAVHA VA REPORTAJLAR', categorySlug: 'lavha', order: 1 },
        { type: 'TABS', title: 'Eng Yangi', order: 2 },
        { type: 'GRID', title: 'ZIYO CINEMA', categorySlug: 'cinema', order: 3 },
        { type: 'AUDIO', title: 'Audio Player', order: 4 },
    ];

    await prisma.$transaction(
        sections.map(section => prisma.homeSection.create({ data: section }))
    );
    revalidatePath('/admin/settings/home');
}

export async function createHomeSection(data: any) {
    const count = await prisma.homeSection.count();
    await prisma.homeSection.create({
        data: {
            ...data,
            order: count,
            isVisible: true
        }
    });
    revalidatePath('/admin/settings/home');
    revalidatePath('/');
}

export async function updateHomeSection(id: string, data: any) {
    await prisma.homeSection.update({
        where: { id },
        data
    });
    revalidatePath('/admin/settings/home');
    revalidatePath('/');
}

export async function deleteHomeSection(id: string) {
    await prisma.homeSection.delete({ where: { id } });
    revalidatePath('/admin/settings/home');
    revalidatePath('/');
}

export async function getHomeSectionData(section: any) {
    const now = new Date();

    if (section.type === 'HERO') {
        return await prisma.banner.findMany({
            where: {
                isActive: true,
                createdAt: { lte: now }
            },
            orderBy: { order: 'asc' },
            take: 5,
        });
    }

    if (section.type === 'BANNER') {
        // Fetch a single banner for this section if sourceId is provided
        if (section.sourceId) {
            return await prisma.banner.findFirst({
                where: {
                    id: section.sourceId,
                    isActive: true,
                    createdAt: { lte: now }
                }
            });
        }
        // Fallback to latest banner
        return await prisma.banner.findFirst({
            where: {
                isActive: true,
                createdAt: { lte: now }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    if (section.type === 'AUDIO') {
        // Fetch latest 10 audio posts
        return await prisma.post.findMany({
            where: {
                published: true,
                type: 'audio', // Filter by audio type
                createdAt: { lte: now }
            },
            take: 10,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    if (section.type === 'TABS') {
        const [all, articles, videos] = await Promise.all([
            prisma.post.findMany({
                take: 6,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                where: { published: true, createdAt: { lte: now } }
            }),
            prisma.post.findMany({
                where: { type: 'standard', published: true, createdAt: { lte: now } },
                take: 6,
                include: { category: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.post.findMany({
                where: { type: 'video', published: true, createdAt: { lte: now } },
                take: 6,
                include: { category: true },
                orderBy: { createdAt: 'desc' }
            }),
        ]);
        return { all, articles, videos };
    }

    // Default Post Fetching (Carousel, Grid)
    let where: any = {
        published: true,
        createdAt: { lte: now }
    };

    // If sourceId is 'GLOBAL', we don't apply any category filter
    if (section.sourceId === 'GLOBAL') {
        // No category filter needed
    } else if (section.sourceId) {
        where.category = { id: section.sourceId };
    } else if (section.categorySlug) {
        where.category = { slug: section.categorySlug };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (section.sortType === 'MOST_VIEWED') {
        orderBy = { views: 'desc' };
    }

    const posts = await prisma.post.findMany({
        where,
        take: section.type === 'GRID' ? (section.rowCount * 4) : 12,
        include: { category: true },
        orderBy,
    });

    return posts;
}

