# Codex Esla

## Loyiha

- Nomi: `ziyo-web`
- Joylashuvi: `W:\ziyo-web`
- Stack: Next.js 16 App Router, React 19, Prisma, NextAuth, MySQL
- Runtime: Node.js
- Asosiy maqsad: public media sayt va admin panel

## Ishga tushirish

- Dev: `npm run dev`
- Build: `npm run build`
- Prod start: `npm run start`
- Lint: `npm run lint`
- Deploy: `npm run deploy`
- Odatdagi port: `3000`
- Custom prod server: `W:\ziyo-web\server.js`

## Deploy va runtime

- `next.config.ts` ichida `output: 'standalone'`
- Deploy script build qiladi, `.next/standalone` ni rootga ko`chiradi va `pm2` bilan `server.js` ni restart qiladi
- `server.js` `HOSTNAME` va `PORT` orqali production serverni ko`taradi
- `docker-compose.yml` mavjud, lekin undagi DB konfiguratsiyasi amaldagi Prisma schema bilan alohida tekshirilishi kerak

## Muhim env kalitlari

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `PORT`
- `HOSTNAME`
- `KEEP_ALIVE_TIMEOUT`

## Muhim papkalar

- `src/app/(public)` public sayt sahifalari
- `src/app/admin` admin panel
- `src/app/api` upload, search va auth endpointlar
- `src/actions` server actions
- `src/components` public va admin UI komponentlar
- `src/context` va `src/contexts` audio/global save context
- `prisma/schema.prisma` ma`lumot modeli
- `public/uploads` lokal upload storage

## Asosiy arxitektura

- Public qism: home, category, post detail, search va audio oqimi
- Admin qism: dashboard, posts, banners, categories, settings, diagnose
- Server actions: `home`, `post`, `category`, `banner`
- Auth: NextAuth credentials provider
- Middleware: admin route lar role bo`yicha himoyalangan
- API: auth, upload, search, posts, admin browse

## Data model

- `User`: admin/author
- `Category`: parent-child iyerarxiya, image, order, showInMenu
- `HomeSection`: bosh sahifa blok konfiguratsiyasi
- `Post`: title, slug, content, type, video/audio fieldlari, views, published
- `Media`: upload yozuvlari
- `Banner`: hero va promo bannerlar

## Hozirgi funksiyalar

- Bosh sahifa `HomeSection` modeli orqali boshqariladi
- Post turlari: `standard`, `video`, `audio`
- Home bo`lim turlari: `HERO`, `CAROUSEL`, `TABS`, `GRID`, `BANNER`, `AUDIO`
- Admin panelda post, banner, kategoriya, bosh sahifa bloklari va sozlamalar bor
- Search va upload ishlari uchun API route lar mavjud
- Audio player va global audio context mavjud
- Banner archive/new/edit flow mavjud
- Category tartiblash va home section drag-and-drop mavjud
- NextAuth credentials login ishlatiladi

## Auth va xavfsizlik

- Login sahifasi: `/admin/login`
- Auth route: `src/app/api/auth/[...nextauth]/route.ts`
- Session strategy: JWT
- Role token/session ga yoziladi
- Middleware `token.role === 'admin'` bo`lsa protected route ga kiritadi
- `NEXTAUTH_SECRET` bo`sh qolmasligi kerak

## Media va upload

- Upload endpoint rasm/video/audio ni qabul qiladi
- Hozirgi limitlar: video uchun 50MB, rasm uchun 5MB
- Storage: `public/uploads`
- Admin file browser shu storage ichida yuradi
- NAS/browser UI elementlari bor, lekin storage qatlami aralash va ehtiyotkor ko`riladi

## Eslab qolish kerak bo`lgan muhim holatlar

- Dashboard hozir juda bazaviy: asosan post soni va umumiy view summasi
- Post formda `draft/scheduled/published` UI bor, lekin backend workflow hali to`liq emas
- Ba`zi joylarda hardcoded ID va fallback mantiqlar bor
- SEO qatlami hali kuchsiz: metadata, OG, sitemap, canonical to`liq emas
- Search oddiy `contains` qidiruvga tayangan
- View count post detail sahifasida increment qilinyapti
- Upload lar lokal `public/uploads` ga saqlanadi
- `createPost` hozir admin userni `findFirst()` bilan oladi; ownership modeli vaqtinchalik
- Ayrim joylarda oddiy `img` ishlatilgan, media optimizatsiya bir xil emas
- `typescript.ignoreBuildErrors = true`; build payti xatolar ko`rinmay qolishi mumkin
- Post detail sahifasida content renderi va sanitization alohida tekshirilishi kerak

## Muhim warning lar

- Prisma schema `mysql` datasource ishlatadi, lekin `docker-compose.yml` ichida `DATABASE_URL=file:./prisma/dev.db` berilgan; bu mos emas
- Docker compose `prisma/dev.db` ni mount qiladi, lekin amaldagi schema MySQL uchun
- `middleware.ts` faqat ayrim `/admin/...` route larni qamraydi; yangi route qo`shilganda matcher yangilanadi
- Home/public sahifalarning bir qismi `force-dynamic`; performance audit kerak

## Tavsiya etilgan prioritetlar

1. Admin workflow ni to`g`rilash: `draft`, `review`, `scheduled`, `published`
2. SEO va post/category UX ni kuchaytirish
3. Dashboard, analytics va search ni rivojlantirish
4. Media library va role-based access qo`shish

## Muhim fayllar

- `W:\ziyo-web\docs\ziyo-rivojlantirish-taklifi.md`
- `W:\ziyo-web\package.json`
- `W:\ziyo-web\next.config.ts`
- `W:\ziyo-web\server.js`
- `W:\ziyo-web\docker-compose.yml`
- `W:\ziyo-web\src\lib\auth.ts`
- `W:\ziyo-web\src\middleware.ts`
- `W:\ziyo-web\src\actions\post.ts`
- `W:\ziyo-web\src\actions\home.ts`
- `W:\ziyo-web\src\components\admin\PostForm.tsx`
- `W:\ziyo-web\src\app\(public)\post\[slug]\page.tsx`
- `W:\ziyo-web\prisma\schema.prisma`

## Ish boshlashda nima tekshiriladi

1. `DATABASE_URL` qaysi DB ga qarayotganini tekshirish
2. `NEXTAUTH_SECRET` va login ishlashini tekshirish
3. Admin panelda post create/edit flow ni tekshirish
4. Home section config saytda aks etayotganini tekshirish
5. Upload papkasi yozish ruxsatiga ega ekanini tekshirish
6. Search, post detail va category page real ma`lumot bilan ishlashini tekshirish

## Qisqa kontekst

Bu loyiha ishlaydigan holatda, lekin keyingi bosqich uchun eng muhim ishlar admin panelni real redaksiya workflow ga moslashtirish va public saytni SEO hamda kontent iste`moli uchun kuchaytirishdir.

## 2026-03-19 holat yangilanishi

- SEO poydevori qo`shildi:
  - `src/lib/seo.ts`
  - root metadata kuchaytirildi
  - home/post/category/search uchun metadata ishlaydi
  - `src/app/sitemap.ts` va `src/app/robots.ts` qo`shildi
- Post detail public UX kuchaytirildi:
  - breadcrumb
  - reading time
  - share blok
  - oldingi/keyingi material
  - related posts yaxshilandi
  - JSON-LD boyitildi
- View count render ichidan ajratildi:
  - `src/components/PostViewCounter.tsx`
  - `src/app/api/posts/[id]/view/route.ts`
- Search modal live autosuggest ishlaydi:
  - `src/components/SearchModal.tsx`
  - `src/app/api/search/route.ts`
- Category sahifada filter qo`shildi:
  - `all / standard / video / audio`
  - count va pagination yaxshilandi
- Home page da `Eng ko`p o`qilgan` blok qo`shildi
- `HomeSection.displayStyle` endi public home renderda ishlaydi:
  - `CAROUSEL`
  - `LIST`
  - `GRID`
- `ENG YANGI` uchun alohida route qo`shildi:
  - `src/app/(public)/latest/page.tsx`
  - `TabsSection` endi aktiv tab bo`yicha shu sahifaga olib boradi
- Admin dashboard kuchaytirildi:
  - holat kesimlari
  - format kesimi
  - top ko`rilganlar
  - so`nggi materiallar
- Admin post workflow yaxshilandi:
  - `draft / scheduled / published` server action darajasida ishlaydi
  - post listda status badge lar bor
  - admin post listda qidiruv va status filter bor
  - `slug` va `excerpt` create/update oqimiga qo`shildi
  - create/edit formda slug auto-generate ishlaydi

## Oxirgi tegilgan muhim fayllar

- `W:\ziyo-web\src\lib\seo.ts`
- `W:\ziyo-web\src\app\layout.tsx`
- `W:\ziyo-web\src\app\sitemap.ts`
- `W:\ziyo-web\src\app\robots.ts`
- `W:\ziyo-web\src\app\(public)\page.tsx`
- `W:\ziyo-web\src\app\(public)\page.module.css`
- `W:\ziyo-web\src\app\(public)\post\[slug]\page.tsx`
- `W:\ziyo-web\src\app\(public)\post\[slug]\post.module.css`
- `W:\ziyo-web\src\app\(public)\category\[slug]\page.tsx`
- `W:\ziyo-web\src\app\(public)\category\[slug]\category.module.css`
- `W:\ziyo-web\src\app\(public)\latest\page.tsx`
- `W:\ziyo-web\src\app\(public)\latest\latest.module.css`
- `W:\ziyo-web\src\components\TabsSection.tsx`
- `W:\ziyo-web\src\components\SearchModal.tsx`
- `W:\ziyo-web\src\components\PostViewCounter.tsx`
- `W:\ziyo-web\src\app\api\search\route.ts`
- `W:\ziyo-web\src\app\api\posts\[id]\view\route.ts`
- `W:\ziyo-web\src\actions\post.ts`
- `W:\ziyo-web\src\actions\home.ts`
- `W:\ziyo-web\src\components\admin\PostForm.tsx`
- `W:\ziyo-web\src\components\admin\EditPostForm.tsx`
- `W:\ziyo-web\src\components\admin\PostForm.module.css`
- `W:\ziyo-web\src\app\admin\(protected)\posts\page.tsx`
- `W:\ziyo-web\src\app\admin\(protected)\posts\posts.module.css`
- `W:\ziyo-web\src\app\admin\(protected)\dashboard\page.tsx`
- `W:\ziyo-web\src\app\admin\(protected)\dashboard\dashboard.module.css`
- `W:\ziyo-web\src\app\admin\(protected)\settings\home\page.tsx`

## Keyin aynan qayerdan davom etiladi

1. `src/app/admin/(protected)/settings/home/page.tsx` ni tozalash
   - bu faylda eski lint qarzlari ko`p
   - funksional jihatdan `displayStyle` renderga ulandi, lekin admin UI faylini type/lint bo`yicha to`liq tartibga keltirish qolgan
2. Home settings modalga `rowCount`, `autoplaySeconds`, `sortType` va source tanlash UX ni yaxshiroq qilish
3. Public home uchun yana 1-2 tayyor blok qo`shish:
   - `Muharrir tanlovi` (`featured=true` ga tayansa bo`ladi)
   - `So`nggi audio` yoki `So`nggi video`
4. Admin post listga type chips/count summary qo`shish
5. Keyinroq kattaroq bosqich:
   - media library
   - role/review workflow
   - SEO title/description uchun schema kengaytirish

## Eslab qolish kerak bo`lgan holat

- Ko`p yangi/tegilgan fayllar uchun targeted lint o`tgan
- Home page da hanuz oddiy `img` warning qolgan (`src/app/(public)/page.tsx`)
- `src/app/admin/(protected)/settings/home/page.tsx` da hali eski lint muammolari bor, shu fayl keyingi birinchi cleanup nuqtasi
- To`liq `npm run lint` butun repo bo`yicha hali toza emas; repo ichida tarixiy xatolar ko`p
