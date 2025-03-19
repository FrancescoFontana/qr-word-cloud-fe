import type { Metadata } from 'next';
import { Inter, Titillium_Web } from 'next/font/google';
import './globals.css';

const titillium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
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
      <body className={`${titillium.variable} font-titillium`}>{children}</body>
    </html>
  );
}