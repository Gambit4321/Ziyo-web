import AudioPlayer from '@/components/AudioPlayer';
import { prisma } from '@/lib/prisma';

export default async function AudioCategoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch latest audio posts for the player
    const audioPosts = await prisma.post.findMany({
        where: {
            type: 'audio',
            published: true,
            createdAt: { lte: new Date() }
        },
        include: {
            author: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Limit to 10 most recent
    });

    const audioTracks = audioPosts.map(post => ({
        id: post.id,
        title: post.title,
        videoUrl: post.videoUrl,
        thumbnail: post.thumbnail,
        author: { name: post.author?.name || 'Ziyo Media' },
        content: post.content
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {children}
            {audioTracks.length > 0 && (
                <AudioPlayer tracks={audioTracks} showPlaylist={true} />
            )}
        </div>
    );
}
