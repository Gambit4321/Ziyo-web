const { PrismaClient } = require('@prisma/client');

// Use remote IP for connection
process.env.DATABASE_URL = "mysql://root:root@192.168.200.205:3306/ziyoweb";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database at 192.168.200.205...");
        const now = new Date();

        // Find posts that have createdAt in the future
        const futurePosts = await prisma.post.findMany({
            where: {
                createdAt: {
                    gt: now
                }
            },
            select: {
                id: true,
                title: true,
                createdAt: true
            }
        });

        console.log(`Found ${futurePosts.length} posts with future dates (hidden due to timezone issue)`);

        for (const post of futurePosts) {
            console.log(`- Fixing: [${post.title}] (Current DB Time: ${post.createdAt})`);

            // Adjust the date back correctly. Or simple set it to now to publish immediately.
            await prisma.post.update({
                where: { id: post.id },
                data: {
                    createdAt: new Date()
                }
            });
        }

        console.log("All hidden future posts have been published (date set to now).");

    } catch (e) {
        console.error("Connection failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
