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

  // Modern, elegant color palette
  const colors = [
    '#E8DFE0', // Soft Pearl
    '#C9D1D3', // Mist Gray
    '#F4D03F', // Elegant Gold
    '#D5B8B0', // Dusty Rose
    '#A2B3BB', // Steel Blue
    '#BFA5A4', // Mauve
    '#E6D2C7', // Champagne
    '#D3BBDD', // Lavender Mist
    '#B5D0D0', // Sea Glass
    '#CEB5A7', // Taupe
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
      // Count word occurrences
      const wordCounts = words.reduce((acc: { [key: string]: number }, word) => {
        const trimmedWord = String(word).trim().toLowerCase();
        if (trimmedWord.length > 0) {
          acc[trimmedWord] = (acc[trimmedWord] || 0) + 1;
        }
        return acc;
      }, {});

      // Convert to Word objects with size based on frequency
      const maxCount = Math.max(...Object.values(wordCounts));
      const minSize = 16; // Smaller minimum for mobile
      const maxSize = 100; // Reduced maximum for better mobile display

      const processed = Object.entries(wordCounts).map(([text, count]) => ({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        value: minSize + ((count / maxCount) * (maxSize - minSize))
      }));

      console.log('Word counts:', wordCounts);
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
        Caricamento word cloud...
      </div>
    );
  }

  if (processedWords.length === 0) {
    return (
      <div className="text-white text-2xl animate-pulse">
        In attesa...
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Cloud
        data={processedWords}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={(word) => word.value}
        rotate={0}
        padding={20}
        random={() => 0.5}
        fill={(word) => {
          const normalizedSize = (word.value - 16) / (100 - 16);
          const colorIndex = Math.floor(normalizedSize * (colors.length - 1));
          return colors[colorIndex];
        }}
      />
    </div>
  );
} 