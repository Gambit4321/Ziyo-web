import Link from 'next/link';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import styles from './CategoryGrid.module.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    _count?: { posts: number };
}

interface Props {
    categories: Category[];
}

export default function CategoryGrid({ categories }: Props) {
    return (
        <div className={styles.grid}>
            {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`} className={styles.card}>
                    <div className={styles.imageWrapper}>
                        {category.image ? (
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className={styles.image}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className={styles.placeholder}>
                                <ImageIcon size={48} className={styles.icon} />
                            </div>
                        )}
                    </div>
                    <div className={styles.content}>
                        <h3 className={styles.name}>{category.name}</h3>
                        {category._count && (
                            <span className={styles.count}>{category._count.posts} ta maqola</span>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}
