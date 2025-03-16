'use client';

import { useEffect, useState } from 'react';
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

export default function ArtworkPage({ params }: PageProps) {
  const { words, error } = useWordCloudStore();
  const [inputValue, setInputValue] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    wsService.connect(params.code);
    return () => wsService.disconnect();
  }, [params.code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      try {
        await wsService.sendWord(inputValue.trim());
        setInputValue('');
        setHasSubmitted(true);
      } catch (err) {
        console.error('Failed to send word:', err);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Word Cloud Container */}
      <div className="absolute inset-0">
        <WordCloud words={words} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Input Form - Only visible before first submission */}
      {!hasSubmitted && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a word..."
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Success Message - Shown briefly after submission */}
      {hasSubmitted && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 opacity-0 animate-fade-out">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 text-white text-center">
            <p className="text-sm">
              Word added successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 