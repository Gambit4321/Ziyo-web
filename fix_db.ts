
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("🛠️ STARTING DATABASE REPAIR...");

    // 1. Fix "Ko'rsatuvlar" and its children
    console.log("\n1️⃣ Fixing Ko'rsatuvlar (Shows)...");

    // Ensure Parent Exists
    const parent = await prisma.category.upsert({
        where: { slug: 'korsatuvlar' },
        update: {},
        create: {
            name: "Ko'rsatuvlar",
            slug: 'korsatuvlar',
            showInMenu: true,
            order: 1
        }
    });
    console.log(`   ✅ Parent 'Ko'rsatuvlar' ID: ${parent.id}`);

    // List of expected children names (partial match is enough)
    const showNames = [
        "Imom Buxoriy",
        "Iqror Manzili",
        "E'tiqod",
        "Ramazon Tuhfasi",
        "Nodir Xazina",
        "Huquqiy Savodxonlik",
        "Videoroliklar",
        "Jaholatga qarshi"
    ];

    for (const namePart of showNames) {
        // Find by name containing the part
        const child = await prisma.category.findFirst({
            where: {
                name: { contains: namePart }
            }
        });

        if (child) {
            await prisma.category.update({
                where: { id: child.id },
                data: { parentId: parent.id }
            });
            console.log(`   🔗 Linked '${child.name}' to parent.`);
        } else {
            console.log(`   ⚠️ Could not find child matching '${namePart}'`);
        }
    }


    // 2. Fix other Menu Items (Missing Pages)
    console.log("\n2️⃣ Fixing Missing Menu Categories...");

    const menuItems = [
        { name: "Lavha va reportajlar", slug: "lavha", order: 2 },
        { name: "Ziyo Cinema", slug: "cinema", order: 3 },
        { name: "Audiomahsulotlar", slug: "audio", order: 4 },
        { name: "Maqolalar", slug: "maqolalar", order: 5 },
        { name: "Fotogalereya", slug: "fotogalereya", order: 6 }
    ];

    for (const item of menuItems) {
        const cat = await prisma.category.upsert({
            where: { slug: item.slug },
            update: { showInMenu: true }, // Ensure it appears
            create: {
                name: item.name,
                slug: item.slug,
                showInMenu: true,
                order: item.order
            }
        });
        console.log(`   ✅ ensured category: ${cat.name} (${cat.slug})`);
    }

    console.log("\n✅ REPAIR COMPLETE! Refresh the site.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
