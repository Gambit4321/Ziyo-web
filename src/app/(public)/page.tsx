import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PostCard from '@/components/PostCard';
import HeroSlider from '@/components/HeroSlider';
import VideoCarousel from '@/components/VideoCarousel';
import TabsSection from '@/components/TabsSection';
import AudioPlayer from '@/components/AudioPlayer';
import Link from 'next/link';
import styles from './page.module.css';
import { getHomeSections, getHomeSectionData } from '@/actions/home';
import { buildMetadata } from '@/lib/seo';
import type { Banner, Category, HomeSection, Post } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: "Bosh sahifa",
  description:
    "Ziyo.uz bosh sahifasida eng so'nggi maqolalar, videolar, audio materiallar va asosiy bo'limlar jamlangan.",
  path: '/',
});

type PostWithCategory = Post & {
  category: Category | null;
};

type AudioTrack = PostWithCategory;

type TabsSectionData = {
  all: PostWithCategory[];
  articles: PostWithCategory[];
  videos: PostWithCategory[];
};

type BannerSectionData = Banner | null;

type SectionWithData = HomeSection & {
  data: PostWithCategory[] | AudioTrack[] | TabsSectionData | BannerSectionData;
};

function renderPostCollection(
  section: HomeSection,
  posts: PostWithCategory[],
  stylesMap: typeof styles
) {
  if (posts.length === 0) {
    return null;
  }

  if (section.displayStyle === 'LIST') {
    return (
      <section key={section.id} className={stylesMap.section}>
        <div className={stylesMap.sectionHeader}>
          <h2>{section.title}</h2>
          <div className={stylesMap.line}></div>
        </div>
        <div className={stylesMap.listSection}>
          {posts.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} layout="list-detailed" />
          ))}
        </div>
      </section>
    );
  }

  if (section.displayStyle === 'GRID') {
    return (
      <section key={section.id} className={stylesMap.section}>
        <div className={stylesMap.sectionHeader}>
          <h2>{section.title}</h2>
          <div className={stylesMap.line}></div>
        </div>
        <div className={stylesMap.grid4}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} layout="grid-large" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <VideoCarousel
      key={section.id}
      posts={posts}
      title={section.title || ''}
      link={section.categorySlug ? `/category/${section.categorySlug}` : '#'}
      autoplaySeconds={section.autoplaySeconds || 0}
    />
  );
}

export default async function Home() {
  const [sections, topViewedPosts] = await Promise.all([
    getHomeSections(),
    prisma.post.findMany({
      where: {
        published: true,
        createdAt: { lte: new Date() },
      },
      include: { category: true },
      orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    }),
  ]);
  const visibleSections = sections.filter(s => s.isVisible);

  // Fetch data for all visible sections in parallel
  const sectionsWithData: SectionWithData[] = await Promise.all(
    visibleSections.map(async (section) => ({
      ...section,
      data: await getHomeSectionData(section),
    }))
  );

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        {sectionsWithData.map((section) => {
          const data = section.data;

          switch (section.type) {
            case 'HERO':
              return <HeroSlider key={section.id} slides={Array.isArray(data) ? (data as Banner[]) : []} />;

            case 'CAROUSEL':
              return renderPostCollection(section, Array.isArray(data) ? (data as PostWithCategory[]) : [], styles);

            case 'TABS':
              return (
                <TabsSection
                  key={section.id}
                  allPosts={!Array.isArray(data) && data ? data.all : []}
                  articlePosts={!Array.isArray(data) && data ? data.articles : []}
                  videoPosts={!Array.isArray(data) && data ? data.videos : []}
                />
              );

            case 'GRID':
              return renderPostCollection(section, Array.isArray(data) ? (data as PostWithCategory[]) : [], styles);




            case 'BANNER':
              if (Array.isArray(data) || !data) return null;
              return (
                <div key={section.id} className={styles.bannerSection}>
                  <div className={styles.bannerOverlay}>
                    <div className={styles.bannerContent}>
                      {data.topText && <span className={styles.bannerLabel}>{data.topText}</span>}
                      <h2 className={styles.bannerTitle}>{data.title}</h2>
                      {data.tagline && <p className={styles.bannerTagline}>{data.tagline}</p>}

                      <Link href={data.link || '#'} className={styles.bannerBtn}>
                        {data.buttonText || 'Batafsil'}
                      </Link>
                    </div>
                  </div>
                  <img src={data.image} alt={data.title} className={styles.sectionBanner} />
                </div>
              );

            case 'AUDIO':
              return <AudioPlayer key={section.id} tracks={Array.isArray(data) ? (data as AudioTrack[]) : []} />;

            default:
              return null;
          }
        })}

        {topViewedPosts.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Eng ko&apos;p o&apos;qilgan</h2>
              <div className={styles.line}></div>
            </div>
            <div className={styles.grid4}>
              {topViewedPosts.map((post) => (
                <PostCard key={post.id} post={post} layout="grid-large" />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

