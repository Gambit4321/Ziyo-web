'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBanner(formData: FormData) {
    try {
        const title = formData.get('title') as string;
        const image = formData.get('image') as string;
        const link = formData.get('link') as string;
        const description = formData.get('description') as string;
        const isActive = formData.get('isActive') === 'on';

        const topText = formData.get('topText') as string;
        const tagline = formData.get('tagline') as string;
        const buttonText = formData.get('buttonText') as string;

        // Date handling
        const createdAtRaw = formData.get('createdAt') as string;
        const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();

        await prisma.banner.create({
            data: {
                title,
                topText: topText || null,
                tagline: tagline || null,
                image,
                link: link || null,
                buttonText: buttonText || null,
                description: description || null,
                isActive,
                order: 0, // Default order
                createdAt,
            },
        });

        revalidatePath('/admin/banners');
        revalidatePath('/'); // Update home page carousel
    } catch (error) {
        console.error("Banner create error:", error);
        throw error;
    }
    redirect('/admin/banners');
}

export async function updateBanner(id: string, formData: FormData) {
    try {
        const title = formData.get('title') as string;
        const image = formData.get('image') as string;
        const link = formData.get('link') as string;
        const description = formData.get('description') as string;
        const isActive = formData.get('isActive') === 'on';

        const topText = formData.get('topText') as string;
        const tagline = formData.get('tagline') as string;
        const buttonText = formData.get('buttonText') as string;

        // Date handling
        const createdAtRaw = formData.get('createdAt') as string;
        const dataToUpdate: any = {
            title,
            topText: topText || null,
            tagline: tagline || null,
            image,
            link: link || null,
            buttonText: buttonText || null,
            description: description || null,
            isActive,
        };

        if (createdAtRaw) {
            dataToUpdate.createdAt = new Date(createdAtRaw);
        }

        await prisma.banner.update({
            where: { id },
            data: dataToUpdate,
        });

        revalidatePath('/admin/banners');
        revalidatePath('/');
    } catch (error) {
        console.error("Banner update error:", error);
        throw error;
    }
    redirect('/admin/banners');
}

// Soft delete
export async function deleteBanner(id: string) {
    const banner = await prisma.banner.findUnique({ where: { id } });

    if (banner?.isActive) {
        throw new Error("Faol benerni o'chirish mumkin emas. Avval uni nofaol holatga o'tkazing.");
    }

    await prisma.banner.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false }
    });
    revalidatePath('/admin/banners');
    revalidatePath('/');
}

export async function restoreBanner(id: string) {
    await prisma.banner.update({
        where: { id },
        data: { deletedAt: null, isActive: false } // Restored as inactive
    });
    revalidatePath('/admin/banners');
    revalidatePath('/');
}

export async function getDeletedBanners() {
    return await prisma.banner.findMany({
        where: { NOT: { deletedAt: null } },
        orderBy: { deletedAt: 'desc' }
    });
}

export async function permanentDeleteBanner(id: string) {
    await prisma.banner.delete({ where: { id } });
    revalidatePath('/admin/banners');
    revalidatePath('/');
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
    await prisma.banner.update({
        where: { id },
        data: { isActive },
    });
    revalidatePath('/admin/banners');
    revalidatePath('/');
}

export async function getAllBanners() {
    return await prisma.banner.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }
    });
}
