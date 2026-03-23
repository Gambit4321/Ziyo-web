'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Rasm yuklash' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || '');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Faqat rasm fayllari qabul qilinadi');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Fayl hajmi 5MB dan oshmasligi kerak');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Yuklashda xatolik');
            }

            const data = await response.json();
            setPreview(data.url);
            onChange(data.url);
        } catch (err: any) {
            setError(err.message || 'Yuklashda xatolik');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={styles.container}>
            <label className={styles.label}>{label}</label>

            {preview ? (
                <div className={styles.preview}>
                    <img src={preview} alt="Preview" className={styles.previewImage} />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className={styles.removeBtn}
                        aria-label="Remove image"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div className={styles.uploadArea}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        disabled={uploading}
                    />
                    <div className={styles.uploadContent}>
                        {uploading ? (
                            <>
                                <div className={styles.spinner} />
                                <p>Yuklanmoqda...</p>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={48} className={styles.uploadIcon} />
                                <p className={styles.uploadText}>
                                    Rasmni tanlash uchun bosing yoki sudrab olib keling
                                </p>
                                <p className={styles.uploadHint}>PNG, JPG, WebP, GIF (max 5MB)</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}
