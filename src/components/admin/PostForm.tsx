'use client';

import { useState } from 'react';
import { Calendar, Check, ChevronRight, Clock, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { createPost } from '@/actions/post';
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

interface Props {
    sections: Category[];
    categories: Category[];
    initialType?: string;
}

const AUDIO_SECTION_ID = 'cml6ifrsm0004g1iirlq11tn9';

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function PostForm({ sections, categories, initialType = 'standard' }: Props) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [isSlugTouched, setIsSlugTouched] = useState(false);
    const [selectedSection, setSelectedSection] = useState('');
    const [postType, setPostType] = useState<PostType>(
        initialType === 'audio' || initialType === 'video' ? initialType : 'standard'
    );
    const [mediaType, setMediaType] = useState<MediaType>('url');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [nasVideoPath, setNasVideoPath] = useState('');
    const [showBrowser, setShowBrowser] = useState(false);
    const [step, setStep] = useState(1);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>('published');

    const filteredCategories = categories.filter((category) => category.parentId === selectedSection);
    const audioCategories = categories.filter((category) => category.parentId === AUDIO_SECTION_ID);
    const effectiveMediaUrl = mediaType === 'url' ? mediaUrl : nasVideoPath;

    return (
        <form action={createPost} className={styles.form}>
            <div className={styles.steps}>
                <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ''}`}>{"1. Ma'lumotlar"}</div>
                <div className={styles.stepDivider}></div>
                <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ''}`}>2. Nashr holati</div>
            </div>

            <input type="hidden" name="type" value={postType} />
            <input type="hidden" name="published" value={publishStatus === 'draft' ? 'false' : 'true'} />
            <input type="hidden" name="thumbnail" value={thumbnailUrl} />
            <input type="hidden" name="videoUrl" value={effectiveMediaUrl} />

            <div className={styles.stepContent} style={{ display: step === 1 ? 'block' : 'none' }}>
                <div className={styles.field}>
                    <label>Sarlavha (Nomi)</label>
                    <input
                        type="text"
                        name="title"
                        required
                        className={styles.input}
                        placeholder="Material nomini kiriting..."
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
                            placeholder="masalan: ziyo-haqida-maxsus-maqola"
                            value={slug}
                            onChange={(event) => {
                                setIsSlugTouched(true);
                                setSlug(slugify(event.target.value));
                            }}
                        />
                        <span className={styles.fieldHint}>{"Agar bo'sh qoldirsangiz, slug sarlavhadan avtomatik olinadi."}</span>
                    </div>
                    <div className={styles.field}>
                        <label>Qisqa izoh (Excerpt)</label>
                        <input type="text" name="excerpt" className={styles.input} placeholder="Kartalarda va SEO description uchun qisqa matn" />
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
                            defaultValue={new Date().toISOString().slice(0, 10)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>
                            <Clock size={14} /> Davomiyligi (daq:soniya)
                        </label>
                        <input type="text" name="videoDuration" className={styles.input} placeholder="05:30" />
                    </div>
                </div>

                <div className={styles.row} style={{ display: postType === 'audio' ? 'none' : 'flex' }}>
                    <div className={styles.field}>
                        <label>{"Bo'lim (Section)"}</label>
                        <select
                            name="sectionId"
                            className={styles.select}
                            value={postType === 'audio' ? AUDIO_SECTION_ID : selectedSection}
                            onChange={(event) => setSelectedSection(event.target.value)}
                            required={postType !== 'audio'}
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
                            disabled={postType !== 'audio' && !selectedSection}
                        >
                            <option value="">Tanlang...</option>
                            {(postType === 'audio' ? audioCategories : filteredCategories).map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    {postType !== 'audio' && (
                        <div className={styles.field} style={{ flex: 1 }}>
                            <label>
                                <ImageIcon size={14} /> Asosiy Rasm
                            </label>
                            <FileUpload label="Rasm yuklash" onUploadComplete={(url) => setThumbnailUrl(url)} />
                        </div>
                    )}

                    <div className={styles.field} style={{ flex: 1, display: initialType === 'audio' ? 'none' : 'block' }}>
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
                                    value={mediaUrl}
                                    onChange={(event) => setMediaUrl(event.target.value)}
                                    placeholder={postType === 'audio' ? 'SoundCloud havolasi...' : 'YouTube havolasi...'}
                                    className={styles.input}
                                    required
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
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.field}>
                    <label>Matn (Content)</label>
                    <textarea name="content" rows={10} className={styles.textarea}></textarea>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.nextBtn} onClick={() => setStep(2)}>
                        Davom etish <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.stepContent} style={{ display: step === 2 ? 'block' : 'none' }}>
                <h2>Nashr Holati</h2>
                <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>{"Materialni saytda qanday ko'rsatishni tanlang."}</p>

                <div className={styles.statusOptions}>
                    <div
                        className={`${styles.statusOption} ${publishStatus === 'published' ? styles.activeStatus : ''}`}
                        onClick={() => setPublishStatus('published')}
                    >
                        <div className={styles.radio}>{publishStatus === 'published' && <div className={styles.radioDot}></div>}</div>
                        <div>
                            <h4>{"Hozir e'lon qilish"}</h4>
                            <p>{"Material darhol saytda ko'rinadi."}</p>
                        </div>
                    </div>

                    <div
                        className={`${styles.statusOption} ${publishStatus === 'draft' ? styles.activeStatus : ''}`}
                        onClick={() => setPublishStatus('draft')}
                    >
                        <div className={styles.radio}>{publishStatus === 'draft' && <div className={styles.radioDot}></div>}</div>
                        <div>
                            <h4>Chernovik (Qoralama)</h4>
                            <p>{"Faqat adminlar ko'ra oladi, saytda ko'rinmaydi."}</p>
                        </div>
                    </div>

                    <div
                        className={`${styles.statusOption} ${publishStatus === 'scheduled' ? styles.activeStatus : ''}`}
                        onClick={() => setPublishStatus('scheduled')}
                    >
                        <div className={styles.radio}>{publishStatus === 'scheduled' && <div className={styles.radioDot}></div>}</div>
                        <div>
                            <h4>Rejalashtirish</h4>
                            <p>{"Kelajak sanasini tanlasangiz, material o'sha kunda avtomatik ko'rina boshlaydi."}</p>
                        </div>
                    </div>
                </div>

                {publishStatus === 'scheduled' && (
                    <p className={styles.scheduleHint}>
                        {"Rejalashtirish uchun 1-bosqichdagi sana bugundan keyingi kun bo'lishi kerak."}
                    </p>
                )}

                <div className={styles.actions} style={{ justifyContent: 'space-between' }}>
                    <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                        Ortga
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                        <Check size={16} /> Saqlash va Tugatish
                    </button>
                </div>
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
    );
}
