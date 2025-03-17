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
      <p className="text-white/30 text-sm tracking-widest uppercase">Loading...</p>
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
      <div className={`absolute inset-0 transition-all duration-1000 ${isBlurred ? 'blur-xl opacity-30' : ''}`}>
        <WordCloud words={words} />
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${isBlurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-center">
          <QRCodeSVG
            value={artworkUrl}
            size={Math.min(180, window.innerWidth * 0.5)}
            level="H"
            includeMargin={true}
            className="mx-auto mb-6"
          />
          <p className="text-white/60 text-xs tracking-[0.2em] uppercase font-light">
            Scan to contribute
          </p>
        </div>
      </div>
    </div>
  );
} 