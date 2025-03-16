'use client';

import { useEffect } from 'react';
import { useWordCloudStore, wsService } from '@/services/websocket';
import dynamic from 'next/dynamic';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <p className="text-gray-500">Loading word cloud...</p>
    </div>
  ),
});

interface PageProps {
  params: {
    code: string;
  };
}

export default function DisplayPage({ params }: PageProps) {
  const { words, blurred, error } = useWordCloudStore();

  useEffect(() => {
    wsService.connect(params.code);
    return () => wsService.disconnect();
  }, [params.code]);

  return (
    <div className="min-h-screen relative">
      <div className={`absolute inset-0 transition-all duration-500 ${blurred ? 'blur-sm' : ''}`}>
        <WordCloud words={words} />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Artwork: {params.code}
          </h1>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <p className="text-white/80">
            Word cloud updates in real-time as new words are submitted
          </p>
        </div>
      </div>
    </div>
  );
} 