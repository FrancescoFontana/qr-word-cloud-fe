'use client';

import { useEffect, useRef, useState } from 'react';
import ReactWordcloud from 'react-d3-cloud';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
  isBlurred?: boolean;
}

export default function WordCloud({ words, isBlurred = false }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when container size changes
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

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isBlurred ? 'opacity-50' : 'opacity-100'}`}
      style={{ minHeight: '300px' }}
    >
      <ReactWordcloud
        data={words}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={(word) => Math.log2(word.value) * 10 + 20}
        rotate={0}
        padding={5}
        random={() => 0.5} // Fixed random seed for consistent layout
        fill={() => '#ffffff'}
      />
    </div>
  );
} 