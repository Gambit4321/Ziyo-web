'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin Error:', error);
    }, [error]);

    return (
        <div style={{ padding: '2rem', color: 'white' }}>
            <h2 style={{ color: '#ef4444' }}>Xatolik yuz berdi!</h2>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <p style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>{error.message}</p>
                {error.digest && <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Digest: {error.digest}</p>}
            </div>
            <button
                onClick={() => reset()}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                }}
            >
                Qayta urinish
            </button>
        </div>
    );
}
