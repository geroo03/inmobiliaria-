import type { Metadata, Viewport } from 'next';
import './globals.css';
import { siteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Showroom virtual',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B1418' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
