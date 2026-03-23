const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@ziyo.uz';
    const password = 'admin123'; // Change this!
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                password: hashedPassword,
                role: 'admin',
            },
            create: {
                email: email,
                name: 'Admin User',
                password: hashedPassword,
                role: 'admin',
            },
        });
        console.log(`User ${user.email} created/updated with password: ${password}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
