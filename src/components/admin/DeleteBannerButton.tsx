'use client';

import { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { deleteBanner } from '@/actions/banner';

type DeleteBannerButtonProps = {
    id: string;
    isActive: boolean;
};

export default function DeleteBannerButton({ id, isActive }: DeleteBannerButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        if (isActive) return; // Should not happen due to disabled attribute
        setIsOpen(true);
    };

    const confirmDelete = async () => {
        if (!isChecked) return;
        setIsDeleting(true);
        try {
            await deleteBanner(id);
            setIsOpen(false);
        } catch (error) {
            alert("Xatolik yuz berdi");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={handleDeleteClick}
                disabled={isActive}
                style={{
                    background: 'none',
                    border: 'none',
                    color: isActive ? 'var(--text-gray)' : '#ef4444',
                    cursor: isActive ? 'not-allowed' : 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isActive ? 0.5 : 1
                }}
                title={isActive ? "Faol bannerni o'chirib bo'lmaydi" : "O'chirish"}
            >
                <Trash2 size={20} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '0.5rem',
                        maxWidth: '400px',
                        width: '90%',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-white)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#ef4444' }}>
                            <AlertTriangle size={32} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Bannerni o'chirish</h3>
                        </div>

                        <p style={{ marginBottom: '1.5rem', lineHeight: '1.5', color: 'var(--text-gray)' }}>
                            Siz haqiqatan ham ushbu bannerni o'chirmoqchimisiz?
                            <br />
                            <small>(U "O'chirilganlar" arxivi ga ko'chiriladi)</small>
                        </p>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                            />
                            <span style={{ fontSize: '0.95rem' }}>Men roziman, o'chirilsin.</span>
                        </label>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isDeleting}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.25rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-white)',
                                    cursor: 'pointer'
                                }}
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={!isChecked || isDeleting}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.25rem',
                                    background: isChecked ? '#ef4444' : 'var(--border-color)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: isChecked ? 'pointer' : 'not-allowed',
                                    opacity: isDeleting ? 0.7 : 1
                                }}
                            >
                                {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
