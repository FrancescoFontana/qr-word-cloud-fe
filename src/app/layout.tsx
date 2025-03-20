import type { Metadata } from 'next';
import { Titillium_Web } from 'next/font/google';
import './globals.css';

const titilliumWeb = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  variable: '--font-titillium',
});

export const metadata: Metadata = {
  title: 'QR Word Cloud',
  description: 'Leave a word in the clouds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${titilliumWeb.variable} font-sans bg-black text-white`}>
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center items-center">
            <img src="/logo.svg" alt="QR Word Cloud Logo" className="h-12 w-auto" />
          </div>
        </header>
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}