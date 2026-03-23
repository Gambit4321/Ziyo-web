'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllCategories() {
    return await prisma.category.findMany({
        orderBy: { order: 'asc' }
    });
}

export async function createCategory(formData: FormData) {
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Get max order to append at the end
    const lastCategory = await prisma.category.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    const newOrder = (lastCategory?.order ?? 0) + 1;

    await prisma.category.create({
        data: {
            name,
            slug: `${slug}-${Date.now()}`,
            parentId: parentId || null,
            order: newOrder,
            showInMenu: true // Default to visible
        },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/', 'layout'); // Refresh public menu
}

export async function deleteCategory(id: string) {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin/categories');
    revalidatePath('/', 'layout');
}

export async function moveCategoryUp(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return;

    // Find the category just above this one (with smaller order)
    const previousCategory = await prisma.category.findFirst({
        where: {
            parentId: category.parentId,
            order: { lt: category.order }
        },
        orderBy: { order: 'desc' }
    });

    if (previousCategory) {
        // Swap orders
        await prisma.$transaction([
            prisma.category.update({
                where: { id: category.id },
                data: { order: previousCategory.order }
            }),
            prisma.category.update({
                where: { id: previousCategory.id },
                data: { order: category.order }
            })
        ]);
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    }
}

export async function moveCategoryDown(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return;

    // Find the category just below this one (with larger order)
    const nextCategory = await prisma.category.findFirst({
        where: {
            parentId: category.parentId,
            order: { gt: category.order }
        },
        orderBy: { order: 'asc' }
    });

    if (nextCategory) {
        // Swap orders
        await prisma.$transaction([
            prisma.category.update({
                where: { id: category.id },
                data: { order: nextCategory.order }
            }),
            prisma.category.update({
                where: { id: nextCategory.id },
                data: { order: category.order }
            })
        ]);
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    }
}

export async function updateCategoriesOrder(items: { id: string; order: number; parentId?: string | null }[]) {
    try {
        await prisma.$transaction(
            items.map((item) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: {
                        order: item.order,
                        ...(item.parentId !== undefined && { parentId: item.parentId })
                    },
                })
            )
        );
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Failed to update category order:', error);
    }
}

export async function renameCategory(id: string, newName: string) {
    try {
        await prisma.category.update({
            where: { id },
            data: { name: newName }
        });
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Failed to rename category:', error);
        throw new Error('Failed to rename category');
    }
}

export async function toggleCategoryVisibility(id: string, show: boolean) {
    try {
        await prisma.category.update({
            where: { id },
            data: { showInMenu: show }
        });
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Failed to toggle category visibility:', error);
        throw new Error('Failed to toggle category visibility');
    }
}

export async function updateCategoryImage(id: string, imageUrl: string) {
    try {
        await prisma.category.update({
            where: { id },
            data: { image: imageUrl }
        });
        revalidatePath('/admin/categories');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Failed to update category image:', error);
        throw new Error('Failed to update category image');
    }
}
