'use client';

import { useState, useEffect } from 'react';
import { Folder, FileVideo, ArrowLeft, Loader2, X, ChevronRight } from 'lucide-react';

interface FileItem {
    name: string;
    path: string;
    type: 'dir' | 'file';
    size: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
}

export default function FileBrowser({ isOpen, onClose, onSelect }: Props) {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [parentPath, setParentPath] = useState<string | null>(null);

    const loadPath = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/browse?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setItems(data.items);
            setCurrentPath(data.currentPath);
            setParentPath(data.parentPath);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadPath(''); // Load root
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#1f2937', width: '90%', maxWidth: '800px', height: '80%',
                borderRadius: '8px', display: 'flex', flexDirection: 'column',
                border: '1px solid #374151', color: 'white'
            }}>
                <div style={{
                    padding: '1rem', borderBottom: '1px solid #374151',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>Videoni tanlang</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        <X />
                    </button>
                </div>

                <div style={{ padding: '0.5rem 1rem', background: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => loadPath(parentPath || '')}
                        disabled={parentPath === null}
                        style={{ background: 'none', border: 'none', color: parentPath !== null ? '#c6a866' : '#4b5563', cursor: parentPath !== null ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                        title="Ortga"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#9ca3af', overflow: 'hidden' }}>
                        <span
                            onClick={() => loadPath('')}
                            style={{ cursor: 'pointer', color: currentPath === '' ? '#fff' : '#9ca3af', fontWeight: currentPath === '' ? 600 : 400 }}
                        >
                            Root
                        </span>
                        {currentPath.split('/').filter(Boolean).map((part, index, array) => {
                            const pathUntilNow = array.slice(0, index + 1).join('/');
                            return (
                                <span key={pathUntilNow} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <ChevronRight size={14} />
                                    <span
                                        onClick={() => loadPath(pathUntilNow)}
                                        style={{
                                            cursor: 'pointer',
                                            color: index === array.length - 1 ? '#fff' : '#9ca3af',
                                            fontWeight: index === array.length - 1 ? 600 : 400,
                                            maxWidth: '150px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {part}
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem', gap: '1rem' }}>
                            <Loader2 className="animate-spin" size={32} />
                            <span style={{ color: '#9ca3af' }}>Yuklanmoqda...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                            {items.map((item) => (
                                <div
                                    key={item.path}
                                    onClick={() => item.type === 'dir' ? loadPath(item.path) : onSelect(`/uploads/${item.path}`)}
                                    style={{
                                        border: '1px solid #374151', borderRadius: '8px', padding: '1.25rem 0.75rem',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                                        cursor: 'pointer', background: '#2d3748',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#4a5568';
                                        e.currentTarget.style.borderColor = '#60a5fa';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#2d3748';
                                        e.currentTarget.style.borderColor = '#374151';
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        {item.type === 'dir' ? (
                                            <Folder size={48} color="#fbbf24" fill="#fbbf2433" />
                                        ) : (
                                            <FileVideo size={48} color="#60a5fa" />
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', textAlign: 'center', wordBreak: 'break-all', fontWeight: 500, lineHeight: 1.2 }}>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
                                    <Folder size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Papka bo'sh</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
