'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWordCloudStore, wsService } from '@/services/websocket';

const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <p className="text-white/30 text-sm tracking-widest uppercase">Loading...</p>
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
      wsService.sendWord(input.trim());
      setInput('');
    } catch (err) {
      console.error('Failed to send word:', err);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-light tracking-widest uppercase mb-2">Contribute</h1>
          <p className="text-white/40 text-sm tracking-[0.2em] uppercase">Code: {code}</p>
        </div>
        
        {error && (
          <div className="text-red-400/80 text-sm tracking-wide text-center">
            {error}
          </div>
        )}
        
        <div className={`transition-all duration-1000 ${isBlurred ? 'opacity-30' : ''}`}>
          <WordCloud words={words} />
        </div>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a word..."
              className="flex-1 bg-transparent border-b border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors duration-200 text-sm tracking-wide"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm tracking-wider uppercase transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 