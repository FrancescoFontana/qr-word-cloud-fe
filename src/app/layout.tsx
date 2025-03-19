import type { Metadata } from 'next';
import { Titillium_Web } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const titillium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  display: 'swap',
  preload: true,
  variable: '--font-titillium',
});

export const metadata: Metadata = {
  title: 'QR Word Cloud',
  description: 'Interactive word cloud with QR code contribution',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${titillium.variable} font-titillium`}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-white text-xl font-bold hover:text-white/80 transition-colors">
              QR Word Cloud
            </Link>
            <Link href="/gallery" className="text-white text-xl hover:text-white/80 transition-colors">
              Galleria
            </Link>
          </div>
        </nav>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}