const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Connecting to MariaDB...");
    try {
        // Try to perform a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log("SUCCESS: MariaDB connection established!");

        // Check if the database 'ziyoweb' exists or list tables
        const tables = await prisma.$queryRaw`SHOW TABLES`;
        console.log("Tables in database:", tables);
    } catch (error) {
        console.error("FAILURE: Could not connect to MariaDB.");
        console.error("Error details:", error.message);

        if (error.message.includes("Can't connect to MySQL server on 'localhost'")) {
            console.log("\nTIP: The app is configured for 'localhost'. If MariaDB is on the server (192.168.200.205), try updating .env to use the server'S IP instead of localhost.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
