'use client';

import { useEffect, useState } from 'react';
import ReactWordcloud from 'react-d3-cloud';
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
  const [mounted, setMounted] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
  }, []);

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
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!mounted || !fontLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Caricamento nuvola...
        </div>
      </div>
    );
  }

  // Process words to count frequencies
  const wordFreq = words.reduce((acc: { [key: string]: number }, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  // Convert to array and sort by frequency
  const data: WordCloudData[] = Object.entries(wordFreq)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value);

  const colors = scaleOrdinal(schemeCategory10);

  // Calculate dynamic font sizes based on number of words
  const minSize = Math.max(20, Math.min(40, 100 / Math.sqrt(data.length)));
  const maxSize = Math.max(60, Math.min(120, 200 / Math.sqrt(data.length)));

  return (
    <div id="word-cloud-container" className="w-full h-full">
      <ReactWordcloud
        data={data}
        width={dimensions.width || 400}
        height={dimensions.height || 400}
        font="Titillium Web"
        fontSize={(word) => minSize + (word.value * (maxSize - minSize))}
        padding={5}
        random={() => 0.5}
        rotate={0}
        colors={colors}
        onWordMouseOver={(word: WordCloudData) => {
          console.log(`Mouse over word: ${word.text}`);
        }}
        onWordMouseOut={(word: WordCloudData) => {
          console.log(`Mouse out word: ${word.text}`);
        }}
      />
    </div>
  );
} 