import { prisma } from '@/lib/prisma';
import styles from './form.module.css';
import PostForm from '@/components/admin/PostForm';

interface Props {
    searchParams: Promise<{ type?: string }>;
}

export default async function NewPostPage({ searchParams }: Props) {
    const { type } = await searchParams;
    const categories = await prisma.category.findMany();

    // Separate Sections (Parents) and Sub-categories
    const sections = categories.filter(c => c.parentId === null);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Yangi material qo'shish</h1>
            <PostForm
                sections={sections}
                categories={categories}
                initialType={type || 'standard'}
            />
        </div>
    );
}


