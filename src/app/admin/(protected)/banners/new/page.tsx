import { prisma } from '@/lib/prisma';
import BannerForm from '@/components/admin/BannerForm';
import styles from '@/components/admin/PostForm.module.css';

export default async function NewBannerPage() {
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true }
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Yangi Banner Qo'shish</h1>
            <BannerForm categories={categories} />
        </div>
    );
}
