import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AudioPostCard from '@/components/AudioPostCard';
import CategoryViewToggle from '@/components/CategoryViewToggle';
import styles from './latest.module.css';
import { buildMetadata } from '@/lib/seo';

type LatestType = 'all' | 'articles' | 'videos' | 'audio';

interface Props {
    searchParams: Promise<{ type?: string }>;
}

const FILTERS: { value: LatestType; label: string }[] = [
    { value: 'all', label: 'Barchasi' },
    { value: 'articles', label: 'Maqolalar' },
    { value: 'videos', label: 'Videolar' },
    { value: 'audio', label: 'Audiolar' },
];

function normalizeType(value?: string): LatestType {
    if (value === 'articles' || value === 'videos' || value === 'audio') {
        return value;
    }

    return 'all';
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { type } = await searchParams;
    const currentType = normalizeType(type);

    const descriptions: Record<LatestType, string> = {
        all: "Ziyo.uz saytidagi eng yangi maqola, video va audio materiallar.",
        articles: "Ziyo.uz saytidagi eng yangi maqolalar ro'yxati.",
        videos: "Ziyo.uz saytidagi eng yangi videolar ro'yxati.",
        audio: "Ziyo.uz saytidagi eng yangi audio materiallar ro'yxati.",
    };

    return buildMetadata({
        title: 'Eng yangi materiallar',
        description: descriptions[currentType],
        path: currentType === 'all' ? '/latest' : `/latest?type=${currentType}`,
    });
}

export default async function LatestPage({ searchParams }: Props) {
    const { type } = await searchParams;
    const currentType = normalizeType(type);
    const now = new Date();

    const where = {
        published: true,
        createdAt: { lte: now },
        ...(currentType === 'articles'
            ? { type: 'standard' }
            : currentType === 'videos'
                ? { type: 'video' }
                : currentType === 'audio'
                    ? { type: 'audio' }
                    : {}),
    };

    const posts = await prisma.post.findMany({
        where,
        include: {
            category: true,
            author: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });

    const audioPlaylist = posts
        .filter((post) => post.type === 'audio')
        .map((post) => ({
            id: post.id,
            title: post.title,
            videoUrl: post.videoUrl,
            thumbnail: post.thumbnail,
            author: { name: post.author?.name || 'Ziyo Media' },
            content: post.content,
        }));

    return (
        <div className="container">
            <section className={styles.hero}>
                <p className={styles.eyebrow}>Yangiliklar oqimi</p>
                <h1 className={styles.title}>Eng yangi materiallar</h1>
                <p className={styles.description}>
                    So&apos;nggi e&apos;lon qilingan kontentni format bo&apos;yicha ajratib ko&apos;ring.
                </p>

                <div className={styles.filters}>
                    {FILTERS.map((filter) => (
                        <Link
                            key={filter.value}
                            href={filter.value === 'all' ? '/latest' : `/latest?type=${filter.value}`}
                            className={`${styles.filterChip} ${currentType === filter.value ? styles.activeChip : ''}`}
                        >
                            {filter.label}
                        </Link>
                    ))}
                </div>
            </section>

            {posts.length === 0 ? (
                <div className={styles.empty}>Hozircha bu bo&apos;lim uchun material topilmadi.</div>
            ) : currentType === 'audio' ? (
                <div className={styles.audioList}>
                    {posts.map((post) => (
                        <AudioPostCard key={post.id} post={post} playlist={audioPlaylist} />
                    ))}
                </div>
            ) : (
                <CategoryViewToggle posts={posts} hideThumbnailInitially={currentType === 'articles'} />
            )}
        </div>
    );
}
