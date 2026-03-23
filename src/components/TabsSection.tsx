'use client';

import { useState } from 'react';
import { Post, Category } from '@prisma/client';
import PostCard from './PostCard';
import styles from './TabsSection.module.css';
import Link from 'next/link';

type PostWithCategory = Post & { category: Category | null };

type TabsSectionProps = {
    allPosts: PostWithCategory[];
    articlePosts: PostWithCategory[];
    videoPosts: PostWithCategory[];
};

export default function TabsSection({ allPosts, articlePosts, videoPosts }: TabsSectionProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'videos'>('all');

    const posts = activeTab === 'all' ? allPosts : activeTab === 'articles' ? articlePosts : videoPosts;
    const activeHref = activeTab === 'all' ? '/latest' : activeTab === 'articles' ? '/latest?type=articles' : '/latest?type=videos';

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div className={styles.left}>
                    <h2 className={styles.title}>ENG YANGI</h2>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            BARCHASI
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'articles' ? styles.active : ''}`}
                            onClick={() => setActiveTab('articles')}
                        >
                            MAQOLALAR
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'videos' ? styles.active : ''}`}
                            onClick={() => setActiveTab('videos')}
                        >
                            VIDEOLAR
                        </button>
                    </div>
                </div>
                <Link href={activeHref} className={styles.viewAll}>{"BARCHASINI KO'RISH"}</Link>
            </div>

            <div className={styles.grid}>
                {posts.slice(0, 5).map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}
