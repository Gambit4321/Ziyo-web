'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, FileText, FolderOpen, Image, Settings, LogOut, Sliders, Headphones, Video } from 'lucide-react';
import styles from './AdminSidebar.module.css';

const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Maqolalar', href: '/admin/posts?type=standard', icon: FileText },
    { name: 'Audiomaxsulotlar', href: '/admin/posts?type=audio', icon: Headphones },
    { name: 'Videolar', href: '/admin/posts?type=video', icon: Video },
    { name: 'Kategoriyalar', href: '/admin/categories', icon: FolderOpen },
    { name: 'Bannerlar', href: '/admin/banners', icon: Image },
    { name: 'Bosh Sahifa', href: '/admin/settings/home', icon: Sliders },
    { name: 'Sozlamalar', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <Link href="/admin/dashboard" className={styles.logo}>
                ZIYO ADMIN
            </Link>

            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.active : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.user}>
                <button onClick={() => signOut()} className={styles.logoutBtn}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <LogOut size={16} />
                        Chiqish
                    </div>
                </button>
            </div>
        </aside>
    );
}
