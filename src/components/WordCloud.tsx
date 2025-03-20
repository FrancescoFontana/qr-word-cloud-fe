'use client';

import { useEffect, useState, useRef } from 'react';
import ReactWordCloud from 'react-d3-cloud';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

interface WordCloudProps {
  words: string[];
}

interface WordCloudData {
  text: string;
  value: number;
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
  const data: WordCloudData[] = Object.entries(wordCounts)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate font size based on number of words
  const minFontSize = 20;
  const maxFontSize = 80;
  const totalWords = data.length;

  return (
    <div ref={containerRef} className="w-full h-full">
      {data.length > 0 ? (
        <ReactWordCloud
          data={data}
          width={dimensions.width}
          height={dimensions.height}
          font="Titillium Web"
          fontSize={(word) => Math.max(minFontSize, Math.min(maxFontSize, minFontSize + word.value * 10))}
          padding={5}
          rotate={0}
          fill={() => '#ffffff'}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-xl">No words yet</div>
        </div>
      )}
    </div>
  );
} 