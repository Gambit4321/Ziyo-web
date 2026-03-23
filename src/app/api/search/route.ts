import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = (searchParams.get('q') || '').trim();
    const now = new Date();

    if (!q || q.length < 2) {
        return NextResponse.json({ posts: [], categories: [] });
    }

    try {
        const [posts, categories] = await Promise.all([
            prisma.post.findMany({
                where: {
                    AND: [
                        { published: true },
                        { createdAt: { lte: now } },
                        {
                            OR: [
                                { title: { contains: q } },
                                { content: { contains: q } },
                                { excerpt: { contains: q } },
                            ],
                        },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    thumbnail: true,
                    createdAt: true,
                    category: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.category.findMany({
                where: {
                    OR: [
                        { name: { contains: q } },
                        { slug: { contains: q } },
                    ],
                },
                take: 5,
            }),
        ]);

        return NextResponse.json(
            { posts, categories, query: q },
            {
                headers: {
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed', posts: [], categories: [] },
            { status: 500 }
        );
    }
}
