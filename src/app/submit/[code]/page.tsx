'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import WordCloud from '@/components/WordCloud';
import { useWordCloudStore, wsService } from '@/services/websocket';

export default function SubmitPage() {
  const params = useParams();
  const code = params.code as string;
  const [input, setInput] = useState('');
  const { words, blurred } = useWordCloudStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send the new word to the server
    wsService.sendMessage({
      type: 'add_word',
      code,
      word: input.trim(),
    });

    setInput('');
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Submit Words</h1>
        <p className="text-center text-gray-600">Code: {code}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
          <div className={`transition-all duration-1000 ${blurred ? 'blur-sm' : ''}`}>
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