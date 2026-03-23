const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const post = await prisma.post.findFirst({
        where: { title: { contains: 'Yig' } },
        select: {
            id: true,
            title: true,
            videoUrl: true,
            type: true
        }
    });

    if (post) {
        console.log('Post found:');
        console.log(`- Title: ${post.title}`);
        console.log(`- Type: ${post.type}`);
        console.log(`- Video URL: ${post.videoUrl}`);
    } else {
        console.log('Post not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
