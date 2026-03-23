import { prisma } from '@/lib/prisma';
import { createCategory } from '@/actions/category';
import CategoryDragList from '@/components/admin/CategoryDragList';
import styles from './categories.module.css';

export default async function CategoriesPage() {
    // Fetch all categories sorted by custom order
    // Order doesn't need to be globally sequential, just relative.
    const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
            _count: { select: { posts: true } },
            // Parent is not strictly needed since we have parentId, but good for debug
        }
    });

    // Potential parents for the "New Category" dropdown
    const parents = categories.filter(c => !c.parentId);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Kategoriyalar (Tartiblash)</h1>
            </div>

            <div className={styles.grid}>
                {/* Create Form */}
                <div className={styles.card}>
                    <h3>Yangi Kategoriya</h3>
                    <form action={createCategory} className={styles.form}>
                        <div className={styles.field}>
                            <label>Nomi</label>
                            <input type="text" name="name" required className={styles.input} placeholder="Masalan: Siyosat" />
                        </div>

                        <div className={styles.field}>
                            <label>Bo'limi (Ota kategoriya)</label>
                            <select name="parentId" className={styles.select}>
                                <option value="">- Asosiy Bo'lim (Mustaqil) -</option>
                                {parents.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Agar bu kategoriya boshqa bo'lim ichida bo'lsa, tanlang.
                            </p>
                        </div>

                        <button type="submit" className={styles.submitBtn}>Qo'shish</button>
                    </form>
                </div>

                {/* Drag-and-Drop List */}
                <div>
                    {/* We pass the full flat list. The component handles hierarchy logic. */}
                    <CategoryDragList categories={categories.map(c => ({
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        parentId: c.parentId,
                        order: c.order,
                        showInMenu: c.showInMenu,
                        image: c.image,
                        _count: c._count
                    }))} />
                </div>
            </div>
        </div>
    );
}
