'use client';

import { useEffect, useRef } from 'react';
import { useWordCloudStore, wsService } from '@/services/websocket';
import dynamic from 'next/dynamic';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <p className="text-white/50 text-xl">Loading word cloud...</p>
    </div>
  ),
});

interface PageProps {
  params: {
    code: string;
  };
}

export default function DisplayPage({ params }: PageProps) {
  const { words, error, isBlurred, setBlurred } = useWordCloudStore();
  const wordsRef = useRef(words);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    wsService.connect(params.code);
    return () => wsService.disconnect();
  }, [params.code]);

  useEffect(() => {
    // Check if words have changed
    if (words.length !== wordsRef.current.length) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Make word cloud nitid
      setBlurred(false);

      // Set timeout to blur after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setBlurred(true);
      }, 3000);

      // Update ref
      wordsRef.current = words;
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [words, setBlurred]);

  return (
    <main className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      {/* Word Cloud Container */}
      <div className={`absolute inset-0 transition-all duration-1000 ${isBlurred ? 'blur-lg opacity-50' : ''}`}>
        <div className="absolute inset-0">
          <WordCloud words={words} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Info Message - Only visible when blurred */}
      {isBlurred && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 text-white text-center">
            <p className="text-sm">
              Waiting for new words...
            </p>
          </div>
        </div>
      )}
    </main>
  );
} 