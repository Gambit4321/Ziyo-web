'use client';

import { createBanner, updateBanner } from '@/actions/banner';
import { searchPosts } from '@/actions/post';
import FileUpload from '@/components/admin/FileUpload';
import { useState, useEffect, useTransition } from 'react';
import styles from '@/components/admin/PostForm.module.css';
import { Search, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BannerFormProps {
    initialData?: {
        id: string;
        title: string;
        topText: string | null;
        tagline: string | null;
        image: string;
        link: string | null;
        buttonText: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date | string;
    };
    categories?: { id: string; name: string; slug: string }[];
}

export default function BannerForm({ initialData, categories }: BannerFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [imageUrl, setImageUrl] = useState(initialData?.image || '');
    const [linkType, setLinkType] = useState<'external' | 'post' | 'category'>('post');
    const [publishStatus, setPublishStatus] = useState<'active' | 'scheduled' | 'draft'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedLink, setSelectedLink] = useState(initialData?.link || '');

    // Initialize publish status
    useEffect(() => {
        if (initialData) {
            if (!initialData.isActive) {
                setPublishStatus('draft');
            } else if (new Date(initialData.createdAt) > new Date()) {
                setPublishStatus('scheduled');
            } else {
                setPublishStatus('active');
            }
        }
    }, [initialData]);

    // Determine initial link type based on existing link
    useEffect(() => {
        if (initialData?.link) {
            if (initialData.link.startsWith('/post/')) {
                setLinkType('post');
                // We'll just show the link value for now, as we don't have the post title readily available without fetching
                // Ideally we'd fetch the post title here if we had the ID or slug
            } else if (initialData.link.startsWith('/category/')) {
                setLinkType('category');
            } else {
                setLinkType('external');
            }
        }
    }, [initialData]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                const results = await searchPosts(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectPost = (post: any) => {
        setSelectedLink(`/post/${post.slug}`);
        setSearchQuery(post.title); // Show title in search box
        setSearchResults([]); // Hide dropdown
    };

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateBanner(initialData.id, formData);
                } else {
                    await createBanner(formData);
                }
                // Redirect is handled in action, but we can double check or show toast here
            } catch (error: any) {
                if (error.message === 'NEXT_REDIRECT') {
                    // This is expected behavior for redirects in server actions
                    return;
                }
                console.error("Banner save error:", error);
                alert("Xatolik yuz berdi: " + (error.message || "Noma'lum xatolik"));
            }
        });
    };

    return (
        <form action={handleSubmit} className={styles.form}>
            <div className={styles.field}>
                <label>Tepa Yozuv (Top Text)</label>
                <input
                    type="text"
                    name="topText"
                    className={styles.input}
                    placeholder="Masalan: Yangi loyiha"
                    defaultValue={initialData?.topText || ''}
                />
            </div>

            <div className={styles.field}>
                <label>Asosiy Sarlavha (Main Title)</label>
                <input
                    type="text"
                    name="title"
                    required
                    className={styles.input}
                    placeholder="Banner asosiy matni..."
                    defaultValue={initialData?.title || ''}
                />
            </div>

            <div className={styles.field}>
                <label>Tagline / Ostki Yozuv</label>
                <input
                    type="text"
                    name="tagline"
                    className={styles.input}
                    placeholder="Qisqacha izoh..."
                    defaultValue={initialData?.tagline || ''}
                />
            </div>

            <div className={styles.field}>
                <label>Tugma Matni (Button Text)</label>
                <input
                    type="text"
                    name="buttonText"
                    className={styles.input}
                    placeholder="Batafsil..."
                    defaultValue={initialData?.buttonText || ''}
                />
            </div>

            <div className={styles.field}>
                <label>Rasm</label>
                <FileUpload
                    label="Banner rasmini yuklash (1920x600 tavsiya etiladi)"
                    onUploadComplete={(url) => setImageUrl(url)}
                    initialValue={imageUrl}
                />
                <input type="hidden" name="image" value={imageUrl} required />
            </div>

            <div className={styles.field} style={{ marginBottom: '2rem' }}>
                <label>Havola (Link)</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => { setLinkType('post'); setSearchResults([]); }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: linkType === 'post' ? '#c6a866' : '#1f2937',
                            color: linkType === 'post' ? '#000' : '#fff',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <FileText size={16} /> Maqola
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLinkType('category'); }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: linkType === 'category' ? '#c6a866' : '#1f2937',
                            color: linkType === 'category' ? '#000' : '#fff',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <LinkIcon size={16} /> Kategoriya
                    </button>
                    <button
                        type="button"
                        onClick={() => setLinkType('external')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: linkType === 'external' ? '#c6a866' : '#1f2937',
                            color: linkType === 'external' ? '#000' : '#fff',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <LinkIcon size={16} /> Tashqi Link
                    </button>
                </div>

                {linkType === 'post' && (
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: '#9ca3af' }} />
                            <input
                                type="text"
                                className={styles.input}
                                style={{ paddingLeft: '35px' }}
                                placeholder="Maqola nomini yozing..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: '#1f2937', border: '1px solid #374151',
                                zIndex: 10, borderRadius: '6px', maxHeight: '200px', overflowY: 'auto',
                                marginTop: '4px'
                            }}>
                                {searchResults.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => handleSelectPost(post)}
                                        style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #374151' }}
                                        className="hover:bg-gray-700"
                                    >
                                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>{post.title}</div>
                                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>/post/{post.slug}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input type="hidden" name="link" value={selectedLink} />
                        {selectedLink && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Tanlangan:</span>
                                <span style={{ background: '#374151', padding: '2px 8px', borderRadius: '4px' }}>{selectedLink}</span>
                            </div>
                        )}
                    </div>
                )}

                {linkType === 'category' && (
                    <div>
                        <select
                            className={styles.select}
                            onChange={(e) => setSelectedLink(`/category/${e.target.value}`)}
                            value={selectedLink.replace('/category/', '')}
                        >
                            <option value="">Kategoriya tanlang...</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>
                        <input type="hidden" name="link" value={selectedLink} />
                    </div>
                )}

                {linkType === 'external' && (
                    <input
                        type="text"
                        name="link"
                        className={styles.input}
                        placeholder="https://example.com"
                        value={selectedLink}
                        onChange={(e) => setSelectedLink(e.target.value)}
                    />
                )}
            </div>

            <div className={styles.field}>
                <label>Tavsif - ixtiyoriy</label>
                <textarea
                    name="description"
                    rows={3}
                    className={styles.textarea}
                    defaultValue={initialData?.description || ''}
                ></textarea>
            </div>

            {/* Publish Status Section */}
            <div className={styles.field} style={{ marginTop: '2rem', padding: '1.5rem', background: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
                <label style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'block' }}>Nashr Holati</label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Active */}
                    <div
                        onClick={() => {
                            setPublishStatus('active');
                            // Reset date to now if switching to active, unless it was already scheduled in future? 
                            // Actually, 'active' means 'now'.
                        }}
                        style={{
                            padding: '1rem',
                            border: `2px solid ${publishStatus === 'active' ? '#c6a866' : '#374151'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: publishStatus === 'active' ? 'rgba(198, 168, 102, 0.1)' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: `2px solid ${publishStatus === 'active' ? '#c6a866' : '#6b7280'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {publishStatus === 'active' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c6a866' }}></div>}
                            </div>
                            <span style={{ fontWeight: 'bold', color: publishStatus === 'active' ? '#c6a866' : '#fff' }}>Hoziroq e'lon qilish</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, paddingLeft: '1.5rem' }}>
                            Banner darhol saytda ko'rinadi.
                        </p>
                    </div>

                    {/* Scheduled */}
                    <div
                        onClick={() => setPublishStatus('scheduled')}
                        style={{
                            padding: '1rem',
                            border: `2px solid ${publishStatus === 'scheduled' ? '#c6a866' : '#374151'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: publishStatus === 'scheduled' ? 'rgba(198, 168, 102, 0.1)' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: `2px solid ${publishStatus === 'scheduled' ? '#c6a866' : '#6b7280'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {publishStatus === 'scheduled' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c6a866' }}></div>}
                            </div>
                            <span style={{ fontWeight: 'bold', color: publishStatus === 'scheduled' ? '#c6a866' : '#fff' }}>Rejalashtirish</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, paddingLeft: '1.5rem' }}>
                            Belgilangan vaqtda paydo bo'ladi.
                        </p>
                    </div>

                    {/* Draft */}
                    <div
                        onClick={() => setPublishStatus('draft')}
                        style={{
                            padding: '1rem',
                            border: `2px solid ${publishStatus === 'draft' ? '#c6a866' : '#374151'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: publishStatus === 'draft' ? 'rgba(198, 168, 102, 0.1)' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: `2px solid ${publishStatus === 'draft' ? '#c6a866' : '#6b7280'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {publishStatus === 'draft' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c6a866' }}></div>}
                            </div>
                            <span style={{ fontWeight: 'bold', color: publishStatus === 'draft' ? '#c6a866' : '#fff' }}>Chernovik</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, paddingLeft: '1.5rem' }}>
                            Saytda ko'rinmaydi, faqat adminda saqlanadi.
                        </p>
                    </div>
                </div>

                {/* Date Picker - Only visible if Scheduled is selected */}
                {publishStatus === 'scheduled' && (
                    <div style={{ marginTop: '1.5rem', paddingLeft: '0.5rem', animation: 'fadeIn 0.3s' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Boshlanish vaqti:</label>
                        <input
                            type="datetime-local"
                            name="createdAt" // This will override the hidden input below if present
                            className={styles.input}
                            style={{ maxWidth: '300px' }}
                            defaultValue={initialData?.createdAt ? new Date(initialData.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                            required={publishStatus === 'scheduled'}
                        />
                    </div>
                )}
            </div>

            {/* Hidden inputs to send correct data based on status */}
            {/* If Draft, isActive=false. If Active/Scheduled, isActive=true */}
            <input type="hidden" name="isActive" value={publishStatus === 'draft' ? 'false' : 'on'} />

            {/* If Active or Draft, we typically use 'now' (or preserve existing if editing?), 
                but for 'Active' newly creating, we want 'now'. 
                For 'Scheduled', the visible input above takes precedence. 
                For 'Draft', date doesn't strictly matter for visibility, but good to keep.
            */}
            {publishStatus !== 'scheduled' && (
                <input
                    type="hidden"
                    name="createdAt"
                    value={
                        // If editing and we are keeping it active/draft, maybe keep original date? 
                        // But user said "Active" = "Publish Now". So maybe update to Now?
                        // Let's safe bet: If switching to Active, set to Now. 
                        // If Draft, keep as is or Now.
                        // Actually, 'createdAt' needs to be <= Now for Active.
                        // So let's just default to Now for non-scheduled.
                        new Date().toISOString()
                    }
                />
            )}

            <div className={styles.actions} style={{ marginTop: '2rem' }}>
                <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => router.push('/admin/banners')}
                >
                    Bekor qilish
                </button>
                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isPending ? 0.7 : 1 }}
                >
                    {isPending && <Loader2 size={18} className="animate-spin" />}
                    {initialData ? 'Yangilash' : 'Saqlash'}
                </button>
            </div>
        </form>
    );
}
