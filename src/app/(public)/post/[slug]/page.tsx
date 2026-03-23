import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import AudioPlayer from '@/components/AudioPlayer';
import PostCard from '@/components/PostCard';
import PostViewCounter from '@/components/PostViewCounter';
import SafeImage from '@/components/SafeImage';
import styles from './post.module.css';
import { buildMetadata, stripHtml, toAbsoluteUrl, truncateText } from '@/lib/seo';

interface Props {
    params: Promise<{ slug: string }>;
}

function estimateReadingMinutes(content?: string | null) {
    const wordCount = stripHtml(content).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 220));
}

function formatPublishedDate(value: Date) {
    return value.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

const getPublishedPostBySlug = cache(async (slug: string) => {
    const post = await prisma.post.findUnique({
        where: { slug },
        include: { category: true, author: true },
    });

    if (!post || !post.published || new Date(post.createdAt) > new Date()) {
        return null;
    }

    return post;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPublishedPostBySlug(slug);

    if (!post) {
        return buildMetadata({
            title: 'Maqola topilmadi',
            description: "So'ralgan material topilmadi yoki hali e'lon qilinmagan.",
            path: `/post/${slug}`,
            noIndex: true,
        });
    }

    return buildMetadata({
        title: post.title,
        description: truncateText(post.excerpt || post.content || post.title, 160),
        path: `/post/${post.slug}`,
        image: post.thumbnail,
        type: 'article',
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        section: post.category?.name || undefined,
    });
}

export default async function SinglePostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPublishedPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const now = new Date();
    const readingMinutes = estimateReadingMinutes(post.content || post.excerpt);
    const publishedDate = formatPublishedDate(post.createdAt);
    const shareUrl = toAbsoluteUrl(`/post/${post.slug}`);
    const encodedShareUrl = encodeURIComponent(shareUrl);
    const shareTitle = encodeURIComponent(post.title);

    const [sameCategoryPosts, previousPost, nextPost] = await Promise.all([
        prisma.post.findMany({
            where: {
                categoryId: post.categoryId,
                id: { not: post.id },
                published: true,
                createdAt: { lte: now },
            },
            take: 4,
            include: { category: true },
            orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.post.findFirst({
            where: {
                published: true,
                createdAt: { gt: post.createdAt, lte: now },
            },
            orderBy: [{ createdAt: 'asc' }],
            select: {
                id: true,
                title: true,
                slug: true,
            },
        }),
        prisma.post.findFirst({
            where: {
                published: true,
                createdAt: { lt: post.createdAt },
            },
            orderBy: [{ createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                slug: true,
            },
        }),
    ]);

    let relatedPosts = sameCategoryPosts;

    if (relatedPosts.length < 4) {
        const fallbackPosts = await prisma.post.findMany({
            where: {
                id: {
                    notIn: [post.id, ...relatedPosts.map((item) => item.id)],
                },
                published: true,
                createdAt: { lte: now },
            },
            take: 4 - relatedPosts.length,
            include: { category: true },
            orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        });

        relatedPosts = [...relatedPosts, ...fallbackPosts];
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': post.type === 'audio' ? 'AudioObject' : post.type === 'video' ? 'VideoObject' : 'Article',
        name: post.title,
        description: truncateText(post.excerpt || post.content || post.title, 200),
        thumbnailUrl: post.thumbnail ? [toAbsoluteUrl(post.thumbnail)] : undefined,
        contentUrl: post.videoUrl,
        url: shareUrl,
        mainEntityOfPage: shareUrl,
        uploadDate: post.createdAt.toISOString(),
        datePublished: post.createdAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        articleSection: post.category?.name || undefined,
        timeRequired: `PT${readingMinutes}M`,
        author: {
            '@type': 'Person',
            name: post.author?.name || 'Ziyo Media',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Ziyo.uz',
            logo: {
                '@type': 'ImageObject',
                url: toAbsoluteUrl('/images/logo.png'),
            },
        },
    };

    return (
        <div className="container">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className={styles.layout}>
                <div className={styles.mainContent}>
                    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                        <Link href="/" className={styles.breadcrumbLink}>
                            Bosh sahifa
                        </Link>
                        {post.category && (
                            <>
                                <span className={styles.breadcrumbDivider}>/</span>
                                <Link href={`/category/${post.category.slug}`} className={styles.breadcrumbLink}>
                                    {post.category.name}
                                </Link>
                            </>
                        )}
                        <span className={styles.breadcrumbDivider}>/</span>
                        <span className={styles.breadcrumbCurrent}>{post.title}</span>
                    </nav>

                    {post.type === 'audio' && post.videoUrl ? (
                        <AudioPlayer
                            showPlaylist={false}
                            tracks={[
                                {
                                    id: post.id,
                                    title: post.title,
                                    videoUrl: post.videoUrl,
                                    thumbnail: post.thumbnail,
                                    author: post.author ? { name: post.author.name || 'Ziyo Media' } : { name: 'Ziyo Media' },
                                },
                            ]}
                        />
                    ) : post.type === 'video' && post.videoUrl ? (
                        <div className={styles.videoWrapper}>
                            {(() => {
                                const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                                const match = post.videoUrl?.match(ytRegex);
                                const videoId = match ? match[1] : null;

                                if (videoId) {
                                    return (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            className={styles.iframe}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    );
                                }

                                return <video src={post.videoUrl} controls className={styles.video} poster={post.thumbnail || ''} />;
                            })()}
                        </div>
                    ) : (
                        post.thumbnail && (
                            <div className={styles.featuredImage}>
                                <SafeImage src={post.thumbnail} alt={post.title} />
                            </div>
                        )
                    )}

                    <h1 className={styles.title}>{post.title}</h1>

                    <div className={styles.meta}>
                        <span>{post.category?.name}</span>
                        <span>|</span>
                        <span>{publishedDate}</span>
                        <span>|</span>
                        <span>{`${readingMinutes} daqiqa o'qish`}</span>
                        <span>|</span>
                        <PostViewCounter postId={post.id} initialViews={post.views} />
                    </div>

                    <div className={styles.utilityBar}>
                        <div className={styles.authorCard}>
                            <span className={styles.authorLabel}>Muallif</span>
                            <span className={styles.authorName}>{post.author?.name || 'Ziyo Media'}</span>
                        </div>

                        <div className={styles.shareCard}>
                            <span className={styles.shareLabel}>Ulashish</span>
                            <div className={styles.shareLinks}>
                                <a
                                    href={`https://t.me/share/url?url=${encodedShareUrl}&text=${shareTitle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.shareLink}
                                >
                                    Telegram
                                </a>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.shareLink}
                                >
                                    Facebook
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${shareTitle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.shareLink}
                                >
                                    X
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className={styles.content}>{post.content}</div>

                    {(previousPost || nextPost) && (
                        <div className={styles.navGrid}>
                            {previousPost ? (
                                <Link href={`/post/${previousPost.slug}`} className={styles.navCard}>
                                    <span className={styles.navLabel}>Oldingi material</span>
                                    <span className={styles.navTitle}>{previousPost.title}</span>
                                </Link>
                            ) : (
                                <div className={styles.navCardPlaceholder}></div>
                            )}

                            {nextPost ? (
                                <Link href={`/post/${nextPost.slug}`} className={styles.navCard}>
                                    <span className={styles.navLabel}>Keyingi material</span>
                                    <span className={styles.navTitle}>{nextPost.title}</span>
                                </Link>
                            ) : (
                                <div className={styles.navCardPlaceholder}></div>
                            )}
                        </div>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <h3 className={styles.sidebarTitle}>{"O'xshash xabarlar"}</h3>
                    <div className={styles.sidebarGrid}>
                        {relatedPosts.map((related) => (
                            <PostCard key={related.id} post={related} />
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
