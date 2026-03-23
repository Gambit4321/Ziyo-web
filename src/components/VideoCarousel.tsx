'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './VideoCarousel.module.css';
import Autoplay from 'embla-carousel-autoplay';
import { Post, Category } from '@prisma/client';

type PostWithCategory = Post & { category: Category | null };

export default function VideoCarousel({ posts, title, link, autoplaySeconds = 0 }: { posts: PostWithCategory[], title: string, link: string, autoplaySeconds?: number }) {
    const plugins = [];
    if (autoplaySeconds > 0) {
        plugins.push(Autoplay({ delay: autoplaySeconds * 1000, stopOnInteraction: false }));
    }

    const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, skipSnaps: false }, plugins);

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.controls}>
                    <Link href={link} className={styles.viewAll}>Barchasini ko'rish</Link>
                    <div className={styles.navBtns}>
                        <button onClick={scrollPrev} className={styles.navBtn}><ChevronLeft size={18} /></button>
                        <button onClick={scrollNext} className={styles.navBtn}><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className={styles.embla} ref={emblaRef}>
                <div className={styles.embla__container}>
                    {posts.map(post => (
                        <div className={styles.embla__slide} key={post.id}>
                            <Link href={`/post/${post.slug}`} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    {post.thumbnail ? (
                                        <img src={post.thumbnail} alt={post.title} className={styles.image} />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            <Play size={30} className={styles.playIcon} />
                                        </div>
                                    )}
                                    <div className={styles.overlay}>
                                        <Play size={40} fill="white" className={styles.playBtn} />
                                    </div>
                                    {post.type === 'video' && <span className={styles.duration}>02:15</span>}
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.meta}>
                                        <span className={styles.catName}>{post.category?.name}</span>
                                        {/* <span className={styles.date}>{new Date(post.createdAt).getFullYear()}</span> */}
                                    </div>
                                    <h3 className={styles.postTitle}>{post.title}</h3>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
