'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from './HeroSlider.module.css';

type Slide = {
    id: string;
    title: string;
    image: string;
    category?: string; // Made optional as Banner doesn't have it
    link: string | null;
    tagline?: string | null;
    topText?: string | null;
    description?: string | null;
};

// Default fallback slides (optional, can be empty or keep for dev)
const DEFAULT_SLIDES: Slide[] = [
    {
        id: '1',
        title: '9-FEVRAL – ALISHER NAVOIY TAVALLUD TOPGAN KUN',
        image: 'https://ziyo.uz/media/2024/02/navoiy-slider.jpg',
        category: 'Tadbir',
        link: '/post/alisher-navoiy'
    }
];

interface HeroSliderProps {
    slides: any[]; // Using any[] temporarily effectively, but ideally should be Banner[] type from prisma
}

export default function HeroSlider({ slides = [] }: HeroSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

    const activeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (activeSlides.length === 0) return null;

    return (
        <div className={styles.sliderWrapper}>
            <div className={styles.embla} ref={emblaRef}>
                <div className={styles.embla__container}>
                    {activeSlides.map((slide) => (
                        <div key={slide.id} className={styles.embla__slide}>
                            <div
                                className={styles.slideBackground}
                                style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${slide.image || '/placeholder.jpg'})` }}
                            />
                            <div className={`container ${styles.slideContent}`}>
                                {slide.topText && <span className={styles.category}>{slide.topText}</span>}
                                {slide.category && !slide.topText && <span className={styles.category}>{slide.category}</span>}

                                <h2 className={styles.title}>{slide.title}</h2>
                                {slide.tagline && <p className={styles.tagline} style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', marginBottom: '1rem' }}>{slide.tagline}</p>}

                                {slide.link && (
                                    <Link href={slide.link} className={styles.btn}>
                                        {slide.buttonText || 'Batafsil'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={scrollPrev}>
                <ChevronLeft size={32} />
            </button>
            <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={scrollNext}>
                <ChevronRight size={32} />
            </button>
        </div>
    );
}
