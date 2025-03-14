'use client';

import { useState } from 'react';
import WordCloud from '@/components/WordCloud';
import QRCode from '@/components/QRCode';

export default function Home() {
  const [text, setText] = useState('');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">QR Word Cloud Generator</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type or paste your text here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
            <WordCloud text={text} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">QR Code</h2>
            <QRCode text={text} />
          </div>
        </div>
      </div>
    </div>
  );
} 