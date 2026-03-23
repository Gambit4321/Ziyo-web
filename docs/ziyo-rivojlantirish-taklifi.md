# Ziyo Web va Admin Panelni Rivojlantirish Bo`yicha Taklif

## 1. Qisqa xulosa

Loyiha hozirgi holatda ishlaydigan media-platforma sifatida shakllangan: public qismda bosh sahifa, kategoriya, post, qidiruv va audio bloklari bor; admin panelda post, banner, kategoriya va home section boshqaruvi mavjud. Asosiy ehtiyoj endi "ishlaydi" holatidan "barqaror, tez, boshqarilishi oson va o`sishga tayyor" holatiga o`tishdir.

Eng katta imkoniyatlar 3 yo`nalishda:

1. Public saytni kontent iste`moli uchun qulayroq va tezroq qilish.
2. Admin panelni haqiqiy redaksiya ish jarayoniga moslashtirish.
3. Texnik poydevorni SEO, analytics, xavfsizlik va scale uchun tozalash.

## 2. Hozirgi holat bo`yicha kuzatuvlar

Repo asosida aniqlangan kuchli tomonlar:

- Next.js App Router va Prisma asosidagi aniq stack mavjud.
- Bosh sahifa bloklari `HomeSection` orqali boshqariladi.
- Admin panelda post, banner, kategoriya va home section larni boshqarish allaqachon bor.
- Search, upload va media browser kabi bazaviy servislar tayyor.
- Audio, video va standart post formatlari uchun boshlang`ich arxitektura qurilgan.

Repo asosida aniqlangan asosiy cheklovlar:

- Dashboard juda sodda: amalda faqat post soni va umumiy view ko`rsatiladi.
- Post yaratishda draft/scheduled UI bor, lekin server tomonda workflow to`liq ishlamaydi.
- Ba`zi joylarda hardcoded ID va fallback mantiqlar mavjud, bu admin boshqaruvini zaiflashtiradi.
- SEO metadatalar, Open Graph, canonical, sitemap va structured metadata to`liq yo`lga qo`yilmagan.
- Qidiruv oddiy `contains` qidiruvga tayangan, relevance, tag, filter va autosuggest yo`q.
- View count post sahifasining o`zida oshirilmoqda; bu analytics va performance uchun noqulay.
- Uploadlar lokal `public/uploads` ga tushmoqda; media lifecycle va optimizatsiya qatlami yo`q.
- Rol modeli deyarli bitta admin atrofida qurilgan; tahririyat workflow uchun yetarli emas.

## 3. Public sayt bo`yicha taklif

### 3.1. Foydalanuvchi tajribasi

Quyidagi o`zgarishlar saytning kundalik foydaliligini sezilarli oshiradi:

- Bosh sahifada "Eng ko`p o`qilgan", "Muharrir tanlovi", "So`nggi audio", "So`nggi video" kabi aniq bloklar qo`shish.
- Har bir kategoriya sahifasiga filter va pagination qo`shish.
- Post sahifasida breadcrumb, o`qish vaqti, share blok, keyingi/oldingi material va kuchliroq "o`xshash materiallar" logikasini qo`shish.
- Search modal ichida live search/autosuggest chiqarish.
- Audio kontent uchun alohida kutubxona sahifasi: davomiylik, muallif, playlist, davom ettirish holati.
- Mobile navigatsiyani soddalashtirish va kontentni 1 qo`l bilan iste`mol qilishga moslash.

### 3.2. SEO va trafik

Media loyiha uchun bu qatlam eng yuqori prioritetlardan biri:

- Har bir post, kategoriya va bosh sahifa uchun `generateMetadata` asosida dinamik SEO.
- Open Graph image, title, description va canonical URL larni standartlashtirish.
- XML sitemap va robots boshqaruvini qo`shish.
- Post detail sahifasida hozir bor JSON-LD ni kengaytirish va article/video/audio turlari bo`yicha to`ldirish.
- Slug, excerpt va preview image larni majburiy yoki yarim majburiy qilish.
- Search sahifasi uchun index/noindex siyosatini aniq belgilash.

### 3.3. Kontent iste`moli analitikasi

- View count ni alohida API/event orqali yozish.
- "Trending now" blokini oxirgi 24/72 soat o`qilishlariga asoslash.
- Qaysi kategoriya, qaysi format va qaysi banner yaxshi ishlayotganini ko`rsatadigan event modeli qo`shish.

## 4. Admin panel bo`yicha taklif

### 4.1. Redaksiya workflow

Admin panelni oddiy CRUD dan kontent-operatsiya markaziga aylantirish kerak:

- Status modeli: `draft`, `review`, `scheduled`, `published`, `archived`.
- Nashr sanasi va vaqti bo`yicha real scheduling.
- Muallif, muharrir va admin rollarini ajratish.
- Post revision/history va kim nima o`zgartirganini ko`rsatish.
- Slug, excerpt, thumbnail, SEO title/description uchun alohida maydonlar.
- Rich text editor va media embed tajribasini yaxshilash.

### 4.2. Dashboard

Hozirgi dashboard o`rniga quyidagilarni ko`rsatish kerak:

- Bugungi, haftalik va oylik ko`rishlar.
- Eng ko`p o`qilgan 10 material.
- Draft, review va scheduled materiallar soni.
- So`nggi admin harakatlari.
- Bo`sh metadata yoki thumbnailsiz materiallar soni.

### 4.3. Kontent boshqaruvi

- Post listda filterlar: status, type, category, author, sana oralig`i.
- Bulk action: publish, unpublish, category change, delete, archive.
- Kategoriyalar uchun menu visibility, cover image va SEO boshqaruvi.
- Bannerlar uchun CTR kuzatuvi, active date range va preview.
- Home section lar uchun preview mode va "saytda qanday ko`rinadi" maketi.

### 4.4. Media boshqaruvi

- Media library: type, size, uploaded by, used in posts.
- Rasm uchun auto-resize/WebP, video/audio uchun metadata extraction.
- NAS/local/cloud manbalarni yagona abstraction orqali boshqarish.
- Orphan fayllarni aniqlash va tozalash.

## 5. Texnik va arxitektura tavsiyalari

### 5.1. Kod bazasini mustahkamlash

- Hardcoded ID larni konfiguratsiya yoki normal bog`lanishlar bilan almashtirish.
- Server action va UI orasida yagona validation qatlami qo`shish.
- `published` va schedule logikasini formdan serverga to`liq uzatish.
- Barcha matnli qidiruvlar uchun indexed ustunlar va keyinchalik full-text search ga tayyorgarlik.
- Upload va browse endpoint lariga role check, audit log va limit qo`shish.

### 5.2. Performance

- Dynamic render qilinayotgan sahifalarni qayta ko`rib chiqish; kerakli joylarda cache/revalidate ishlatish.
- `img` larni `next/image` yoki optimallashtirilgan wrapper orqali standartlashtirish.
- Home section data fetch larini yuk ostida profil qilish.
- Related posts, search va most viewed so`rovlariga index qo`shish.

### 5.3. Monitoring va ishonchlilik

- Error logging va admin action logging.
- Production healthcheck va diagnose bo`limini tizimli qilish.
- Backup, media retention va recovery bo`yicha aniq operatsion reglament.

## 6. Tavsiya etilgan bosqichma-bosqich roadmap

### 1-bosqich: Tez ta`sir beradigan ishlar (2-3 hafta)

- Post workflow: draft/published/scheduled ni haqiqiy ishlatish.
- Post list filterlari va dashboardni kengaytirish.
- SEO metadata va Open Graph ni yo`lga qo`yish.
- Search UX ni yaxshilash.
- Hardcoded ID va fallbacklarni kamaytirish.

### 2-bosqich: Redaksiya va growth funksiyalari (3-5 hafta)

- Role-based access.
- Revision history.
- Rich text editor.
- Media library va fayl governance.
- Trending, editor`s choice, popular content bloklari.

### 3-bosqich: Scale va monetizatsiyaga tayyorlash (4-6 hafta)

- Event-based analytics.
- Banner CTR va placement analytics.
- Advanced search yoki full-text search.
- CDN/object storage integratsiyasi.
- A/B test yoki homepage experiment qatlamlari.

## 7. Biznes natijasi nuqtai nazaridan kutiladigan foyda

Ushbu rivojlantirish quyidagi natijalarni beradi:

- Kontent chiqarish tezligi oshadi.
- Tahririyatdagi xatolar kamayadi.
- Search va SEO hisobiga organik trafik o`sadi.
- Foydalanuvchi sayt ichida ko`proq vaqt o`tkazadi.
- Admin panel kamroq qo`l mehnati bilan ko`proq material boshqarishga imkon beradi.
- Keyingi bosqichlarda reklama, hamkorlik yoki obuna modeliga tayyor platforma paydo bo`ladi.

## 8. Eng to`g`ri start nuqtasi

Agar ishlarni bitta ketma-ketlik bilan boshlasak, quyidagi tartib eng pragmatik bo`ladi:

1. Admin workflow va status modelini to`g`rilash.
2. SEO va post detail/category UX ni kuchaytirish.
3. Dashboard, analytics va search ni rivojlantirish.
4. Media library va role-based access ni kiritish.

Shu tartib texnik qarzni kamaytiradi va bir vaqtning o`zida biznesga ko`rinadigan natija beradi.
