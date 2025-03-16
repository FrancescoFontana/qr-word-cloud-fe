'use client';

import { useEffect } from 'react';
import { useWordCloudStore, wsService } from '@/services/websocket';
import dynamic from 'next/dynamic';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
      <p className="text-gray-500 text-xl">Loading word cloud...</p>
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
    <div className="relative min-h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Word Cloud Container */}
      <div className={`absolute inset-0 transition-all duration-1000 ${blurred ? 'blur-lg opacity-50' : 'blur-none opacity-100'}`}>
        <WordCloud words={words} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Info Overlay - Only visible when blurred */}
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${blurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 text-white text-center">
          <p className="text-sm">
            Waiting for new words...
          </p>
        </div>
      </div>
    </div>
  );
} 