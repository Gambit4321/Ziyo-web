'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import styles from './form.module.css';

interface Category {
    id: string;
    name: string;
}

interface NewPostFormProps {
    categories: Category[];
}

export default function NewPostForm({ categories }: NewPostFormProps) {
    const router = useRouter();
    const [thumbnail, setThumbnail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('thumbnail', thumbnail);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Saqlashda xatolik');
            }

            router.push('/admin/posts');
            router.refresh();
        } catch (error) {
            alert('Xatolik yuz berdi');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
                <div className={styles.col}>
                    <div className={styles.field}>
                        <label>Sarlavha</label>
                        <input type="text" name="title" required className={styles.input} />
                    </div>

                    <div className={styles.field}>
                        <label>Kategoriya</label>
                        <select name="categoryId" className={styles.select}>
                            <option value="">Tanlang...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Turi</label>
                        <select name="type" className={styles.select} defaultValue="standard">
                            <option value="standard">Maqola (Standard)</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>
                </div>

                <div className={styles.col}>
                    <ImageUpload value={thumbnail} onChange={setThumbnail} label="Thumbnail Rasm" />

                    <div className={styles.field}>
                        <label>Video URL (Agar video bo'lsa)</label>
                        <input
                            type="url"
                            name="videoUrl"
                            placeholder="https://youtube.com/..."
                            className={styles.input}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.field}>
                <label>Matn (Content)</label>
                <textarea name="content" rows={10} className={styles.textarea}></textarea>
            </div>

            <div className={styles.actions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>
        </form>
    );
}
