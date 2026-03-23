import { prisma } from '@/lib/prisma';
import BannerForm from '@/components/admin/BannerForm';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: Props) {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({
        where: { id },
    });
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true }
    });

    if (!banner) {
        notFound();
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--text-white)' }}>
                Bannerni Tahrirlash
            </h1>
            <BannerForm initialData={banner} categories={categories} />
        </div>
    );
}
