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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Word Cloud Container */}
        <div className={`relative mb-8 transition-all duration-500 ${blurred ? 'blur-sm' : ''}`}>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <WordCloud words={words} />
          </div>
        </div>

        {/* Display Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Artwork Display: {params.code}
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <p className="text-gray-600">
            This word cloud updates in real-time as participants contribute new words
          </p>
        </div>
      </div>
    </div>
  );
} 