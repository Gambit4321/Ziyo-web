'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Grid2X2, List, AlignJustify } from 'lucide-react';
import PostCard from '@/components/PostCard';
import styles from './CategoryViewToggle.module.css';

type ViewMode = 'grid' | 'grid-large' | 'list-detailed' | 'list-compact';

interface CategoryViewToggleProps {
    posts: any[];
    hideThumbnailInitially?: boolean;
}

export default function CategoryViewToggle({ posts, hideThumbnailInitially }: CategoryViewToggleProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(hideThumbnailInitially ? 'list-compact' : 'grid');

    useEffect(() => {
        const saved = localStorage.getItem('categoryViewMode');
        if (saved) {
            setViewMode(saved as ViewMode);
        }
    }, []);

    const handleModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('categoryViewMode', mode);
    };

    if (!posts || posts.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.modeToggle}>
                    <button
                        onClick={() => handleModeChange('grid')}
                        className={`${styles.iconBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        title="Kichik to'r (ko'proq ustunlar)"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => handleModeChange('grid-large')}
                        className={`${styles.iconBtn} ${viewMode === 'grid-large' ? styles.active : ''}`}
                        title="Katta to'r (kamroq ustunlar)"
                    >
                        <Grid2X2 size={20} />
                    </button>
                    <button
                        onClick={() => handleModeChange('list-detailed')}
                        className={`${styles.iconBtn} ${viewMode === 'list-detailed' ? styles.active : ''}`}
                        title="Kengaytirilgan ro'yxat"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => handleModeChange('list-compact')}
                        className={`${styles.iconBtn} ${viewMode === 'list-compact' ? styles.active : ''}`}
                        title="Ixcham ro'yxat"
                    >
                        <AlignJustify size={20} />
                    </button>
                </div>
            </div>

            <div className={`${styles.contentWrapper} ${styles[viewMode]}`}>
                {posts.map(post => (
                    <PostCard key={post.id} post={post} layout={viewMode} />
                ))}
            </div>
        </div>
    );
}
