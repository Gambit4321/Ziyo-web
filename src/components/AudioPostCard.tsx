'use client';

import Link from 'next/link';
import { Play, Pause } from 'lucide-react';
import styles from './AudioPostCard.module.css';
// Define Track interface locally or import? 
// Better to import from context to match exactly.
import { useAudio, Track } from '@/context/AudioContext';

interface AudioPostCardProps {
    post: {
        id: string;
        title: string;
        slug: string;
        thumbnail: string | null;
        type: string;
        category?: { name: string } | null;
        excerpt?: string | null;
        content?: string | null;
        createdAt: string | Date;
        views?: number;
        author?: { name: string | null } | null;
        videoUrl?: string | null;
    };
    playlist?: Track[];
}

export default function AudioPostCard({ post, playlist = [] }: AudioPostCardProps) {
    const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

    // Format date
    const date = new Date(post.createdAt).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isCurrentTrack = currentTrack?.id === post.id;
    const isActive = isCurrentTrack && isPlaying;

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentTrack) {
            togglePlay();
        } else {
            playTrack({
                id: post.id,
                title: post.title,
                videoUrl: post.videoUrl,
                thumbnail: post.thumbnail,
                author: post.author,
                content: post.content
            }, playlist);
        }
    };

    return (
        <Link href={`/post/${post.slug}`} className={`${styles.card} ${isCurrentTrack ? styles.activeCard : ''}`}>
            <div className={styles.iconWrapper} onClick={handlePlay}>
                {isActive ? <Pause fill="black" size={20} className={styles.playIcon} /> : <Play fill="black" size={20} className={styles.playIcon} />}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{post.title}</h3>
                <div className={styles.meta}>
                    <span className={styles.date}>{date}</span>
                    {post.views !== undefined && (
                        <>
                            <span className={styles.separator}>•</span>
                            <span className={styles.views}>{post.views} marta ko'rildi</span>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.action}>
                <button className={styles.listenBtn} onClick={handlePlay}>
                    {isActive ? 'Pauza' : 'Eshitish'}
                </button>
            </div>
        </Link>
    );
}
