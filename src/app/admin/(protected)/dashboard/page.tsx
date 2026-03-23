import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './dashboard.module.css';

function formatNumber(value: number) {
    return new Intl.NumberFormat('uz-UZ').format(value);
}

export default async function DashboardPage() {
    const now = new Date();

    const [
        postsCount,
        publishedCount,
        draftCount,
        scheduledCount,
        viewsCount,
        videoCount,
        audioCount,
        categoryCount,
        bannerCount,
        userCount,
        recentPosts,
        topViewedPosts,
    ] = await Promise.all([
        prisma.post.count(),
        prisma.post.count({
            where: {
                published: true,
                createdAt: { lte: now },
            },
        }),
        prisma.post.count({
            where: {
                published: false,
            },
        }),
        prisma.post.count({
            where: {
                published: true,
                createdAt: { gt: now },
            },
        }),
        prisma.post.aggregate({
            _sum: { views: true },
        }),
        prisma.post.count({ where: { type: 'video' } }),
        prisma.post.count({ where: { type: 'audio' } }),
        prisma.category.count(),
        prisma.banner.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.post.findMany({
            take: 6,
            include: { category: true, author: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.post.findMany({
            take: 5,
            where: {
                published: true,
                createdAt: { lte: now },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                views: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        }),
    ]);

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div>
                    <h1 className={styles.header}>Boshqaruv Paneli</h1>
                    <p className={styles.subheader}>
                        Kontent oqimi, nashr holati va eng faol materiallar bo&apos;yicha tezkor ko&apos;rinish.
                    </p>
                </div>

                <div className={styles.quickLinks}>
                    <Link href="/admin/posts/new" className={styles.quickLink}>
                        Yangi material
                    </Link>
                    <Link href="/admin/settings/home" className={styles.quickLink}>
                        Bosh sahifa bloklari
                    </Link>
                    <Link href="/admin/banners" className={styles.quickLink}>
                        Bannerlar
                    </Link>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Jami materiallar</h3>
                    <p className={styles.number}>{formatNumber(postsCount)}</p>
                    <span className={styles.note}>{`${formatNumber(publishedCount)} ta e'lon qilingan`}</span>
                </div>

                <div className={styles.card}>
                    <h3>Jami ko&apos;rishlar</h3>
                    <p className={styles.number}>{formatNumber(viewsCount._sum.views || 0)}</p>
                    <span className={styles.note}>Umumiy trafik ko&apos;rsatkichi</span>
                </div>

                <div className={styles.card}>
                    <h3>Chernoviklar</h3>
                    <p className={styles.number}>{formatNumber(draftCount)}</p>
                    <span className={styles.note}>Tahrir kutayotgan materiallar</span>
                </div>

                <div className={styles.card}>
                    <h3>Rejalashtirilgan</h3>
                    <p className={styles.number}>{formatNumber(scheduledCount)}</p>
                    <span className={styles.note}>Kelajak sana bilan qo&apos;yilgan postlar</span>
                </div>
            </div>

            <div className={styles.secondaryGrid}>
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>Formatlar kesimi</h2>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={styles.miniStat}>
                            <span>Maqola</span>
                            <strong>{formatNumber(postsCount - videoCount - audioCount)}</strong>
                        </div>
                        <div className={styles.miniStat}>
                            <span>Video</span>
                            <strong>{formatNumber(videoCount)}</strong>
                        </div>
                        <div className={styles.miniStat}>
                            <span>Audio</span>
                            <strong>{formatNumber(audioCount)}</strong>
                        </div>
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>Tizim holati</h2>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={styles.miniStat}>
                            <span>Kategoriya</span>
                            <strong>{formatNumber(categoryCount)}</strong>
                        </div>
                        <div className={styles.miniStat}>
                            <span>Aktiv banner</span>
                            <strong>{formatNumber(bannerCount)}</strong>
                        </div>
                        <div className={styles.miniStat}>
                            <span>Foydalanuvchi</span>
                            <strong>{formatNumber(userCount)}</strong>
                        </div>
                    </div>
                </section>
            </div>

            <div className={styles.contentGrid}>
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>So&apos;nggi materiallar</h2>
                        <Link href="/admin/posts" className={styles.panelLink}>
                            Barchasini ko&apos;rish
                        </Link>
                    </div>

                    <div className={styles.tableLike}>
                        {recentPosts.map((post) => {
                            const status =
                                !post.published ? 'Chernovik' : post.createdAt > now ? 'Rejalashtirilgan' : 'E`lon qilingan';

                            return (
                                <div key={post.id} className={styles.row}>
                                    <div className={styles.rowMain}>
                                        <Link href={`/admin/posts/${post.id}`} className={styles.rowTitle}>
                                            {post.title}
                                        </Link>
                                        <span className={styles.rowMeta}>
                                            {`${post.category?.name || 'Umumiy'} | ${post.author?.name || 'Admin'}`}
                                        </span>
                                    </div>
                                    <div className={styles.rowSide}>
                                        <span className={styles.badge}>{status}</span>
                                        <span className={styles.rowDate}>
                                            {new Date(post.createdAt).toLocaleDateString('uz-UZ')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>Top ko&apos;rilganlar</h2>
                    </div>

                    <div className={styles.rankedList}>
                        {topViewedPosts.map((post, index) => (
                            <Link key={post.id} href={`/post/${post.slug}`} className={styles.rankItem}>
                                <span className={styles.rankNumber}>{index + 1}</span>
                                <div className={styles.rankBody}>
                                    <span className={styles.rankTitle}>{post.title}</span>
                                    <span className={styles.rankMeta}>
                                        {`${post.category?.name || 'Umumiy'} | ${formatNumber(post.views)} ko'rish`}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
