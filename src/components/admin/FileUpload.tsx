'use client';

import { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';

interface FileUploadProps {
    onUploadComplete: (url: string) => void;
    label: string;
    accept?: string;
    initialValue?: string;
}

export default function FileUpload({ onUploadComplete, label, accept = "image/*", initialValue = '' }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialValue);
    const [error, setError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                // If not JSON, it's likely an Nginx error page (like 413 Request Entity Too Large)
                const text = await res.text();
                if (res.status === 413) {
                    throw new Error('Fayl hajmi juda katta (maksimal: 50MB)');
                }
                throw new Error(`Server xatosi: ${res.status} ${res.statusText}`);
            }

            if (data.success) {
                setPreview(data.url);
                onUploadComplete(data.url);
            } else {
                setError('Yuklashda xatolik: ' + (data.error || data.message || 'Nomaʼlum xatolik'));
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Serverga ulanishda xatolik');
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setPreview('');
        onUploadComplete('');
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 1 auto', width: '100%', maxWidth: '500px' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    {!preview ? (
                        <label style={{
                            display: 'block',
                            padding: '0.75rem',
                            border: '2px dashed #374151',
                            borderRadius: '0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: uploading ? '#1f2937' : 'transparent'
                        }}>
                            <input
                                type="file"
                                accept={accept}
                                onChange={handleFileChange}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                            <Upload size={32} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#9ca3af' }} />
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>
                                {uploading ? 'Yuklanmoqda...' : label || 'Faylni tanlang yoki bu yerga tashlang'}
                            </p>
                        </label>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            background: '#1f2937',
                            borderRadius: '0.5rem',
                            border: '1px solid #374151'
                        }}>
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', color: '#c6a866' }}>
                                <a href={preview} target="_blank" rel="noopener noreferrer">{preview}</a>
                            </div>
                            <button
                                type="button"
                                onClick={clearFile}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
                </div>
            </div>
            {preview && accept.startsWith('image') && (
                <div style={{ flexShrink: 0 }}>
                    <img src={preview} alt="Preview" style={{ maxHeight: '80px', borderRadius: '0.5rem', border: '1px solid #374151' }} />
                </div>
            )}
            {preview && accept.startsWith('video') && (
                <div style={{ flexShrink: 0 }}>
                    <video src={preview} controls style={{ maxHeight: '120px', borderRadius: '0.5rem', border: '1px solid #374151', maxWidth: '200px' }} />
                </div>
            )}
        </div>
    );
}
