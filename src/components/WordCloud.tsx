'use client';

import { useEffect, useState } from 'react';
import Cloud from 'react-d3-cloud';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: string[];
}

export function WordCloud({ words }: WordCloudProps) {
  const [mounted, setMounted] = useState(false);
  const [processedWords, setProcessedWords] = useState<Word[]>([]);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
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
      const minSize = 20; // Minimum size for readability
      const maxSize = 80; // Reduced maximum for better distribution

      const processed = Object.entries(wordCounts).map(([text, count]) => ({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        value: minSize + ((count / maxCount) * (maxSize - minSize))
      }));

      // Sort by frequency (descending) to place most frequent words first
      processed.sort((a, b) => b.value - a.value);

      setProcessedWords(processed);
    } catch (error) {
      console.error('Error processing words:', error);
      setProcessedWords([]);
    }
  }, [words]);

  if (!mounted || !fontLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Caricamento nuvola...
        </div>
      </div>
    );
  }

  if (processedWords.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-2xl">
          Nessuna parola ancora
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full h-full">
      <Cloud
        data={processedWords}
        width={800}
        height={600}
        font="Titillium Web"
        fontSize={(word) => word.value}
        rotate={0}
        padding={5}
        random={() => 0.5}
        fill={(word) => {
          const normalizedSize = (word.value - 20) / (80 - 20);
          const colorIndex = Math.floor(normalizedSize * (colors.length - 1));
          return colors[colorIndex];
        }}
      />
    </div>
  );
} 