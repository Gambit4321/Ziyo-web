import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import styles from './search.module.css';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { q } = await searchParams;
    const query = q?.trim() || '';

    if (query.length < 2) {
        return buildMetadata({
            title: 'Qidiruv',
            description: "Ziyo.uz sayti bo'ylab maqola, video va audio materiallarni qidiring.",
            path: '/search',
            noIndex: true,
        });
    }

    return buildMetadata({
        title: `"${query}" bo'yicha qidiruv`,
        description: `"${query}" so'zi bo'yicha Ziyo.uz saytidagi qidiruv natijalari sahifasi.`,
        path: `/search?q=${encodeURIComponent(query)}`,
        noIndex: true,
    });
}

export default async function SearchPage({ searchParams }: Props) {
    const { q } = await searchParams;
    const query = q || '';

    if (!query || query.trim().length < 2) {
        return (
            <div className="container">
                <div className={styles.empty}>
                    <h1>Qidiruv</h1>
                    <p>Qidiruv uchun kamida 2 ta harf kiriting.</p>
                </div>
            </div>
        );
    }

    const [posts, categories] = await Promise.all([
        prisma.post.findMany({
            where: {
                AND: [
                    { published: true },
                    { createdAt: { lte: new Date() } },
                    {
                        OR: [
                            { title: { contains: query } },
                            { content: { contains: query } },
                            { excerpt: { contains: query } },
                        ],
                    },
                ],
            },
            include: { category: true },
            take: 20,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.category.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { slug: { contains: query } },
                ],
            },
            take: 10,
        }),
    ]);

    return (
        <div className="container">
            <div className={styles.header}>
                <h1 className={styles.title}>Qidiruv natijalari</h1>
                <p className={styles.query}>{`"${query}" bo'yicha ${posts.length + categories.length} ta natija topildi`}</p>
            </div>

            {categories.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Kategoriyalar</h2>
                    <div className={styles.categories}>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className={styles.categoryCard}
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {posts.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Maqolalar</h2>
                    <div className={styles.grid}>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}

            {posts.length === 0 && categories.length === 0 && (
                <div className={styles.empty}>
                    <p>{"Hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring."}</p>
                </div>
            )}
        </div>
    );
}
