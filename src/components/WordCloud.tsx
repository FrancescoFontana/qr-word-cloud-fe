'use client';

import { useEffect, useState } from 'react';
import ReactWordcloud from 'react-d3-cloud';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

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

  useEffect(() => {
    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      console.log('🔵 [WordCloud] Font loaded');
      setFontLoaded(true);
    });

    // Update dimensions
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight - 64; // Subtract header height
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!fontLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const colors = scaleOrdinal(schemeCategory10);

  return (
    <div className={`w-full h-full transition-all duration-500 ${isBlurred ? 'blur-xl' : ''}`}>
      <ReactWordcloud
        data={words}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={(word) => Math.log2(word.value) * 10 + 20} // Scale font size based on word frequency
        rotate={0}
        padding={5}
        random={() => 0.5}
        fill={() => '#ffffff'}
      />
    </div>
  );
} 