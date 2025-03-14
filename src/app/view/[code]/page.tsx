'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import WordCloud from '@/components/WordCloud';
import { useWordCloudStore, wsService } from '@/services/websocket';

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const { words, blurred } = useWordCloudStore();

  useEffect(() => {
    wsService.connect(code);
    return () => {
      wsService.disconnect();
    };
  }, [code]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Word Cloud Display</h1>
        <p className="text-center text-gray-600">Code: {code}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
          <div className={`transition-all duration-1000 ${blurred ? 'blur-sm' : ''}`}>
            <WordCloud words={words} />
          </div>
        </div>
      </div>
    </main>
  );
} 