'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="fixed bottom-4 left-4 flex items-center gap-2 text-white/60 text-sm">
      <span>Powered by</span>
      <Image
        src="/grid.svg"
        alt="The Grid Company Logo"
        width={20}
        height={20}
        className="h-5 w-auto"
      />
      <span>The Grid Company</span>
    </footer>
  );
} 