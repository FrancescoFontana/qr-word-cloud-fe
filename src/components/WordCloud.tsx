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

export default function WordCloud({ words = [] }: WordCloudProps) {
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
      // Scale between 20 and 100 based on frequency
      value: 20 + ((word.value - minValue) / (maxValue - minValue || 1)) * 80
    }));
  }, [words]);

  if (!words?.length) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-white/50 text-xl">No words yet</p>
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
        rotate={0}
        padding={3}
        random={() => 0.5}
        fill={(word: Word) => `hsl(${(word.value * 137.5) % 360}, 70%, 50%)`}
      />
    </div>
  );
} 