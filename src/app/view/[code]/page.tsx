'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWordCloudStore, wsService } from '@/services/websocket';
import { QRCodeSVG } from 'qrcode.react';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <p className="text-white/20 text-sm tracking-[0.3em] uppercase font-light">Loading...</p>
    </div>
  ),
});

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const { words, isBlurred } = useWordCloudStore();

  // Construct the artwork page URL
  const artworkUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/artwork/${code}`
    : `https://qr-word-cloud-fe.onrender.com/artwork/${code}`;

  useEffect(() => {
    wsService.connect(code, true);
    return () => {
      wsService.disconnect();
    };
  }, [code]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Artistic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black/90" />
      
      {/* Word cloud with grayscale colors */}
      <div className={`absolute inset-0 transition-all duration-1000 ${isBlurred ? 'blur-xl opacity-20' : ''}`}>
        <WordCloud words={words} />
      </div>

      {/* Artistic overlay pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-white/50 to-transparent" />

      {/* Main content */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${isBlurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-center relative">
          {/* Decorative elements */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10" />
          
          <QRCodeSVG
            value={artworkUrl}
            size={Math.min(180, window.innerWidth * 0.5)}
            level="H"
            includeMargin={true}
            className="mx-auto mb-8"
          />
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-light">
            Scan to contribute
          </p>
        </div>
      </div>
    </div>
  );
} 