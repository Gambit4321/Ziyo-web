import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styles from './posts.module.css';
import { deletePost } from '@/actions/post';
import SafeImage from '@/components/SafeImage';

export default async function AdminPostsPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; q?: string; status?: string }>;
}) {
    const { type, q, status } = await searchParams;
    const filterType = type || undefined;
    const query = q?.trim() || '';
    const now = new Date();

    // Determine title
    let pageTitle = 'Barcha Materiallar';
    if (type === 'standard') pageTitle = 'Maqolalar';
    if (type === 'audio') pageTitle = 'Audiomaxsulotlar';
    if (type === 'video') pageTitle = 'Videolar';

    const where = {
        ...(filterType ? { type: filterType } : {}),
        ...(query
            ? {
                  OR: [
                      { title: { contains: query } },
                      { slug: { contains: query } },
                      { excerpt: { contains: query } },
                  ],
              }
            : {}),
        ...(status === 'draft'
            ? { published: false }
            : status === 'scheduled'
                ? { published: true, createdAt: { gt: now } }
                : status === 'published'
                    ? { published: true, createdAt: { lte: now } }
                    : {}),
    };

    const posts = await prisma.post.findMany({
        where,
        include: { category: true, author: true },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{pageTitle}</h1>
                <Link href={`/admin/posts/new${type ? `?type=${type}` : ''}`} className={styles.createBtn}>
                    <Plus size={20} />
                    {"Yangi qo'shish"}
                </Link>
            </div>

            <form className={styles.filters} method="get">
                {type && <input type="hidden" name="type" value={type} />}
                <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="Sarlavha, slug yoki excerpt bo'yicha qidirish"
                    className={styles.searchInput}
                />
                <select name="status" defaultValue={status || ''} className={styles.filterSelect}>
                    <option value="">Barcha statuslar</option>
                    <option value="published">E&apos;lon qilingan</option>
                    <option value="scheduled">Rejalashtirilgan</option>
                    <option value="draft">Chernovik</option>
                </select>
                <button type="submit" className={styles.filterBtn}>Filtrlash</button>
            </form>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '90px' }}>Rasm</th>
                            <th style={{ width: '30%' }}>Nomi</th>
                            <th style={{ width: '15%' }}>Muallif</th>
                            <th style={{ width: '15%' }}>Status</th>
                            <th style={{ width: '15%' }}>Sana</th>
                            <th style={{ width: '100px' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post.id}>
                                <td>
                                    {post.thumbnail ? (
                                        <div className={styles.thumbnailWrapper}>
                                            <SafeImage
                                                src={post.thumbnail}
                                                alt=""
                                                className={styles.thumbnail}
                                                fallbackSrc="/images/placeholder.jpg"
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.noThumbnail}>No Img</div>
                                    )}
                                </td>
                                <td className={styles.titleCell}>
                                    <div className={styles.postInfo}>
                                        <span className={styles.postTitle}>{post.title}</span>
                                        <span className={styles.postSlug}>{`${post.category?.name || 'Umumiy'} | /${post.slug}`}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.authorWrapper}>
                                        <span>{post.author?.name || 'Admin'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className={`${styles.statusBadge} ${
                                            !post.published ? styles.draft : post.createdAt > now ? styles.scheduled : styles.published
                                        }`}
                                    >
                                        {!post.published ? 'Chernovik' : post.createdAt > now ? 'Rejalashtirilgan' : "E'lon qilingan"}
                                    </span>
                                </td>
                                <td>{new Date(post.createdAt).toLocaleDateString('uz-UZ')}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <Link href={`/admin/posts/${post.id}`} className={styles.iconBtn} title="Tahrirlash">
                                            <Edit size={18} />
                                        </Link>
                                        <form action={deletePost.bind(null, post.id)}>
                                            <button
                                                type="submit"
                                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                title="O'chirish"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {posts.length === 0 && (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>
                                    Materiallar topilmadi.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
