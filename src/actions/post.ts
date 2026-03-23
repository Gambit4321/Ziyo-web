'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function normalizeSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(baseValue: string, excludeId?: string) {
    const baseSlug = normalizeSlug(baseValue || 'untitled') || 'untitled';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existingPost = await prisma.post.findFirst({
            where: {
                slug,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            select: { id: true },
        });

        if (!existingPost) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
}

export async function createPost(formData: FormData) {
    const title = formData.get('title') as string;
    const content = (formData.get('content') as string) || '';
    const excerpt = (formData.get('excerpt') as string) || '';
    const slugInput = (formData.get('slug') as string) || '';
    const videoUrl = formData.get('videoUrl') as string;
    // Fix: Respect selected type, fallback to video/standard logic only if missing
    let type = formData.get('type') as string;
    if (!type) {
        type = videoUrl ? 'video' : 'standard';
    }
    const thumbnail = formData.get('thumbnail') as string;
    // Use categoryId if selected, otherwise fallback to sectionId (Parent Category)
    const categoryId = (formData.get('categoryId') as string) || (formData.get('sectionId') as string);
    const featured = formData.get('featured') === 'on';
    const published = formData.get('published') === 'true';

    // Date handling: input returns YYYY-MM-DD. 
    // We append T00:00:00+05:00 so the server stores it as the *start of the day* relative to Uzbekistan time.
    // This ensures it is always <= now when the query runs for today's articles.
    const createdAtRaw = formData.get('createdAt') as string;
    const createdAt = createdAtRaw ? new Date(createdAtRaw + 'T00:00:00+05:00') : new Date();

    // Generate slug
    const slug = await ensureUniqueSlug(slugInput || title || 'untitled');

    // Get admin user (assuming first user is admin for now if session fails)
    const admin = await prisma.user.findFirst();

    await prisma.post.create({
        data: {
            title,
            slug,
            content,
            excerpt: excerpt || null,
            type,
            videoUrl: videoUrl || null,
            thumbnail: thumbnail || null,
            categoryId: categoryId || null,
            authorId: admin?.id || 'cmk1qbf3x0000569z04h79lgi',
            published,
            featured: featured,
            createdAt: createdAt, // Save custom date
        },
    });


    revalidatePath('/admin/posts');
    revalidatePath('/');
    redirect('/admin/posts');
}

export async function updatePost(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const content = (formData.get('content') as string) || '';
    const excerpt = (formData.get('excerpt') as string) || '';
    const slugInput = (formData.get('slug') as string) || '';
    const videoUrl = formData.get('videoUrl') as string;
    let type = formData.get('type') as string;
    if (!type || type === 'standard') {
        type = videoUrl ? 'video' : 'standard';
    }
    const thumbnail = formData.get('thumbnail') as string;
    const categoryId = (formData.get('categoryId') as string) || (formData.get('sectionId') as string);
    const published = formData.get('published') === 'true';

    const slug = await ensureUniqueSlug(slugInput || title || 'untitled', id);

    // Date handling
    const createdAtRaw = formData.get('createdAt') as string;
    // Only update createdAt if provided. Note: HTML datetime-local input returns empty string if cleared? 
    // Usually required or defaults to existing. If empty, maybe don't update?
    // Let's assume passed value is what we want.
    const dataToUpdate: {
        title: string;
        slug: string;
        content: string;
        excerpt: string | null;
        type: string;
        videoUrl: string | null;
        thumbnail: string | null;
        categoryId: string | null;
        published: boolean;
        createdAt?: Date;
    } = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        type,
        videoUrl: videoUrl || null,
        thumbnail: thumbnail || null,
        categoryId: categoryId || null,
        published,
    };

    if (createdAtRaw) {
        dataToUpdate.createdAt = new Date(createdAtRaw + 'T00:00:00+05:00');
    }

    await prisma.post.update({
        where: { id },
        data: dataToUpdate,
    });

    revalidatePath('/admin/posts');
    revalidatePath('/');
    redirect('/admin/posts');
}

export async function deletePost(id: string) {
    await prisma.post.delete({ where: { id } });
    revalidatePath('/admin/posts');
    revalidatePath('/');
}

export async function searchPosts(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.post.findMany({
        where: {
            title: {
                contains: query,
                // mode: 'insensitive' // Postgres only usually, but safe to try or omit if SQLite
            }
        },
        select: {
            id: true,
            title: true,
            slug: true
        },
        take: 10
    });
}
