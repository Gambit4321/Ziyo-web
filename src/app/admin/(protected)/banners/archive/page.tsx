import Link from 'next/link';
import { getDeletedBanners, restoreBanner, permanentDeleteBanner } from '@/actions/banner';
import { RefreshCcw, Trash2, ArrowLeft } from 'lucide-react';
import PermanentDeleteButton from '@/components/admin/PermanentDeleteButton';

export default async function BannerArchivePage() {
    const banners = await getDeletedBanners();

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/banners" style={{ color: 'var(--text-gray)', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-gray)', fontFamily: 'var(--font-serif)' }}>Arxiv (O'chirilganlar)</h1>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {banners.map((banner) => (
                    <div key={banner.id} style={{ background: 'var(--bg-card)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', opacity: 0.7 }}>
                        <img
                            src={banner.image}
                            alt={banner.title}
                            style={{ width: '100%', height: '200px', objectFit: 'cover', filter: 'grayscale(100%)' }}
                        />
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-white)' }}>{banner.title}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '1rem' }}>
                                O'chirilgan vaqti: {banner.deletedAt ? new Date(banner.deletedAt).toLocaleDateString() : ''}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <form action={async () => {
                                    'use server';
                                    await restoreBanner(banner.id);
                                }}>
                                    <button
                                        type="submit"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: 'none',
                                            border: '1px solid #10b981',
                                            color: '#10b981',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <RefreshCcw size={16} />
                                        Tiklash
                                    </button>
                                </form>



                                <PermanentDeleteButton id={banner.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                banners.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '4rem' }}>
                        <p>Arxiv bo'sh</p>
                    </div>
                )
            }
        </div >
    );
}
