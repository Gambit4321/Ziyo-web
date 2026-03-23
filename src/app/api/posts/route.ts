import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

function generateSlug(title: string): string {
    return (title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const categoryId = formData.get('categoryId') as string;
        const type = formData.get('type') as string;
        const thumbnail = formData.get('thumbnail') as string;
        const videoUrl = formData.get('videoUrl') as string;

        const slug = generateSlug(title);

        // Get author (first user for now)
        const author = await prisma.user.findFirst();
        if (!author) {
            return NextResponse.json({ error: 'No author found' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content: content || null,
                type: type || 'standard',
                thumbnail: thumbnail || null,
                videoUrl: videoUrl || null,
                categoryId: categoryId || null,
                authorId: author.id,
                published: true,
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
