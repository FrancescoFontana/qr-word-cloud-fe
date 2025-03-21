'use client';

import { useEffect, useState } from 'react';
import { WordMap } from '@/components/WordMap';
import { Word } from '@/types/word';

export default function ShowroomPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Initial words
    const initialWords: Word[] = [
      { text: 'Light', value: 60 },
      { text: 'Hope', value: 45 },
      { text: 'Peace', value: 40 },
      { text: 'Love', value: 35 },
      { text: 'Joy', value: 30 },
      { text: 'Faith', value: 25 },
      { text: 'Grace', value: 20 },
      { text: 'Truth', value: 15 },
      { text: 'Life', value: 10 },
      { text: 'Home', value: 5 }
    ];
    setWords(initialWords);

    // Simulate word updates
    const interval = setInterval(() => {
      setWords(prevWords => {
        const newWords = [...prevWords];
        const randomIndex = Math.floor(Math.random() * newWords.length);
        newWords[randomIndex] = {
          ...newWords[randomIndex],
          value: Math.max(5, newWords[randomIndex].value + Math.random() * 10)
        };
        return newWords;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-white mb-8">Word Cloud Showroom</h1>
      <div className="relative h-[600px] w-full">
        <WordMap words={words} isBlurred={isBlurred} />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsBlurred(!isBlurred)}
            className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
          >
            {isBlurred ? 'Show Words' : 'Hide Words'}
          </button>
        </div>
      </div>
    </main>
  );
} 