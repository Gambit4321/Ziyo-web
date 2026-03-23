'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import styles from './CategoryCarousel.module.css';
import { Category } from '@prisma/client';

type CategoryWithCount = Category & { _count?: { posts: number } | null, posts?: any[] };

export default function CategoryCarousel({
    categories,
    title,
    link,
    autoplaySeconds = 0
}: {
    categories: CategoryWithCount[],
    title: string,
    link?: string,
    autoplaySeconds?: number
}) {
    const plugins = [];
    if (autoplaySeconds > 0) {
        plugins.push(Autoplay({ delay: autoplaySeconds * 1000, stopOnInteraction: false }));
    }

    const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, skipSnaps: false }, plugins);

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!categories || categories.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.controls}>
                    {link && <Link href={link} className={styles.viewAll}>Barchasini ko'rish</Link>}
                    <div className={styles.navBtns}>
                        <button onClick={scrollPrev} className={styles.navBtn}><ChevronLeft size={18} /></button>
                        <button onClick={scrollNext} className={styles.navBtn}><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className={styles.embla} ref={emblaRef}>
                <div className={styles.embla__container}>
                    {categories.map(cat => (
                        <div className={styles.embla__slide} key={cat.id}>
                            <Link href={`/category/${cat.slug}`} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className={styles.image} />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            <ImageIcon size={30} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.content}>
                                    <h3 className={styles.catName} title={cat.name}>{cat.name}</h3>
                                    <div className={styles.meta}>
                                        <span>{(cat._count?.posts ?? (cat.posts?.length || 0)) || 0} material</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
