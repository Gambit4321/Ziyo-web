const { PrismaClient } = require('@prisma/client');

// Use remote IP for connection
process.env.DATABASE_URL = "mysql://root:root@192.168.200.205:3306/ziyoweb";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database at 192.168.200.205...");
        const count = await prisma.category.count();
        console.log(`Success! Total categories: ${count}`);

        const audioSection = await prisma.category.findFirst({
            where: {
                OR: [
                    { slug: 'audio' },
                    { name: { contains: 'Audio' } }
                ]
            }
        });

        if (audioSection) {
            console.log(`Found Audio Section: ${audioSection.name} (ID: ${audioSection.id})`);
            const subcats = await prisma.category.findMany({
                where: { parentId: audioSection.id }
            });
            console.log(`Subcategories of ${audioSection.name}:`);
            subcats.forEach(c => console.log(` - ${c.name} (ID: ${c.id})`));
        } else {
            console.log("Audio section not found in DB.");
        }
    } catch (e) {
        console.error("Connection failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
