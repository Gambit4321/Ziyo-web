import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import styles from '../[slug]/category.module.css';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AudioCategoryPage() {
    const category = await prisma.category.findUnique({
        where: { slug: 'audio' },
        include: { children: true },
    });

    if (!category) {
        notFound();
    }

    return (
        <div className="container">
            <div className={styles.mainGrid}>
                <div className={styles.leftContent}>
                    {/* Subcategories */}
                    {category.children && category.children.length > 0 && (
                        <div className={styles.subCategories}>
                            {category.children.map((sub) => (
                                <Link key={sub.id} href={`/category/${sub.slug}`} className={styles.subCategoryCard}>
                                    <div className={styles.imageWrapper}>
                                        <SafeImage
                                            src={sub.image || '/images/logo.png'}
                                            alt={sub.name}
                                            className={styles.image}
                                        />
                                    </div>
                                    <h3>{sub.name}</h3>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
