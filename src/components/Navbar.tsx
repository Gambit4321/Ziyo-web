'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Globe, ChevronDown, Play, Pause, Menu as MenuIcon, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SearchModal from './SearchModal';
import styles from './Navbar.module.css';
import { useAudio } from '@/context/AudioContext';

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Props {
    categories?: Category[];
}

export default function Navbar({ categories = [] }: Props) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { currentTrack, isPlaying, togglePlay } = useAudio();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            <header className={styles.header}>
                <div className={`container ${styles.navContainer}`}>
                    {/* Hamburger Menu (Mobile Only) */}
                    <button
                        className={styles.menuBtn}
                        onClick={toggleMenu}
                        aria-label="Menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
                    </button>

                    {/* Logo Section */}
                    <div className={styles.logoWrapper}>
                        <Link href="/" className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <img src="/images/logo.png" alt="Ziyo.uz Logo" className={styles.logoImage} />
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links (Desktop) */}
                    <nav className={styles.nav}>
                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <div key={cat.id} className={styles.linkWrapper}>
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        className={`${styles.link} ${pathname === `/category/${cat.slug}` ? styles.active : ''}`}
                                    >
                                        {cat.name}
                                    </Link>
                                    {/* Show play/pause indicator for audio category when track is active */}
                                    {cat.slug === 'audio' && currentTrack && (
                                        <button
                                            className={styles.audioIndicator}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                togglePlay();
                                            }}
                                            aria-label={isPlaying ? 'Pause' : 'Play'}
                                        >
                                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Fallback if no categories are set to showInMenu
                            <>
                                <Link href="/category/korsatuvlar" className={`${styles.link} ${pathname === '/category/korsatuvlar' ? styles.active : ''}`}>Ko'rsatuvlar</Link>
                                <Link href="/category/lavha" className={`${styles.link} ${pathname === '/category/lavha' ? styles.active : ''}`}>Lavha va reportajlar</Link>
                                <Link href="/category/cinema" className={`${styles.link} ${pathname === '/category/cinema' ? styles.active : ''}`}>Ziyo Cinema</Link>
                                <div className={styles.linkWrapper}>
                                    <Link href="/category/audio" className={`${styles.link} ${pathname === '/category/audio' ? styles.active : ''}`}>Audiomahsulotlar</Link>
                                    {currentTrack && (
                                        <button
                                            className={styles.audioIndicator}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                togglePlay();
                                            }}
                                            aria-label={isPlaying ? 'Pause' : 'Play'}
                                        >
                                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        </button>
                                    )}
                                </div>
                                <Link href="/category/maqolalar" className={`${styles.link} ${pathname === '/category/maqolalar' ? styles.active : ''}`}>Maqolalar</Link>
                                <Link href="/category/fotogalereya" className={`${styles.link} ${pathname === '/category/fotogalereya' ? styles.active : ''}`}>Fotogalereya</Link>
                            </>
                        )}
                    </nav>

                    {/* Right Actions */}
                    <div className={styles.actions}>
                        {/* Language Selector */}
                        <div className={styles.langSelector}>
                            <img src="https://flagcdn.com/w20/uz.png" alt="UZ" width="20" />
                            <span className={styles.langCode}>UZ</span>
                            <ChevronDown size={14} />
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Search */}
                        <button
                            className={styles.searchBtn}
                            aria-label="Search"
                            onClick={() => setIsSearchOpen(true)}
                        >
                            <Search size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                    <nav className={styles.mobileNav}>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className={`${styles.mobileLink} ${pathname === `/category/${cat.slug}` ? styles.mobileActive : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {cat.name}
                            </Link>
                        ))}
                        {categories.length === 0 && (
                            <>
                                <Link href="/category/korsatuvlar" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Ko'rsatuvlar</Link>
                                <Link href="/category/lavha" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Lavha va reportajlar</Link>
                                <Link href="/category/cinema" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Ziyo Cinema</Link>
                                <Link href="/category/audio" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Audiomahsulotlar</Link>
                                <Link href="/category/maqolalar" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Maqolalar</Link>
                                <Link href="/category/fotogalereya" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Fotogalereya</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
