'use client';

import { useGlobalSave } from '@/contexts/GlobalSaveContext';
import { Save, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AdminHeader() {
    const { isDirty, triggerSave, discardChanges } = useGlobalSave();
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await triggerSave();
            alert("O'zgarishlar saqlandi va sayt yangilandi!");
        } catch (error) {
            console.error(error);
            alert("Saqlashda xatolik yuz berdi.");
        } finally {
            setSaving(false);
        }
    };

    // Wrapper for positioning (Sticky & Takes up space)
    const wrapperStyle: React.CSSProperties = {
        position: 'sticky',
        top: '20px',
        zIndex: 99,
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '1rem',
        pointerEvents: 'none' // Allow clicking through the empty space around the pill
    };

    // Visual Pill Style
    const headerStyle: React.CSSProperties = {
        pointerEvents: 'auto', // Re-enable clicks on the pill itself
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#1f2937',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: isDirty ? '1px solid #c6a866' : '1px solid #374151',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease',
        opacity: isDirty ? 1 : 0.6
    };

    return (
        <div style={wrapperStyle}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDirty ? '#c6a866' : '#9ca3af' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: 'bold' }}>
                        {isDirty ? "O'zgarishlar kiritildi" : "O'zgarishlar yo'q"}
                    </span>
                </div>

                <div style={{ height: '20px', width: '1px', background: '#374151' }}></div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: isDirty ? '#c6a866' : '#374151',
                        color: isDirty ? '#000' : '#9ca3af',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: (!isDirty || saving) ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Save size={18} />
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>

                {isDirty && (
                    <button
                        onClick={discardChanges}
                        disabled={saving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                        Bekor qilish
                    </button>
                )}
            </div>
        </div>
    );
}
