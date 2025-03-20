'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="fixed bottom-4 left-4 flex items-center gap-2 text-white/60 text-sm">
      <span>Powered by</span>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <Image
            src="/grid_logo.png"
            alt="Grid Logo"
            width={120}
            height={120}
            className="w-24 h-24"
          />
          <p className="text-white/50 text-sm mt-4">
            © 2024 Unveiling Lights. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 