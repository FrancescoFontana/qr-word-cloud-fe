'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWordCloudStore, wsService } from '@/services/websocket';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <p className="text-gray-500">Loading word cloud...</p>
    </div>
  ),
});

export default function SubmitPage() {
  const params = useParams();
  const code = params.code as string;
  const [input, setInput] = useState('');
  const { words, isBlurred, error } = useWordCloudStore();

  useEffect(() => {
    wsService.connect(code, false);
    return () => {
      wsService.disconnect();
    };
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Send the new word to the server
      wsService.sendWord(input.trim());
      setInput('');
    } catch (err) {
      console.error('Failed to send word:', err);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Submit Words</h1>
        <p className="text-center text-gray-600">Code: {code}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
          <div className={`transition-all duration-1000 ${isBlurred ? 'blur-sm' : ''}`}>
            <WordCloud words={words} />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a word..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 