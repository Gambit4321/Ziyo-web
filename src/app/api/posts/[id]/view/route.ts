import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Props) {
    try {
        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                published: true,
                createdAt: true,
            },
        });

        if (!post || !post.published || post.createdAt > new Date()) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: { views: { increment: 1 } },
            select: { views: true },
        });

        return NextResponse.json(updatedPost, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Post view increment error:', error);
        return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
    }
}
