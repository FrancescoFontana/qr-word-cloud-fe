'use client';

import Image from 'next/image';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={200}
            height={200}
            className="mb-2"
          />
          <h1 className="text-3xl font-light text-white text-center">
            Unveiling Lights
          </h1>
        </div>
      </div>
    </header>
  );
} 