'use client';

import { useState } from 'react';
import { Calendar, Clock, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { updatePost } from '@/actions/post';
import FileBrowser from './FileBrowser';
import FileUpload from './FileUpload';
import styles from './PostForm.module.css';

type PostType = 'standard' | 'audio' | 'video';
type MediaType = 'url' | 'upload' | 'nas';
type PublishStatus = 'published' | 'draft' | 'scheduled';

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    type: string;
    thumbnail: string | null;
    videoUrl: string | null;
    categoryId: string | null;
    createdAt: Date | string;
    published: boolean;
}

interface Props {
    post: Post;
    categories: Category[];
}

const AUDIO_SECTION_ID = 'cml6ifrsm0004g1iirlq11tn9';

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function EditPostForm({ post, categories }: Props) {
    const [title, setTitle] = useState(post.title);
    const [slug, setSlug] = useState(post.slug);
    const [isSlugTouched, setIsSlugTouched] = useState(false);
    const [postType, setPostType] = useState<PostType>(post.type === 'audio' || post.type === 'video' ? post.type : 'standard');
    const [mediaType, setMediaType] = useState<MediaType>('url');
    const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnail || '');
    const [videoUrl, setVideoUrl] = useState(post.videoUrl || '');
    const [nasVideoPath, setNasVideoPath] = useState('');
    const [showBrowser, setShowBrowser] = useState(false);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>(
        !post.published ? 'draft' : new Date(post.createdAt) > new Date() ? 'scheduled' : 'published'
    );

    const updateAction = updatePost.bind(null, post.id);
    const effectiveMediaUrl = mediaType === 'url' ? videoUrl : nasVideoPath;
    const audioCategories = categories.filter((category) => category.parentId === AUDIO_SECTION_ID);

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-white, #fff)' }}>
                Maqolani Tahrirlash
            </h1>
            <form action={updateAction} className={styles.form}>
                <input type="hidden" name="type" value={postType} />
                <input type="hidden" name="thumbnail" value={thumbnailUrl} />
                <input type="hidden" name="videoUrl" value={effectiveMediaUrl} />
                <input type="hidden" name="published" value={publishStatus === 'draft' ? 'false' : 'true'} />

                <div className={styles.field}>
                    <label>Sarlavha (Nomi)</label>
                    <input
                        type="text"
                        name="title"
                        required
                        className={styles.input}
                        value={title}
                        onChange={(event) => {
                            const nextTitle = event.target.value;
                            setTitle(nextTitle);

                            if (!isSlugTouched) {
                                setSlug(slugify(nextTitle));
                            }
                        }}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>Slug (SEO URL)</label>
                        <input
                            type="text"
                            name="slug"
                            className={styles.input}
                            value={slug}
                            onChange={(event) => {
                                setIsSlugTouched(true);
                                setSlug(slugify(event.target.value));
                            }}
                        />
                        <span className={styles.fieldHint}>{"Slugni o'zgartirsangiz eski havolalar almashadi."}</span>
                    </div>

                    <div className={styles.field}>
                        <label>Qisqa izoh (Excerpt)</label>
                        <input type="text" name="excerpt" className={styles.input} defaultValue={post.excerpt || ''} />
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>
                            <Calendar size={14} /> Vaqti (Sana)
                        </label>
                        <input
                            type="date"
                            name="createdAt"
                            className={styles.input}
                            defaultValue={new Date(post.createdAt).toISOString().slice(0, 10)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Nashr holati</label>
                        <select
                            className={styles.select}
                            value={publishStatus}
                            onChange={(event) => setPublishStatus(event.target.value as PublishStatus)}
                        >
                            <option value="published">{"Hozir e'lon qilish"}</option>
                            <option value="draft">Chernovik</option>
                            <option value="scheduled">Rejalashtirish</option>
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>Kategoriya</label>
                        <select name="categoryId" className={styles.select} defaultValue={post.categoryId || ''}>
                            <option value="">Tanlang...</option>
                            {(postType === 'audio' ? audioCategories : categories).map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field} style={{ display: post.type === 'audio' ? 'none' : 'block' }}>
                        <label>Material Turi</label>
                        <div className={styles.typeGrid}>
                            <button
                                type="button"
                                onClick={() => setPostType('standard')}
                                className={`${styles.typeBtn} ${postType === 'standard' ? styles.activeType : ''}`}
                            >
                                <FileText size={16} /> Maqola
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('audio')}
                                className={`${styles.typeBtn} ${postType === 'audio' ? styles.activeType : ''}`}
                            >
                                <Clock size={16} /> Audio
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('video')}
                                className={`${styles.typeBtn} ${postType === 'video' ? styles.activeType : ''}`}
                            >
                                <Video size={16} /> Video
                            </button>
                        </div>
                    </div>
                </div>

                {postType !== 'audio' && (
                    <div className={styles.field}>
                        <label>
                            <ImageIcon size={14} /> Asosiy Rasm
                        </label>
                        <FileUpload
                            label="Rasm yuklash"
                            onUploadComplete={(url) => setThumbnailUrl(url)}
                            initialValue={post.thumbnail || ''}
                        />
                    </div>
                )}

                {(postType === 'audio' || postType === 'video') && (
                    <div className={styles.mediaSourceSection}>
                        <label>Media Manbai</label>
                        <div className={styles.tabs}>
                            <button type="button" onClick={() => setMediaType('url')} className={mediaType === 'url' ? styles.activeTab : ''}>
                                {postType === 'audio' ? 'SoundCloud Link' : 'Link / YouTube'}
                            </button>
                            <button type="button" onClick={() => setMediaType('nas')} className={mediaType === 'nas' ? styles.activeTab : ''}>
                                NAS Server
                            </button>
                            <button
                                type="button"
                                onClick={() => setMediaType('upload')}
                                className={mediaType === 'upload' ? styles.activeTab : ''}
                            >
                                Yuklash
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {mediaType === 'url' && (
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(event) => setVideoUrl(event.target.value)}
                                    placeholder={postType === 'audio' ? 'SoundCloud havolasi...' : 'YouTube havolasi...'}
                                    className={styles.input}
                                />
                            )}
                            {mediaType === 'nas' && (
                                <div className={styles.nasInput}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={nasVideoPath}
                                        placeholder="Fayl tanlanmagan"
                                        className={styles.input}
                                    />
                                    <button type="button" onClick={() => setShowBrowser(true)}>
                                        Tanlash
                                    </button>
                                </div>
                            )}
                            {mediaType === 'upload' && (
                                <FileUpload
                                    label={`${postType === 'video' ? 'Video' : 'Audio'} yuklash`}
                                    accept={postType === 'video' ? 'video/*' : 'audio/*'}
                                    onUploadComplete={(url) => setNasVideoPath(url)}
                                    initialValue={post.videoUrl || ''}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.field}>
                    <label>Matn (Content)</label>
                    <textarea name="content" rows={5} className={styles.textarea} defaultValue={post.content || ''} />
                </div>

                {publishStatus === 'scheduled' && (
                    <p className={styles.scheduleHint}>
                        {"Rejalashtirilgan post uchun sanani kelajak kuniga o'zgartiring."}
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => (window.location.href = '/admin/posts')}>
                        Bekor qilish
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                        Yangilash
                    </button>
                </div>

                {showBrowser && (
                    <FileBrowser
                        isOpen={showBrowser}
                        onClose={() => setShowBrowser(false)}
                        onSelect={(path) => {
                            setNasVideoPath(path);
                            setShowBrowser(false);
                        }}
                    />
                )}
            </form>
        </div>
    );
}
