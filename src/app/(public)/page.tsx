import Link from 'next/link';
import type { Banner, Category, HomeSection, Post } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import PostCard from '@/components/PostCard';
import Sidebar from '@/components/Sidebar';
import HeroSlider from '@/components/HeroSlider';
import VideoCarousel from '@/components/VideoCarousel';
import CategoryCarousel from '@/components/CategoryCarousel';
import TabsSection from '@/components/TabsSection';
import AudioPlayer from '@/components/AudioPlayer';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type PostWithCategory = Post & {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
};

type CategoryWithCount = Pick<Category, 'id' | 'name' | 'slug' | 'image' | 'parentId'> & {
  _count: { posts: number };
};

type SourceMeta = Pick<Category, 'id' | 'name' | 'slug'>;
type BannerItem = Pick<Banner, 'id' | 'title' | 'topText' | 'tagline' | 'image' | 'link' | 'buttonText'>;

function isSpecialSection(section: HomeSection) {
  return section.type === 'HERO' || section.type === 'AUDIO' || section.type === 'TABS';
}

function getSectionLimit(section: HomeSection) {
  const rows = Math.max(section.rowCount || 1, 1);

  if (section.displayStyle === 'CAROUSEL') {
    return 12;
  }

  if (section.displayStyle === 'LIST') {
    return rows;
  }

  return rows * 3;
}

function getSectionLink(section: HomeSection, sourceMap: Map<string, SourceMeta>) {
  if (section.type === 'LATEST_AUDIO') {
    return '/latest?type=audio';
  }

  if (section.sourceId === 'GLOBAL' || section.type === 'FEATURED' || section.type === 'BANNER') {
    return undefined;
  }

  if (section.sourceId) {
    const source = sourceMap.get(section.sourceId);
    if (source) {
      return `/category/${source.slug}`;
    }
  }

  if (section.categorySlug) {
    return `/category/${section.categorySlug}`;
  }

  return undefined;
}

function BannerSection({ banner }: { banner: BannerItem }) {
  return (
    <section className={styles.bannerSection}>
      <img src={banner.image} alt={banner.title} className={styles.sectionBanner} />
      <div className={styles.bannerOverlay}>
        <div className={styles.bannerContent}>
          {banner.topText ? <span className={styles.bannerLabel}>{banner.topText}</span> : null}
          <h2 className={styles.bannerTitle}>{banner.title}</h2>
          {banner.tagline ? <p className={styles.bannerTagline}>{banner.tagline}</p> : null}
          {banner.link ? (
            <Link href={banner.link} className={styles.bannerBtn}>
              {banner.buttonText || 'Batafsil'}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeaderInner}>
        <h2>{title}</h2>
        <div className={styles.line}></div>
      </div>
      {link ? (
        <Link href={link} className={styles.viewAll}>
          Barchasini ko&apos;rish
        </Link>
      ) : null}
    </div>
  );
}

function EmptySection({ title, link }: { title: string; link?: string }) {
  return (
    <section className={styles.section}>
      <SectionHeader title={title} link={link} />
      <div className={styles.emptyState}>
        <p>Ushbu bo&apos;limda hozircha ma&apos;lumot yo&apos;q.</p>
      </div>
    </section>
  );
}

function PostCollection({
  posts,
  title,
  link,
  displayStyle,
}: {
  posts: PostWithCategory[];
  title: string;
  link?: string;
  displayStyle: string;
}) {
  if (displayStyle === 'LIST') {
    return (
      <section className={styles.section}>
        <SectionHeader title={title} link={link} />
        <div className={styles.postList}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} hideThumbnail />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <SectionHeader title={title} link={link} />
      <div className={styles.postGrid}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function CategoryCollection({
  categories,
  title,
  link,
  displayStyle,
}: {
  categories: CategoryWithCount[];
  title: string;
  link?: string;
  displayStyle: string;
}) {
  return (
    <section className={styles.section}>
      <SectionHeader title={title} link={link} />
      <div className={displayStyle === 'LIST' ? styles.categoryList : styles.categoryGrid}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={displayStyle === 'LIST' ? styles.categoryListCard : styles.categoryCard}
          >
            <div className={styles.categoryThumb}>
              {category.image ? (
                <img src={category.image} alt={category.name} className={styles.categoryImage} />
              ) : (
                <div className={styles.categoryPlaceholder}>{category.name.charAt(0)}</div>
              )}
            </div>
            <div className={styles.categoryBody}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <p className={styles.categoryMeta}>{category._count.posts} material</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function getSections() {
  return prisma.homeSection.findMany({
    where: { isVisible: true },
    orderBy: { order: 'asc' },
  });
}

export default async function Home() {
  const sections = await getSections();
  const dataMap: Record<string, PostWithCategory[] | CategoryWithCount[] | BannerItem | null> = {};

  const sourceIds = [...new Set(sections.map((section) => section.sourceId).filter(Boolean))] as string[];
  const sourceCategories = sourceIds.length
    ? await prisma.category.findMany({
        where: { id: { in: sourceIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const sourceMap = new Map(sourceCategories.map((category) => [category.id, category]));

  await Promise.all(
    sections.map(async (section) => {
      if (isSpecialSection(section)) {
        return;
      }

      const take = getSectionLimit(section);

      if (section.type === 'BANNER') {
        dataMap[section.id] = await prisma.banner.findFirst({
          where: {
            deletedAt: null,
            isActive: true,
            ...(section.sourceId ? { id: section.sourceId } : {}),
          },
          select: {
            id: true,
            title: true,
            topText: true,
            tagline: true,
            image: true,
            link: true,
            buttonText: true,
          },
          orderBy: section.sourceId ? undefined : { createdAt: 'desc' },
        });
        return;
      }

      if (section.type === 'FEATURED' || section.type === 'LATEST_AUDIO') {
        dataMap[section.id] = await prisma.post.findMany({
          where: {
            published: true,
            ...(section.type === 'FEATURED' ? { featured: true } : { type: 'audio' }),
          },
          take,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' },
        });
        return;
      }

      if (
        (section.sourceType === 'CATEGORY' && (section.sourceId || section.categorySlug)) ||
        section.sourceId === 'GLOBAL'
      ) {
        const whereClause = section.sourceId
          ? section.sourceId === 'GLOBAL'
            ? {}
            : { categoryId: section.sourceId }
          : section.categorySlug
            ? { category: { slug: section.categorySlug } }
            : {};

        dataMap[section.id] = await prisma.post.findMany({
          where: {
            ...whereClause,
            published: true,
          },
          take,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: section.sortType === 'MOST_VIEWED' ? { views: 'desc' } : { createdAt: 'desc' },
        });
        return;
      }

      if (section.sourceType === 'SECTION' && section.sourceId) {
        dataMap[section.id] = await prisma.category.findMany({
          where: { parentId: section.sourceId },
          take,
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            parentId: true,
            _count: {
              select: { posts: true },
            },
          },
          orderBy: { order: 'asc' },
        });
      }
    })
  );

  const hasTabs = sections.some((section) => section.type === 'TABS');
  let tabsData: { latest: PostWithCategory[]; articles: PostWithCategory[]; videos: PostWithCategory[] } | null = null;

  if (hasTabs) {
    const [latest, articles, videos] = await Promise.all([
      prisma.post.findMany({
        take: 6,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        where: { published: true },
      }),
      prisma.post.findMany({
        where: { type: 'standard', published: true },
        take: 6,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.findMany({
        where: { type: 'video', published: true },
        take: 6,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    tabsData = { latest, articles, videos };
  }

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        {sections
          .filter((section) => section.type === 'HERO')
          .map((section) => <HeroSlider key={section.id} />)}

        <div className={styles.mainGrid}>
          <div className={styles.leftContent}>
            {sections
              .filter((section) => section.type !== 'HERO')
              .map((section) => {
                if (section.type === 'AUDIO') {
                  return <AudioPlayer key={section.id} />;
                }

                if (section.type === 'TABS' && tabsData) {
                  return (
                    <TabsSection
                      key={section.id}
                      allPosts={tabsData.latest}
                      articlePosts={tabsData.articles}
                      videoPosts={tabsData.videos}
                    />
                  );
                }

                const data = dataMap[section.id];
                const title = section.title || "Bo'lim";
                const link = getSectionLink(section, sourceMap);

                if (!data || data.length === 0) {
                  return <EmptySection key={section.id} title={title} link={link} />;
                }

                if (section.type === 'BANNER') {
                  return <BannerSection key={section.id} banner={data as BannerItem} />;
                }

                if (section.sourceType === 'SECTION') {
                  const categories = data as CategoryWithCount[];

                  if (section.displayStyle === 'CAROUSEL') {
                    return (
                      <CategoryCarousel
                        key={section.id}
                        categories={categories}
                        title={title}
                        link={link}
                        autoplaySeconds={section.autoplaySeconds}
                      />
                    );
                  }

                  return (
                    <CategoryCollection
                      key={section.id}
                      categories={categories}
                      title={title}
                      link={link}
                      displayStyle={section.displayStyle}
                    />
                  );
                }

                const posts = data as PostWithCategory[];

                if (section.displayStyle === 'CAROUSEL') {
                  return (
                    <VideoCarousel
                      key={section.id}
                      posts={posts}
                      title={title}
                      link={link || '#'}
                      autoplaySeconds={section.autoplaySeconds}
                    />
                  );
                }

                return (
                  <PostCollection
                    key={section.id}
                    posts={posts}
                    title={title}
                    link={link}
                    displayStyle={section.displayStyle}
                  />
                );
              })}
          </div>

          <div className={styles.sidebarWrapper}>
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
