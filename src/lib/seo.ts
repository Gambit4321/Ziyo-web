import type { Metadata } from 'next';

const DEFAULT_SITE_NAME = 'Ziyo.uz';
const DEFAULT_SITE_DESCRIPTION =
  "Ziyo.uz - O'zbekiston va dunyodagi dolzarb maqolalar, audio va video materiallar.";
const DEFAULT_SITE_URL = 'https://ziyo.uz';
const DEFAULT_OG_IMAGE = '/images/logo.png';

function normalizeSiteUrl(value?: string | null) {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }

  return `https://${trimmed.replace(/\/+$/, '')}`;
}

export function getSiteUrl() {
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL
  );
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) {
    return new URL(DEFAULT_OG_IMAGE, getMetadataBase()).toString();
  }

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`, getMetadataBase()).toString();
  }
}

export function stripHtml(value?: string | null) {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value?: string | null, maxLength = 160) {
  const clean = stripHtml(value);

  if (!clean) {
    return DEFAULT_SITE_DESCRIPTION;
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

type SeoOptions = {
  title: string;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
};

export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  section,
}: SeoOptions): Metadata {
  const resolvedDescription = truncateText(description);
  const canonicalPath = path.startsWith('/') ? path : `/${path}`;
  const absoluteUrl = toAbsoluteUrl(canonicalPath);
  const absoluteImage = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: absoluteUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      url: absoluteUrl,
      title,
      description: resolvedDescription,
      siteName: DEFAULT_SITE_NAME,
      locale: 'uz_UZ',
      images: [
        {
          url: absoluteImage,
          alt: title,
        },
      ],
      publishedTime,
      modifiedTime,
      section,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: resolvedDescription,
      images: [absoluteImage],
    },
  };
}

export const siteSeo = {
  name: DEFAULT_SITE_NAME,
  description: DEFAULT_SITE_DESCRIPTION,
};
