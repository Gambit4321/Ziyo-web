const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const posts = await prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            thumbnail: true,
            createdAt: true,
        },
    });

    console.log('Latest 10 posts:');
    posts.forEach(post => {
        console.log(`- [${post.id}] ${post.title}`);
        console.log(`  Thumbnail: ${post.thumbnail}`);
        console.log(`  Date: ${post.createdAt}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
