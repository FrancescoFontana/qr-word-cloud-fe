'use client';

import { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
}

// Dynamically import the Cloud component with no SSR
const Cloud = dynamic(() => import('react-d3-cloud'), {
  ssr: false,
});

export const WordCloud = ({ words = [] }: WordCloudProps) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const cloudWords = useMemo(() => {
    if (!words?.length) return [];
    
    // Find the maximum value for scaling
    const maxValue = Math.max(...words.map(w => w.value));
    const minValue = Math.min(...words.map(w => w.value));
    
    // Scale the values for better visualization
    return words.map(word => ({
      ...word,
      // Scale between 30 and 120 based on frequency for better visibility
      value: 30 + ((word.value - minValue) / (maxValue - minValue || 1)) * 90
    }));
  }, [words]);

  if (!words?.length) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-white/50 text-xl tracking-widest uppercase">No words yet</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Cloud
        data={cloudWords}
        width={dimensions.width}
        height={dimensions.height}
        font="Inter"
        fontSize={(word: Word) => word.value}
        rotate={15}
        padding={5}
        random={() => 0.5}
        fill={(word: Word) => {
          // Create a more artistic color scheme with better contrast
          const value = word.value;
          if (value > 100) {
            // Most prominent words in bright white
            return '#ffffff';
          } else if (value > 80) {
            // Very prominent words in light gray with slight blue tint
            return '#e0e0ff';
          } else if (value > 60) {
            // Medium prominent words in light gray with slight purple tint
            return '#e0e0e0';
          } else if (value > 40) {
            // Less prominent words in medium gray with slight pink tint
            return '#c0c0c0';
          } else {
            // Least prominent words in darker gray with slight green tint
            return '#a0a0a0';
          }
        }}
      />
    </div>
  );
}; 