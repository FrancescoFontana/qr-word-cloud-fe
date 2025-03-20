'use client';

import { useEffect, useState, useRef } from 'react';
import ReactWordCloud from 'react-d3-cloud';
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

  const colors = scaleOrdinal(schemeCategory10);

  return (
    <div ref={containerRef} className={`w-full h-full transition-all duration-1000 ${isBlurred ? 'blur-sm' : 'blur-0'}`}>
      <ReactWordCloud
        data={words}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={(word: Word) => Math.log2(word.value) * 5}
        rotate={0}
        padding={5}
        random={() => 0.5}
        fill={(word: Word) => colors(word.text)}
      />
    </div>
  );
} 