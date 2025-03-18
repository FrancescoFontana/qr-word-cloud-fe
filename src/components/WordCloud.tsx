'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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
  fill: (word: Word) => string;
}

// Dynamically import the Cloud component with SSR disabled
const Cloud = dynamic(
  async () => {
    const mod = await import('react-d3-cloud');
    console.log('Loaded module:', mod);
    if (!mod.default) {
      console.error('Module does not have a default export:', mod);
      throw new Error('Failed to load Cloud component');
    }
    return mod.default;
  },
  {
    ssr: false,
    loading: () => (
      <div className="text-white text-2xl animate-pulse">
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
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  // Array of high-contrast colors for better visibility on dark background
  const colors = [
    '#FF1493', // Deep Pink
    '#00FF00', // Lime
    '#FFD700', // Gold
    '#FF4500', // Orange Red
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#FFFF00', // Yellow
    '#1E90FF', // Dodger Blue
    '#FF69B4', // Hot Pink
    '#7FFF00', // Chartreuse
  ];

  useEffect(() => {
    setMounted(true);
    
    // Update dimensions based on window size
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      console.log('Setting dimensions:', { width, height });
      setDimensions({ width, height });
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!Array.isArray(words)) {
      console.error('Words prop is not an array:', words);
      setProcessedWords([]);
      return;
    }

    try {
      // Convert string array to Word objects with larger sizes
      const processed = words
        .filter(word => typeof word === 'string' && word.trim().length > 0)
        .map(word => ({
          text: String(word).trim(),
          value: Math.random() * 80 + 60, // Random size between 60 and 140
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
      <div className="text-white text-2xl animate-pulse">
        Loading word cloud...
      </div>
    );
  }

  if (processedWords.length === 0) {
    return (
      <div className="text-white text-2xl animate-pulse">
        No words yet
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Cloud
        data={processedWords}
        width={dimensions.width}
        height={dimensions.height}
        font="Inter"
        fontSize={(word) => Math.max(word.value, 40)}
        rotate={0}
        padding={30}
        random={() => 0.5}
        fill={(word) => colors[Math.floor(Math.random() * colors.length)]}
      />
    </div>
  );
} 