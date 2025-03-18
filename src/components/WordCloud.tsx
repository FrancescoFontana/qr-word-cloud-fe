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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Array of vibrant colors for better visibility on dark background
  const colors = [
    '#FF69B4', // Hot Pink
    '#00CED1', // Dark Turquoise
    '#FFD700', // Gold
    '#FF6347', // Tomato
    '#32CD32', // Lime Green
    '#BA55D3', // Medium Orchid
    '#00BFFF', // Deep Sky Blue
    '#FFA500', // Orange
    '#9370DB', // Medium Purple
    '#7FFFD4', // Aquamarine
  ];

  useEffect(() => {
    setMounted(true);
    
    // Update dimensions based on container size
    const updateDimensions = () => {
      const container = document.querySelector('.word-cloud-container');
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
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
      // Convert string array to Word objects with random sizes
      const processed = words
        .filter(word => typeof word === 'string' && word.trim().length > 0)
        .map(word => ({
          text: String(word).trim(),
          value: Math.random() * 60 + 40, // Random size between 40 and 100
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
    <div className="word-cloud-container w-full h-full min-h-[400px] flex items-center justify-center">
      <Cloud
        data={processedWords}
        width={dimensions.width}
        height={dimensions.height}
        font="Inter"
        fontSize={(word) => Math.max(word.value, 20)} // Ensure minimum font size
        rotate={0}
        padding={20}
        random={() => 0.5}
        fill={(word) => colors[Math.floor(Math.random() * colors.length)]}
      />
    </div>
  );
} 