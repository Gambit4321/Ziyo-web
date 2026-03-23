'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';
import Link from 'next/link';
import styles from './SearchModal.module.css';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchCategory {
    id: string;
    name: string;
    slug: string;
}

interface SearchPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    thumbnail: string | null;
    createdAt: string;
    category: {
        name: string;
        slug: string;
    } | null;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [posts, setPosts] = useState<SearchPost[]>([]);
    const [categories, setCategories] = useState<SearchCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const trimmed = query.trim();

        if (trimmed.length < 2) {
            setPosts([]);
            setCategories([]);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
                    cache: 'no-store',
                });

                if (!response.ok) {
                    throw new Error('Search request failed');
                }

                const data = (await response.json()) as {
                    posts?: SearchPost[];
                    categories?: SearchCategory[];
                };

                if (!cancelled) {
                    setPosts(data.posts || []);
                    setCategories(data.categories || []);
                }
            } catch {
                if (!cancelled) {
                    setPosts([]);
                    setCategories([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [isOpen, query]);

    const resetSearch = () => {
        setQuery('');
        setPosts([]);
        setCategories([]);
        setIsLoading(false);
    };

    const handleNavigate = (href: string) => {
        router.push(href);
        onClose();
        resetSearch();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const hasSuggestions = categories.length > 0 || posts.length > 0;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
                    <X size={32} />
                </button>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Qidirish..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="submit" className={styles.submitBtn}>
                        <Search size={32} />
                    </button>
                </form>

                {query.trim().length >= 2 && (
                    <div className={styles.results}>
                        <div className={styles.resultsHeader}>
                            <span className={styles.resultsLabel}>Tezkor natijalar</span>
                            <button
                                type="button"
                                className={styles.allResultsBtn}
                                onClick={() => handleNavigate(`/search?q=${encodeURIComponent(query.trim())}`)}
                            >
                                {"Barcha natijalarni ko'rish"}
                            </button>
                        </div>

                        {isLoading && <p className={styles.status}>Qidirilmoqda...</p>}

                        {!isLoading && !hasSuggestions && (
                            <p className={styles.status}>Hech narsa topilmadi.</p>
                        )}

                        {!isLoading && categories.length > 0 && (
                            <div className={styles.group}>
                                <p className={styles.groupTitle}>Kategoriyalar</p>
                                <div className={styles.categoryList}>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className={styles.categoryItem}
                                            onClick={() => handleNavigate(`/category/${category.slug}`)}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isLoading && posts.length > 0 && (
                            <div className={styles.group}>
                                <p className={styles.groupTitle}>Maqolalar</p>
                                <div className={styles.postList}>
                                    {posts.map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/post/${post.slug}`}
                                            className={styles.postItem}
                                            onClick={() => {
                                                onClose();
                                                resetSearch();
                                            }}
                                        >
                                            <div className={styles.postText}>
                                                <span className={styles.postCategory}>
                                                    {post.category?.name || 'Material'}
                                                </span>
                                                <span className={styles.postTitle}>{post.title}</span>
                                                {post.excerpt && (
                                                    <span className={styles.postExcerpt}>{post.excerpt}</span>
                                                )}
                                            </div>
                                            <span className={styles.postArrow}>{"Ko'rish"}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
