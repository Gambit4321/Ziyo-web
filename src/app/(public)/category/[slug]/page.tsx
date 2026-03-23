import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AudioPostCard from '@/components/AudioPostCard';
import CategoryViewToggle from '@/components/CategoryViewToggle';
import SafeImage from '@/components/SafeImage';
import Sidebar from '@/components/Sidebar';
import styles from './category.module.css';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PostTypeFilter = 'all' | 'standard' | 'video' | 'audio';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; type?: string }>;
}

const FILTER_OPTIONS: { value: PostTypeFilter; label: string }[] = [
    { value: 'all', label: 'Barchasi' },
    { value: 'standard', label: 'Maqolalar' },
    { value: 'video', label: 'Videolar' },
    { value: 'audio', label: 'Audiolar' },
];

function normalizeTypeFilter(value?: string): PostTypeFilter {
    if (value === 'standard' || value === 'video' || value === 'audio') {
        return value;
    }

    return 'all';
}

const getCategoryBySlug = cache(async (slug: string) => {
    const category = await prisma.category.findUnique({
        where: { slug },
        include: { children: true },
    });

    if (!category) {
        return null;
    }

    const baseWhere = {
        categoryId: category.id,
        published: true,
        createdAt: { lte: new Date() },
    };

    const [publishedPostsCount, standardCount, videoCount, audioCount] = await Promise.all([
        prisma.post.count({ where: baseWhere }),
        prisma.post.count({ where: { ...baseWhere, type: 'standard' } }),
        prisma.post.count({ where: { ...baseWhere, type: 'video' } }),
        prisma.post.count({ where: { ...baseWhere, type: 'audio' } }),
    ]);

    return {
        category,
        counts: {
            all: publishedPostsCount,
            standard: standardCount,
            video: videoCount,
            audio: audioCount,
        },
    };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const result = await getCategoryBySlug(slug);

    if (!result) {
        return buildMetadata({
            title: 'Kategoriya topilmadi',
            description: 'So`ralgan kategoriya mavjud emas.',
            path: `/category/${slug}`,
            noIndex: true,
        });
    }

    const { category, counts } = result;
    const contentLabel =
        counts.all > 0
            ? `${counts.all} ta material jamlangan.`
            : 'Hozircha materiallar soni kam, lekin bo`lim faol.';

    return buildMetadata({
        title: category.name,
        description: `${category.name} bo'limidagi maqola, video va audio materiallar. ${contentLabel}`,
        path: `/category/${category.slug}`,
        image: category.image,
    });
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { page, type } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || '1'));
    const currentType = normalizeTypeFilter(type);
    const pageSize = 12;

    const result = await getCategoryBySlug(slug);

    if (!result) {
        notFound();
    }

    const { category, counts } = result;

    const postWhere = {
        categoryId: category.id,
        published: true,
        createdAt: { lte: new Date() },
        ...(currentType !== 'all' ? { type: currentType } : {}),
    };

    const [posts, filteredCount] = await Promise.all([
        prisma.post.findMany({
            where: postWhere,
            include: {
                category: true,
                author: true,
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: (currentPage - 1) * pageSize,
        }),
        prisma.post.count({ where: postWhere }),
    ]);

    const isAudioCategory = currentType === 'audio' || (posts.length > 0 && posts.every((post) => post.type === 'audio'));
    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

    const audioPlaylist = isAudioCategory
        ? posts.map((post) => ({
              id: post.id,
              title: post.title,
              videoUrl: post.videoUrl,
              thumbnail: post.thumbnail,
              author: { name: post.author?.name || 'Ziyo Media' },
              content: post.content,
          }))
        : [];

    return (
        <div className="container">
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <p className={styles.eyebrow}>{"Bo'lim"}</p>
                        <h1 className={styles.title}>{category.name}</h1>
                        <p className={styles.description}>
                            {counts.all > 0
                                ? `${counts.all} ta material mavjud. Siz kontentni format bo'yicha saralashingiz mumkin.`
                                : "Hozircha e'lon qilingan materiallar kam, lekin bo'lim faol."}
                        </p>
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Jami</span>
                            <strong className={styles.statValue}>{counts.all}</strong>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Audio</span>
                            <strong className={styles.statValue}>{counts.audio}</strong>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Video</span>
                            <strong className={styles.statValue}>{counts.video}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.filters}>
                    {FILTER_OPTIONS.map((option) => (
                        <Link
                            key={option.value}
                            href={option.value === 'all' ? `/category/${slug}` : `/category/${slug}?type=${option.value}`}
                            className={`${styles.filterChip} ${currentType === option.value ? styles.filterChipActive : ''}`}
                        >
                            <span>{option.label}</span>
                            <span className={styles.filterCount}>{counts[option.value]}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftContent}>
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

                    {posts.length > 0 ? (
                        <>
                            {isAudioCategory ? (
                                <div className={styles.list}>
                                    {posts.map((post) => (
                                        <AudioPostCard key={post.id} post={post} playlist={audioPlaylist} />
                                    ))}
                                </div>
                            ) : (
                                <CategoryViewToggle posts={posts} hideThumbnailInitially={slug === 'maqolalar'} />
                            )}

                            <div className={styles.pagination}>
                                {currentPage > 1 && (
                                    <Link
                                        href={
                                            currentType === 'all'
                                                ? `/category/${slug}?page=${currentPage - 1}`
                                                : `/category/${slug}?type=${currentType}&page=${currentPage - 1}`
                                        }
                                        className={styles.pageBtn}
                                    >
                                        Oldingilar
                                    </Link>
                                )}

                                <span className={styles.pageInfo}>{`${currentPage} / ${totalPages}`}</span>

                                {currentPage < totalPages && (
                                    <Link
                                        href={
                                            currentType === 'all'
                                                ? `/category/${slug}?page=${currentPage + 1}`
                                                : `/category/${slug}?type=${currentType}&page=${currentPage + 1}`
                                        }
                                        className={styles.pageBtn}
                                    >
                                        Keyingilar
                                    </Link>
                                )}
                            </div>
                        </>
                    ) : (
                        (!category.children || category.children.length === 0) && (
                            <p className={styles.empty}>{"Bu filtr bo'yicha hali material yo'q."}</p>
                        )
                    )}
                </div>

                <div className={styles.sidebarWrapper}>
                    <Sidebar categoryId={category.id} />
                </div>
            </div>
        </div>
    );
}
