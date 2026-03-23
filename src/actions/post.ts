'use server';

import { prisma } from '@/lib/prisma';
import { normalizeRichTextContent } from '@/lib/richText';
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

type PostMutationInput = {
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    type: string;
    videoUrl: string | null;
    videoDuration: string | null;
    thumbnail: string | null;
    categoryId: string | null;
    published: boolean;
    featured: boolean;
    createdAt: Date;
};

async function resolveDefaultArticleCategoryId() {
    const articleCategory = await prisma.category.findFirst({
        where: {
            OR: [
                { slug: 'maqolalar' },
                { name: 'Maqolalar' },
            ],
        },
        select: { id: true },
    });

    return articleCategory?.id || null;
}

function normalizeOptionalValue(value: FormDataEntryValue | null) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || null;
}

function resolvePostType(formData: FormData) {
    const rawType = typeof formData.get('type') === 'string' ? (formData.get('type') as string) : '';
    if (rawType === 'audio' || rawType === 'video') {
        return rawType;
    }

    return 'standard';
}

function resolveCreatedAt(formData: FormData) {
    const rawValue = normalizeOptionalValue(formData.get('createdAt'));
    return rawValue ? new Date(`${rawValue}T00:00:00+05:00`) : new Date();
}

async function parsePostMutationInput(formData: FormData, excludeId?: string): Promise<PostMutationInput> {
    const title = (normalizeOptionalValue(formData.get('title')) || '').trim();
    const type = resolvePostType(formData);
    const slugInput = normalizeOptionalValue(formData.get('slug'));
    const content = normalizeRichTextContent(typeof formData.get('content') === 'string' ? (formData.get('content') as string) : '');
    const videoUrl = normalizeOptionalValue(formData.get('videoUrl'));
    const categoryIdInput = normalizeOptionalValue(formData.get('categoryId')) || normalizeOptionalValue(formData.get('sectionId'));
    const createdAt = resolveCreatedAt(formData);

    const slug = await ensureUniqueSlug(slugInput || title || 'untitled', excludeId);
    const categoryId = type === 'standard' ? categoryIdInput || await resolveDefaultArticleCategoryId() : categoryIdInput;

    return {
        title,
        slug,
        content,
        excerpt: normalizeOptionalValue(formData.get('excerpt')),
        type,
        videoUrl: type === 'standard' ? null : videoUrl,
        videoDuration: type === 'standard' ? null : normalizeOptionalValue(formData.get('videoDuration')),
        thumbnail: type === 'audio' ? null : normalizeOptionalValue(formData.get('thumbnail')),
        categoryId,
        published: formData.get('published') === 'true',
        featured: formData.get('featured') === 'on',
        createdAt,
    };
}

async function getAuthorId() {
    const admin = await prisma.user.findFirst({
        select: { id: true },
    });

    return admin?.id || 'cmk1qbf3x0000569z04h79lgi';
}

export async function createPost(formData: FormData) {
    const postInput = await parsePostMutationInput(formData);

    await prisma.post.create({
        data: {
            ...postInput,
            authorId: await getAuthorId(),
        },
    });


    revalidatePath('/admin/posts');
    revalidatePath('/');
    redirect('/admin/posts');
}

export async function updatePost(id: string, formData: FormData) {
    const dataToUpdate = await parsePostMutationInput(formData, id);

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
