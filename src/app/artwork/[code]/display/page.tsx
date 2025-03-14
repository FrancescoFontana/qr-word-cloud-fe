'use client';

import { useEffect } from 'react';
import { useWordCloudStore } from '@/store/wordCloudStore';
import WordCloud from '@/components/WordCloud';

interface PageProps {
  params: {
    code: string;
  };
}

export default function DisplayPage({ params }: PageProps) {
  const { connect, disconnect, words, isBlurred } = useWordCloudStore();

  useEffect(() => {
    connect(params.code);
    return () => disconnect();
  }, [params.code, connect, disconnect]);

  return (
    <div className="min-h-screen relative">
      <div className={`absolute inset-0 transition-all duration-500 ${isBlurred ? 'blur-sm' : ''}`}>
        <WordCloud words={words} />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Artwork: {params.code}
          </h1>
          <p className="text-white/80">
            Word cloud updates in real-time as new words are submitted
          </p>
        </div>
      </div>
    </div>
  );
} 