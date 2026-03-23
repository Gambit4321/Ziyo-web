const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user:', users[0]);
        } else {
            console.log('No users found in database.');
        }
    } catch (e) {
        console.error('Error querying users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
