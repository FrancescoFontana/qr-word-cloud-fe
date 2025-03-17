'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

interface Word {
  text: string;
  value: number;
}

interface CloudProps {
  data: Word[];
  width: number;
  height: number;
  font: string;
  fontSize: (word: Word) => number;
  rotate: number;
  padding: number;
  random: () => number;
}

// Dynamically import the Cloud component with SSR disabled
const Cloud = dynamic(
  () => import('react-d3-cloud').then((mod) => {
    console.log('Module loaded:', mod);
    return mod.default as ComponentType<CloudProps>;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="text-white/80 text-lg animate-pulse-slow">
        Loading word cloud...
      </div>
    ),
  }
);

interface WordCloudProps {
  words: string[];
}

export function WordCloud({ words }: WordCloudProps) {
  const [mounted, setMounted] = useState(false);
  const [processedWords, setProcessedWords] = useState<Word[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!Array.isArray(words)) {
      console.error('Words prop is not an array:', words);
      setProcessedWords([]);
      return;
    }

    try {
      // Convert string array to Word objects with random sizes
      const processed = words
        .filter(word => typeof word === 'string' && word.trim().length > 0)
        .map(word => ({
          text: String(word).trim(),
          value: Math.random() * 50 + 20, // Random size between 20 and 70
        }));
      console.log('Processed words:', processed);
      setProcessedWords(processed);
    } catch (error) {
      console.error('Error processing words:', error);
      setProcessedWords([]);
    }
  }, [words]);

  if (!mounted) {
    return (
      <div className="text-white/80 text-lg animate-pulse-slow">
        Loading word cloud...
      </div>
    );
  }

  if (processedWords.length === 0) {
    return (
      <div className="text-white/80 text-lg animate-pulse-slow">
        No words yet
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] flex items-center justify-center">
      {mounted && (
        <Cloud
          data={processedWords}
          width={800}
          height={600}
          font="Inter"
          fontSize={(word: Word) => word.value}
          rotate={0}
          padding={5}
          random={() => 0.5}
        />
      )}
    </div>
  );
} 