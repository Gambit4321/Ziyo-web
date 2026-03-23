'use client';

import { Trash2 } from 'lucide-react';
import { permanentDeleteBanner } from '@/actions/banner';

type PermanentDeleteButtonProps = {
    id: string;
};

export default function PermanentDeleteButton({ id }: PermanentDeleteButtonProps) {
    const handleDelete = async () => {
        if (confirm("DIQQAT! Bu bannerni butunlay o'chirib yuborishni tasdiqlaysizmi?\n\nBu amalni ortga qaytarib bo'lmaydi!")) {
            await permanentDeleteBanner(id);
        }
    };

    return (
        <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            title="Butunlay o'chirish"
        >
            <Trash2 size={20} />
        </button>
    );
}
