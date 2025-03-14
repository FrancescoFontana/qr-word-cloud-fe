'use client';

import { useEffect, useState } from 'react';
import { useWordCloudStore } from '@/store/wordCloudStore';
import WordCloud from '@/components/WordCloud';

interface PageProps {
  params: {
    code: string;
  };
}

export default function ArtworkPage({ params }: PageProps) {
  const { connect, disconnect, words, isBlurred, submitWord } = useWordCloudStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    connect(params.code);
    return () => disconnect();
  }, [params.code, connect, disconnect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      submitWord(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Word Cloud */}
      <div className={`absolute inset-0 transition-all duration-500 ${isBlurred ? 'blur-sm' : ''}`}>
        <WordCloud words={words} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-6">
            Artwork: {params.code}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter the first word that came to your mind..."
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 