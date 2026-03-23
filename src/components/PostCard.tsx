import Link from 'next/link';
import { Play } from 'lucide-react';
import styles from './PostCard.module.css';

interface PostCardProps {
    post: {
        id?: string | number;
        title: string;
        slug: string;
        thumbnail: string | null;
        type: string;
        category?: { name: string } | null;
        excerpt?: string | null;
        content?: string | null;
        createdAt: string | Date;
    };
    hideThumbnail?: boolean;
    layout?: 'grid' | 'grid-large' | 'list-detailed' | 'list-compact';
}

export default function PostCard({ post, hideThumbnail = false, layout = 'grid' }: PostCardProps) {
    // Format date
    const date = new Date(post.createdAt).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Helper to strip HTML and truncate
    const getExcerpt = (text: string | null | undefined, limit: number = 300) => {
        if (!text) return '';
        const plainText = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
        const trimmed = plainText.trim();
        return trimmed.length > limit ? trimmed.substring(0, limit) + '...' : trimmed;
    };

    const excerptToDisplay = post.excerpt || getExcerpt(post.content);

    // Determine effective rendering mode based on layout prop
    const isCompact = layout === 'list-compact' || hideThumbnail;
    const isHorizontal = layout === 'list-detailed';
    const isLargeGrid = layout === 'grid-large';

    return (
        <div className={`${styles.card} ${isHorizontal ? styles.cardHorizontal : ''} ${isCompact ? styles.cardCompact : ''} ${isLargeGrid ? styles.cardLargeGrid : ''}`}>
            {!isCompact && (
                <Link href={`/post/${post.slug}`} className={`${styles.imageWrapper} ${isHorizontal ? styles.horizontalImage : ''} ${post.type === 'video' ? styles.videoWrapper : styles.articleWrapper}`}>
                    <img
                        src={post.thumbnail || '/images/placeholder.webp'}
                        alt={post.title}
                        className={styles.image}
                    />
                    {post.type === 'video' && (
                        <div className={`${styles.playIcon} ${isHorizontal ? styles.smallPlayIcon : ''}`}>
                            <Play fill="white" size={isHorizontal ? 16 : 20} />
                        </div>
                    )}
                    {post.category && (
                        <span className={styles.category}>{post.category.name}</span>
                    )}
                </Link>
            )}

            <div className={`${styles.content} ${isHorizontal ? styles.horizontalContent : ''}`}>
                <h3 className={`${styles.title} ${isCompact || isLargeGrid ? styles.largeTitle : ''} ${isHorizontal ? styles.horizontalTitle : ''}`}>
                    <Link href={`/post/${post.slug}`}>{post.title}</Link>
                </h3>

                {/* Metadata Line */}
                <div className={styles.meta}>
                    {post.category && (
                        <span className={styles.metaCategory}>{post.category.name}</span>
                    )}
                    <span className={styles.separator}> · </span>
                    <span className={styles.date}>{date}</span>
                </div>

                {/* Excerpt */}
                {(isCompact || isHorizontal || isLargeGrid) && excerptToDisplay && (
                    <p className={styles.excerpt}>{excerptToDisplay}</p>
                )}
            </div>
        </div>
    );
}
