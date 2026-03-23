
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const slug = 'korsatuvlar';
    console.log(`Searching for category with slug: ${slug}`);

    const category = await prisma.category.findUnique({
        where: { slug: slug },
        include: {
            children: true
        }
    });

    if (!category) {
        console.log('Category not found!');
    } else {
        console.log(`Category found: ${category.name} (ID: ${category.id})`);
        console.log(`Children count: ${category.children.length}`);
        if (category.children.length > 0) {
            category.children.forEach(child => {
                console.log(` - ${child.name} (${child.slug})`);
            });
        } else {
            console.log('No subcategories found.');
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
