import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { deleteBanner, toggleBannerStatus } from '@/actions/banner';
import DeleteBannerButton from '@/components/admin/DeleteBannerButton';

export default async function BannersPage() {
    const banners = await prisma.banner.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>Bannerlar</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link
                        href="/admin/banners/archive"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-gray)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            textDecoration: 'none'
                        }}
                    >
                        <Trash2 size={20} />
                        Arxiv
                    </Link>
                    <Link
                        href="/admin/banners/new"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--primary-gold)',
                            color: 'var(--bg-dark)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            textDecoration: 'none'
                        }}
                    >
                        <Plus size={20} />
                        Yangi Banner
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {banners.map((banner) => (
                    <div key={banner.id} style={{ background: 'var(--bg-card)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <img
                            src={banner.image}
                            alt={banner.title}
                            style={{ width: '100%', height: '200px', objectFit: 'cover', opacity: banner.isActive ? 1 : 0.5 }}
                        />
                        {banner.isActive && new Date(banner.createdAt) > new Date() && (
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'rgba(234, 179, 8, 0.9)', // Yellow-500
                                color: 'black',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <span>Rejalashtirilgan: {new Date(banner.createdAt).toLocaleDateString()} {new Date(banner.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-white)' }}>{banner.title}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <form action={async () => {
                                    'use server';
                                    await toggleBannerStatus(banner.id, !banner.isActive);
                                }}>
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: banner.isActive ? '#10b981' : 'var(--text-gray)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {banner.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        {banner.isActive ? 'Faol' : 'Nofaol'}
                                    </button>
                                </form>

                                <Link href={`/admin/banners/${banner.id}/edit`} style={{ color: 'var(--primary-gold)', display: 'flex', alignItems: 'center' }}>
                                    <Edit size={20} />
                                </Link>

                                <DeleteBannerButton id={banner.id} isActive={banner.isActive} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                banners.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '4rem' }}>
                        <p>Hozircha bannerlar yo'q</p>
                    </div>
                )
            }
        </div >
    );
}
