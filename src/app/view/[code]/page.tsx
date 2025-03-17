'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWordCloudStore, wsService } from '@/services/websocket';

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

  useEffect(() => {
    wsService.connect(code);
    return () => {
      wsService.disconnect();
    };
  }, [code]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-1000 ${isBlurred ? 'blur-lg opacity-50' : ''}`}>
        <WordCloud words={words} />
      </div>

      {isBlurred && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 text-white text-center">
            <p className="text-sm">
              Waiting for new words...
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 