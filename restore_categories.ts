import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const children = [
  {name:"HUQUQIY SAVODXONLIK",slug:"huquqiy-savodxonlik-1767796270856",order:5,image:"/uploads/1767880652872-768542857-photo2024-01-0915-50-34.webp"},
  {name:"VIDEOROLIKLAR",slug:"videoroliklar-1767796286850",order:6,image:"/uploads/1767880662655-24134592-1920-1010.webp"},
  {name:"JAHOLATGA QARSHI MA`RIFAT",slug:"jaholatga-qarshi-ma-rifat-1767796303672",order:7,image:"/uploads/1767880667195-635650084-preview-63f59c524d51d.webp"},
  {name:"RAMAZON TUHFASI",slug:"ramazon-tuhfasi-1767796318913",order:3,image:"/uploads/1767880640729-398474261-preview-641e861f98fc0.webp"},
  {name:"NODIR XAZINA",slug:"nodir-xazina-1767796328052",order:4,image:"/uploads/1767880645525-387632281-preview-64ef27d27a121.webp"},
  {name:"IQROR MANZILI",slug:"iqror-manzili-1767796338030",order:2,image:"/uploads/1767880633792-271566994-preview-64e5cbc576411.webp"},
  {name:"E`TIQOD MUSTAHKAMLIGI YO‘LIDA",slug:"e-tiqod-mustahkamligi-yo-lida-1767796356655",order:1,image:"/uploads/1767874986301-959833194-EtiqodMustahkamlgi2.webp"},
  {name:"IMOM BUHORIY SABOQLARI ",slug:"imom-buhoriy-saboqlari-1767796370671",order:0,image:"/uploads/1767874126067-782131154-BANNERBUXORIY3.webp"}
];

async function main() {
    console.log('Restoring categories...');
    let parent = await prisma.category.findUnique({ where: { slug: 'korsatuvlar' } });
    
    if (!parent) {
        console.log("Parent 'korsatuvlar' not found, trying 'lavha'...");
        parent = await prisma.category.findUnique({ where: { slug: 'lavha' } });
    }

    if (!parent) {
        console.log("Parent not found! Creating 'Ko\\'rsatuvlar'...");
        parent = await prisma.category.create({
            data: {
                name: "Ko'rsatuvlar",
                slug: 'korsatuvlar',
                showInMenu: true
            }
        });
    }

    console.log(`Parent found/created: ${parent.name} (${parent.id})`);

    for (const child of children) {
        const exists = await prisma.category.findFirst({
            where: { slug: child.slug }
        });

        if (!exists) {
            await prisma.category.create({
                data: {
                    name: child.name,
                    slug: child.slug,
                    image: child.image,
                    order: child.order,
                    parentId: parent.id,
                    showInMenu: false
                }
            });
            console.log(`Created: ${child.name}`);
        } else {
            await prisma.category.update({
                where: { id: exists.id },
                data: {
                    parentId: parent.id,
                    image: child.image
                }
            });
            console.log(`Updated: ${child.name}`);
        }
    }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
