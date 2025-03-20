'use client';

import { useEffect, useState, useRef } from 'react';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface WordCloudProps {
  words: string[];
}

export function WordCloud({ words }: WordCloudProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fontLoaded, setFontLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!fontLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  // Process words to count frequencies
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to word cloud format and sort by frequency
  const wordCloudData = Object.entries(wordCounts)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate font size based on number of words
  const minFontSize = 20;
  const maxFontSize = 80;
  const totalWords = wordCloudData.length;
  const fontSizeRange = maxFontSize - minFontSize;
  const fontSizeStep = fontSizeRange / Math.max(totalWords, 1);

  const options = {
    rotations: 2,
    rotationAngles: [0, 90],
    fontSizes: [minFontSize, maxFontSize],
    padding: 5,
    fontFamily: 'Titillium Web, sans-serif',
    colors: ['#ffffff'],
    enableTooltip: true,
    deterministic: true,
    width: dimensions.width,
    height: dimensions.height,
    minFontSize,
    maxFontSize,
    spiral: 'archimedean',
    tooltipOptions: {
      theme: 'dark',
      placement: 'top',
      animation: 'scale',
    },
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      {wordCloudData.length > 0 ? (
        <ReactWordcloud words={wordCloudData} options={options} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-xl">No words yet</div>
        </div>
      )}
    </div>
  );
} 