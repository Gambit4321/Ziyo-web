import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getMetadataBase, siteSeo } from '@/lib/seo';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${siteSeo.name} | Milliy-marifiy portal`,
    template: `%s | ${siteSeo.name}`,
  },
  description: siteSeo.description,
  applicationName: siteSeo.name,
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
