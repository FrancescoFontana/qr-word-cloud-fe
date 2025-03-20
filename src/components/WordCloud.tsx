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

  return (
    <div className="w-full h-full">
      <ReactWordcloud
        data={data}
        width={400}
        height={400}
        font="Titillium Web"
        fontSize={(word) => 20 + (word.value * 60)}
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