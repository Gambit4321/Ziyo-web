import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import styles from './category.module.css';
import SafeImage from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;

    const category = await prisma.category.findUnique({
        where: { slug },
        include: { children: true },
    });

    if (!category) {
        notFound();
    }

    const posts = await prisma.post.findMany({
        where: { categoryId: category.id },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="container">
            <div className={styles.header}>
                <h1 className={styles.title}>{category.name}</h1>
                <div className={styles.line}></div>
            </div>

            {/* Subcategories (Shows) */}
            {category.children && category.children.length > 0 && (
                <div className={styles.subCategories}>
                    {category.children.map((sub) => (
                        <a key={sub.id} href={`/category/${sub.slug}`} className={styles.subCategoryCard}>
                            <div className={styles.imageWrapper}>
                                <SafeImage
                                    src={sub.image || '/images/logo.png'}
                                    alt={sub.name}
                                    className={styles.image}
                                />
                            </div>
                            <h3>{sub.name}</h3>
                        </a>
                    ))}
                </div>
            )}

            {posts.length > 0 ? (
                <div className={styles.grid}>
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <p className={styles.empty}>Bu kategoriyada hali maqolalar yo'q.</p>
            )}
        </div>
    );
}
