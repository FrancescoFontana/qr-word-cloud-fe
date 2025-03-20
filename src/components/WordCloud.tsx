'use client';

import { useEffect, useState } from 'react';
import ReactWordcloud from 'react-d3-cloud';
import { useWordCloudStore } from '@/store/wordCloudStore';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
  isBlurred?: boolean;
}

export function WordCloud({ words, isBlurred = false }: WordCloudProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load font
  useEffect(() => {
    const loadFont = async () => {
      try {
        await document.fonts.load('1em "Titillium Web"');
        setFontLoaded(true);
      } catch (error) {
        console.error('Failed to load font:', error);
      }
    };
    loadFont();
  }, []);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('word-cloud-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  if (!fontLoaded) {
    return null;
  }

  // Calculate font size based on word frequency and total number of words
  const getFontSize = (word: Word) => {
    // Find the maximum value in the words array
    const maxValue = Math.max(...words.map(w => w.value));
    // Calculate a base size that scales with the number of words
    const baseSize = Math.min(20, Math.max(12, 30 - words.length * 0.5));
    // Scale the font size based on the word's value relative to the maximum
    return Math.round((word.value / maxValue) * 40 + baseSize);
  };

  return (
    <div id="word-cloud-container" className={`w-full h-full transition-all duration-500 ${isBlurred ? 'blur-xl' : ''}`}>
      <ReactWordcloud
        data={words}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={getFontSize}
        rotate={0}
        padding={5}
        random={() => 0.5} // Use fixed random value for consistent layout
        fill={() => '#ffffff'}
      />
    </div>
  );
} 