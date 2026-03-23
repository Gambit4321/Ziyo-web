'use server';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type HomeSectionMutationInput = {
    title?: string | null;
    type: string;
    sourceType?: string;
    sourceId?: string | null;
    categorySlug?: string | null;
    displayStyle?: string;
    sortType?: string;
    autoplaySeconds?: number;
    rowCount?: number;
    order?: number;
    isVisible?: boolean;
};

type HomeSectionQueryInput = {
    type: string;
    sourceId?: string | null;
    categorySlug?: string | null;
    displayStyle?: string | null;
    sortType?: string | null;
    rowCount?: number | null;
};

type HomeSectionPreview = {
    sourceLabel: string;
    itemCount: number;
    itemLabel: string;
    sampleTitles: string[];
    note: string;
};

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

export async function createHomeSection(data: HomeSectionMutationInput) {
    const count = await prisma.homeSection.count();
    await prisma.homeSection.create({
        data: {
            ...data,
            order: typeof data.order === 'number' ? data.order : count,
            isVisible: typeof data.isVisible === 'boolean' ? data.isVisible : true
        }
    });
    revalidatePath('/admin/settings/home');
    revalidatePath('/');
}

export async function updateHomeSection(id: string, data: HomeSectionMutationInput) {
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

export async function getHomeSectionData(section: HomeSectionQueryInput) {
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

    if (section.type === 'FEATURED') {
        return await prisma.post.findMany({
            where: {
                published: true,
                featured: true,
                createdAt: { lte: now }
            },
            take: section.displayStyle === 'GRID' ? Math.max(section.rowCount || 1, 1) * 3 : 12,
            include: { category: true },
            orderBy: section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' },
        });
    }

    if (section.type === 'LATEST_AUDIO') {
        return await prisma.post.findMany({
            where: {
                published: true,
                type: 'audio',
                createdAt: { lte: now }
            },
            take: section.displayStyle === 'GRID' ? Math.max(section.rowCount || 1, 1) * 3 : 12,
            include: { category: true },
            orderBy: section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' },
        });
    }

    // Default Post Fetching (Carousel, Grid)
    const where: Prisma.PostWhereInput = {
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

    const orderBy: Prisma.PostOrderByWithRelationInput =
        section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' };

    const posts = await prisma.post.findMany({
        where,
        take: section.type === 'GRID' ? (section.rowCount * 4) : 12,
        include: { category: true },
        orderBy,
    });

    return posts;
}

export async function getHomeSectionPreview(section: HomeSectionQueryInput): Promise<HomeSectionPreview> {
    const now = new Date();
    const sortOrder: Prisma.PostOrderByWithRelationInput =
        section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' };

    if (section.type === 'HERO') {
        const banners = await prisma.banner.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                createdAt: { lte: now }
            },
            orderBy: { order: 'asc' },
            select: { title: true },
            take: 3
        });

        const itemCount = await prisma.banner.count({
            where: {
                isActive: true,
                deletedAt: null,
                createdAt: { lte: now }
            }
        });

        return {
            sourceLabel: 'Faol bannerlar',
            itemCount,
            itemLabel: 'banner',
            sampleTitles: banners.map((banner) => banner.title),
            note: 'Hero slider faol bannerlar bilan to‘ladi.'
        };
    }

    if (section.type === 'BANNER') {
        const banner = section.sourceId
            ? await prisma.banner.findFirst({
                where: {
                    id: section.sourceId,
                    deletedAt: null
                },
                select: { title: true, isActive: true }
            })
            : await prisma.banner.findFirst({
                where: { deletedAt: null, isActive: true },
                orderBy: { createdAt: 'desc' },
                select: { title: true, isActive: true }
            });

        return {
            sourceLabel: banner?.title || 'Banner tanlanmagan',
            itemCount: banner ? 1 : 0,
            itemLabel: 'banner',
            sampleTitles: banner ? [banner.title] : [],
            note: banner ? (banner.isActive ? 'Tanlangan banner public home da ko‘rinadi.' : 'Banner mavjud, lekin nofaol holatda.') : 'Banner tanlanmasa oxirgi faol banner ishlatiladi.'
        };
    }

    if (section.type === 'TABS') {
        const latestPosts = await prisma.post.findMany({
            where: { published: true, createdAt: { lte: now } },
            orderBy: { createdAt: 'desc' },
            select: { title: true },
            take: 3
        });
        const itemCount = await prisma.post.count({
            where: { published: true, createdAt: { lte: now } }
        });

        return {
            sourceLabel: 'So‘nggi materiallar',
            itemCount,
            itemLabel: 'post',
            sampleTitles: latestPosts.map((post) => post.title),
            note: 'Tabs blok barcha, maqola va video postlardan avtomatik yig‘iladi.'
        };
    }

    if (section.type === 'FEATURED') {
        const featuredPosts = await prisma.post.findMany({
            where: { published: true, featured: true, createdAt: { lte: now } },
            orderBy: sortOrder,
            select: { title: true },
            take: 3
        });
        const itemCount = await prisma.post.count({
            where: { published: true, featured: true, createdAt: { lte: now } }
        });

        return {
            sourceLabel: 'Featured postlar',
            itemCount,
            itemLabel: 'post',
            sampleTitles: featuredPosts.map((post) => post.title),
            note: 'Faqat `featured=true` postlar olinadi.'
        };
    }

    if (section.type === 'LATEST_AUDIO' || section.type === 'AUDIO') {
        const audioPosts = await prisma.post.findMany({
            where: { published: true, type: 'audio', createdAt: { lte: now } },
            orderBy: sortOrder,
            select: { title: true },
            take: 3
        });
        const itemCount = await prisma.post.count({
            where: { published: true, type: 'audio', createdAt: { lte: now } }
        });

        return {
            sourceLabel: 'Audio postlar',
            itemCount,
            itemLabel: 'audio',
            sampleTitles: audioPosts.map((post) => post.title),
            note: section.type === 'AUDIO' ? 'Audio player eng yangi audio materiallarni ishlatadi.' : 'So‘nggi audio bloki audio postlar asosida to‘ldiriladi.'
        };
    }

    if (section.sourceId === 'GLOBAL') {
        const latestPosts = await prisma.post.findMany({
            where: { published: true, createdAt: { lte: now } },
            orderBy: sortOrder,
            select: { title: true },
            take: 3
        });
        const itemCount = await prisma.post.count({
            where: { published: true, createdAt: { lte: now } }
        });

        return {
            sourceLabel: 'Barcha kategoriyalar',
            itemCount,
            itemLabel: 'post',
            sampleTitles: latestPosts.map((post) => post.title),
            note: 'Global source barcha publish qilingan postlarni ishlatadi.'
        };
    }

    if (section.sourceId) {
        const category = await prisma.category.findUnique({
            where: { id: section.sourceId },
            select: { id: true, name: true, parentId: true }
        });

        if (category?.parentId) {
            const posts = await prisma.post.findMany({
                where: {
                    published: true,
                    categoryId: category.id,
                    createdAt: { lte: now }
                },
                orderBy: sortOrder,
                select: { title: true },
                take: 3
            });
            const itemCount = await prisma.post.count({
                where: {
                    published: true,
                    categoryId: category.id,
                    createdAt: { lte: now }
                }
            });

            return {
                sourceLabel: category.name,
                itemCount,
                itemLabel: 'post',
                sampleTitles: posts.map((post) => post.title),
                note: 'Ichki kategoriya tanlangani uchun postlar shu kategoriyadan olinadi.'
            };
        }

        if (category) {
            const childCategories = await prisma.category.findMany({
                where: { parentId: category.id },
                orderBy: { order: 'asc' },
                select: { name: true },
                take: 3
            });
            const itemCount = await prisma.category.count({
                where: { parentId: category.id }
            });

            return {
                sourceLabel: category.name,
                itemCount,
                itemLabel: 'kategoriya',
                sampleTitles: childCategories.map((item) => item.name),
                note: 'Asosiy bo‘lim tanlangani uchun ichki kategoriyalar render qilinadi.'
            };
        }
    }

    if (section.categorySlug) {
        const category = await prisma.category.findUnique({
            where: { slug: section.categorySlug },
            select: { id: true, name: true }
        });

        if (category) {
            const posts = await prisma.post.findMany({
                where: {
                    published: true,
                    categoryId: category.id,
                    createdAt: { lte: now }
                },
                orderBy: sortOrder,
                select: { title: true },
                take: 3
            });
            const itemCount = await prisma.post.count({
                where: {
                    published: true,
                    categoryId: category.id,
                    createdAt: { lte: now }
                }
            });

            return {
                sourceLabel: category.name,
                itemCount,
                itemLabel: 'post',
                sampleTitles: posts.map((post) => post.title),
                note: 'Legacy slug manbasi ishlatilmoqda.'
            };
        }
    }

    return {
        sourceLabel: 'Manba tanlanmagan',
        itemCount: 0,
        itemLabel: 'element',
        sampleTitles: [],
        note: 'Preview ko‘rish uchun manba tanlang.'
    };
}

