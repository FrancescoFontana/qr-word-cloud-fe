'use client';

import { useEffect, useState, Suspense } from 'react';
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

function ArtworkContent({ code }: { code: string }) {
  const { words, blurred, error } = useWordCloudStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    wsService.connect(code);
    return () => wsService.disconnect();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      try {
        await wsService.sendWord(inputValue.trim());
        setInputValue('');
      } catch (err) {
        console.error('Failed to send word:', err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Word Cloud Container */}
        <div className={`relative mb-8 transition-all duration-500 ${blurred ? 'blur-sm' : ''}`}>
          <div className="bg-white rounded-lg shadow-lg p-4 min-h-[400px]">
            <WordCloud words={words} />
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            Contribute to Artwork: {code}
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter a word to add to the cloud..."
                maxLength={50}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={!inputValue.trim()}
              >
                Add Word
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ArtworkPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-500">Loading artwork...</p>
          </div>
        </div>
      </div>
    }>
      <ArtworkContent code={params.code} />
    </Suspense>
  );
} 