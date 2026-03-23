const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // 1. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ziyo.uz' },
        update: {},
        create: {
            email: 'admin@ziyo.uz',
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN',
        },
    });

    // 2. Create Categories
    const categories = [
        { name: "Ko'rsatuvlar", slug: 'korsatuvlar' },
        { name: "Lavha va reportajlar", slug: 'lavha' },
        { name: "Ziyo Cinema", slug: 'cinema' },
        { name: "Audiomahsulotlar", slug: 'audio' },
        { name: "Maqolalar", slug: 'maqolalar' },
        { name: "Fotogalereya", slug: 'fotogalereya' },
        { name: "Siyosat", slug: 'siyosat' },
        { name: "Jamiyat", slug: 'jamiyat' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { name: cat.name, slug: cat.slug },
        });
    }

    // Helper to fetch category ID
    const getCatId = async (slug) => {
        const cat = await prisma.category.findUnique({ where: { slug } });
        return cat ? cat.id : null;
    };

    // 3. Create Posts (Real Data from Screenshots)
    const posts = [
        // Ko'rsatuvlar / Lavhalar
        {
            title: '«Vatan» jurnali va «Millatparvar» kitobi taqdimoti',
            slug: 'vatan-jurnali-taqdimoti',
            type: 'video',
            views: 68,
            catSlug: 'lavha',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        },
        {
            title: "Oliy ta'limda tajriba almashish - taraqqiyot omili",
            slug: 'oliy-talimda-tajriba',
            type: 'video',
            views: 14,
            catSlug: 'lavha',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        },
        {
            title: "O'zbekiston xalqaro islom akademiyasida o'tkazilgan tadbir",
            slug: 'islam-academy-event',
            type: 'video',
            views: 21,
            catSlug: 'lavha',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        },
        // Ziyo Cinema
        {
            title: 'Ilm - najotdir | O\'zbekkino',
            slug: 'ilm-najotdir',
            type: 'video',
            views: 120,
            catSlug: 'cinema',
            thumbnail: 'https://ziyo.uz/wp-content/uploads/2024/02/ilm-najotdir.jpg', // Fictional URL, will break but structure is there
        },
        {
            title: 'Muallima | Qisqa metrajli film',
            slug: 'muallima-film',
            type: 'video',
            views: 340,
            catSlug: 'cinema',
            thumbnail: '',
        },
        {
            title: 'Saodat manzili | O\'zbekkino',
            slug: 'saodat-manzili',
            type: 'video',
            views: 89,
            catSlug: 'cinema',
            thumbnail: '',
        },
        // Audiomahsulotlar
        {
            title: 'Mehnat – inson ziynati',
            slug: 'mehnat-inson-ziynati',
            type: 'audio',
            views: 45,
            catSlug: 'audio',
            content: 'Mutaxassis: "Abu Bakr Siddiq" masjidi imom-xatibi...',
        },
        {
            title: 'Zakot – molni poklovchidir',
            slug: 'zakot-molni-poklovchidir',
            type: 'audio',
            views: 112,
            catSlug: 'audio',
            content: 'Mutaxassis: "Qo\'shqo\'rg\'on" masjidi imom-xatibi...',
        },
        // Maqolalar
        {
            title: 'Ixtilof dinimizga zarardir',
            slug: 'ixtilof-dinimizga-zarar',
            type: 'standard',
            views: 500,
            catSlug: 'maqolalar',
            content: 'O\'zining Kalomi sharifida "Agar bilmasangiz..."',
        }
    ];

    for (const post of posts) {
        const catId = await getCatId(post.catSlug);
        await prisma.post.create({
            data: {
                title: post.title,
                slug: post.slug + '-' + Date.now(),
                content: post.content || 'Lorem ipsum dolor sit amet...',
                type: post.type,
                published: true,
                views: post.views,
                categoryId: catId,
                authorId: admin.id,
                thumbnail: post.thumbnail || null,
                videoUrl: post.type === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
            },
        });
    }

    console.log('Seed data updated with Ziyo.uz content!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
