'use client';

import Image from 'next/image';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="h-full flex items-center justify-center">
        <Image
          src="/logo.svg"
          alt="QR Word Cloud Logo"
          width={48}
          height={48}
          className="h-12 w-auto"
        />
      </div>
    </header>
  );
} 