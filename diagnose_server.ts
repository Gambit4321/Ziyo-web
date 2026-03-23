import { prisma } from './src/lib/prisma';

async function main() {
  console.log("--- DIAGNOSTIC START ---");

  const targetSlug = 'korsatuvlar';
  console.log(`Checking category: ${targetSlug}`);
  const parent = await prisma.category.findUnique({
    where: { slug: targetSlug },
    include: { children: true }
  });

  if (!parent) {
    console.log(`❌ CRITICAL: Category '${targetSlug}' NOT FOUND!`);
  } else {
    console.log(`✅ Found Parent: ${parent.name} (ID: ${parent.id})`);
    console.log(`   Children Count: ${parent.children.length}`);
    if (parent.children.length === 0) {
        console.log("   ⚠️ WARNING: No children found! This is why the page is empty.");
        // Let's see if we can find orphan children
        const potentialChildren = await prisma.category.findMany({
            where: { 
                OR: [
                    { parentId: parent.id },
                    { name: { contains: 'Iqror' } },
                    { name: { contains: 'Imom' } }
                ]
            }
        });
        console.log("   Potential orphans found:", potentialChildren.map(c => `${c.name} (ParentID: ${c.parentId})`).join(', '));
    } else {
        parent.children.forEach(c => console.log(`   - Child: ${c.name} (${c.slug})`));
    }
  }

  const menuSlugs = ['lavha', 'cinema', 'audio', 'maqolalar'];
  console.log("\n--- CHECKING MENU LINKS ---");
  for (const slug of menuSlugs) {
      const cat = await prisma.category.findUnique({ where: { slug } });
      if (cat) {
          console.log(`✅ ${slug}: Found (${cat.name})`);
      } else {
          console.log(`❌ ${slug}: NOT FOUND in DB`);
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
