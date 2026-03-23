import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/prisma';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

import { AudioProvider } from '@/context/AudioContext';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const categories = await prisma.category.findMany({
        where: { showInMenu: true },
        orderBy: { order: 'asc' }
    });

    return (
        <AudioProvider>
            <GlobalAudioPlayer />
            <Navbar categories={categories} />
            <main style={{ minHeight: '80vh', paddingTop: '2rem' }}>
                {children}
            </main>
            <Footer />
        </AudioProvider>
    );
}
