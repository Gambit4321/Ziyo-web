'use client';

import { useMemo, useState } from 'react';
import { Calendar, Clock, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { updatePost } from '@/actions/post';
import FileBrowser from './FileBrowser';
import FileUpload from './FileUpload';
import RichTextEditor from './RichTextEditor';
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
    videoDuration: string | null;
    categoryId: string | null;
    createdAt: Date | string;
    published: boolean;
    featured: boolean;
}

interface Props {
    post: Post;
    sections: Category[];
    categories: Category[];
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getInitialSectionId(categories: Category[], categoryId: string | null) {
    if (!categoryId) {
        return '';
    }

    const selectedCategory = categories.find((category) => category.id === categoryId);
    if (!selectedCategory) {
        return '';
    }

    return selectedCategory.parentId || selectedCategory.id;
}

export default function EditPostForm({ post, sections, categories }: Props) {
    const [title, setTitle] = useState(post.title);
    const [slug, setSlug] = useState(post.slug);
    const [isSlugTouched, setIsSlugTouched] = useState(false);
    const [postType, setPostType] = useState<PostType>(post.type === 'audio' || post.type === 'video' ? post.type : 'standard');
    const [selectedSection, setSelectedSection] = useState(getInitialSectionId(categories, post.categoryId));
    const [selectedCategory, setSelectedCategory] = useState(post.categoryId || '');
    const [mediaType, setMediaType] = useState<MediaType>('url');
    const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnail || '');
    const [videoUrl, setVideoUrl] = useState(post.videoUrl || '');
    const [nasVideoPath, setNasVideoPath] = useState('');
    const [showBrowser, setShowBrowser] = useState(false);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>(
        !post.published ? 'draft' : new Date(post.createdAt) > new Date() ? 'scheduled' : 'published'
    );
    const [isFeatured, setIsFeatured] = useState(post.featured);

    const updateAction = updatePost.bind(null, post.id);
    const effectiveMediaUrl = mediaType === 'url' ? videoUrl : nasVideoPath;
    const filteredCategories = useMemo(
        () => categories.filter((category) => category.parentId === selectedSection),
        [categories, selectedSection]
    );
    const effectiveSelectedCategory = filteredCategories.some((category) => category.id === selectedCategory) ? selectedCategory : '';

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

                <div className={styles.field}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            name="featured"
                            checked={isFeatured}
                            onChange={(event) => setIsFeatured(event.target.checked)}
                        />
                        <span>Muharrir tanloviga qo&apos;shish</span>
                    </label>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>{"Bo'lim (Section)"}</label>
                        <select
                            name="sectionId"
                            className={styles.select}
                            value={selectedSection}
                            onChange={(event) => {
                                setSelectedSection(event.target.value);
                                setSelectedCategory('');
                            }}
                            required
                        >
                            <option value="">Tanlang...</option>
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Kategoriya</label>
                        <select
                            name="categoryId"
                            className={styles.select}
                            value={effectiveSelectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                            disabled={!selectedSection}
                            required
                        >
                            <option value="">Tanlang...</option>
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.field}>
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
                                <div className={styles.field}>
                                    <input
                                        type="url"
                                        value={videoUrl}
                                        onChange={(event) => setVideoUrl(event.target.value)}
                                        placeholder={postType === 'audio' ? 'SoundCloud havolasi...' : 'YouTube havolasi...'}
                                        className={styles.input}
                                    />
                                </div>
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

                            <div className={styles.field} style={{ marginTop: '1rem' }}>
                                <label>
                                    <Clock size={14} /> Davomiyligi (daq:soniya)
                                </label>
                                <input
                                    type="text"
                                    name="videoDuration"
                                    className={styles.input}
                                    placeholder="05:30"
                                    defaultValue={post.videoDuration || ''}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.field}>
                    <label>Matn (Content)</label>
                    <RichTextEditor name="content" defaultValue={post.content || ''} />
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
