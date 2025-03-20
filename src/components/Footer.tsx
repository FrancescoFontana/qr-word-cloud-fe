'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="fixed bottom-4 left-0 right-0 flex flex-col items-center">
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <span>Powered by</span>
        <Image
          src="/grid_logo.png"
          alt="Grid Logo"
          width={20}
          height={20}
          className="h-5 w-auto"
        />
        <span>The Grid Company</span>
      </div>
      <p className="text-white/50 text-sm mt-2">
        © 2024 Unveiling Lights. All rights reserved.
      </p>
    </footer>
  );
} 