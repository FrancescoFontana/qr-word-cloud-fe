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
      <p className="text-white/50 text-xl">Loading word cloud...</p>
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
    <div className="fixed inset-0 overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-1000 ${isBlurred ? 'blur-lg opacity-50' : ''}`}>
        <WordCloud words={words} />
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${isBlurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 text-white text-center">
          <QRCodeSVG
            value={artworkUrl}
            size={200}
            level="H"
            includeMargin={true}
            className="mx-auto mb-4"
          />
          <p className="text-sm">
            Scan to add words to the cloud
          </p>
        </div>
      </div>
    </div>
  );
} 