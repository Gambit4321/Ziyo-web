import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import styles from './Sidebar.module.css';

interface Props {
    categoryId?: string;
}

export default async function Sidebar({ categoryId }: Props) {
    const whereClause: any = categoryId ? { categoryId } : {
        NOT: {
            category: {
                slug: { in: ['audio', 'audiomahsulotlar', 'suhbatlar'] } // Add audio slugs here
            }
        }
    };

    const topPosts = await prisma.post.findMany({
        where: {
            ...whereClause,
            published: true,
            createdAt: { lte: new Date() }
        },
        take: 5,
        orderBy: { views: 'desc' },
        include: { category: true }
    });

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.title}>
                    {categoryId ? "Bo'limda eng ko'p ko'rilganlar" : "Eng ko'p ko'rilganlar"}
                </h3>
            </div>

            <div className={styles.list}>
                {topPosts.map((post, index) => (
                    <Link key={post.id} href={`/post/${post.slug}`} className={styles.item}>
                        <span className={styles.number}>{index + 1}</span>
                        <div className={styles.info}>
                            <h4 className={styles.postTitle}>{post.title}</h4>
                            <span className={styles.cat}>{post.category?.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
