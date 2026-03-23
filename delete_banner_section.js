
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find the section first to confirm
        const bannerSection = await prisma.homeSection.findFirst({
            where: {
                type: 'BANNER',
                OR: [
                    { title: 'Yangi Banner' },
                    { title: 'Banner' }
                ]
            }
        });

        if (bannerSection) {
            console.log('Found Banner Section:', bannerSection);
            await prisma.homeSection.delete({
                where: { id: bannerSection.id }
            });
            console.log('Successfully deleted Banner Section from Home Page settings.');
        } else {
            console.log('No Banner Section found to delete.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
