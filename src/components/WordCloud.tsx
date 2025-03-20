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

export function WordCloud({ words, isBlurred = false }: WordCloudProps) {
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

  const calculateFontSize = (value: number, maxValue: number, numWords: number) => {
    // Base size that scales with the number of words
    const baseSize = Math.max(12, Math.min(24, 24 - (numWords / 50)));
    // Scale factor based on container size
    const containerScale = Math.min(1, Math.max(0.5, dimensions.width / 500));
    // Calculate relative size based on value
    const relativeSize = value / maxValue;
    // Combine factors for final size
    return Math.max(12, baseSize * containerScale * (0.5 + relativeSize * 0.5));
  };

  // Generate a color based on the word's value
  const getWordColor = (value: number, maxValue: number) => {
    // Color palette with light, visible colors
    const colors = [
      '#FF6B6B', // Coral red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Sky blue
      '#96CEB4', // Sage green
      '#FFEEAD', // Cream yellow
      '#D4A5A5', // Dusty rose
      '#9B59B6', // Purple
      '#3498DB', // Blue
      '#E67E22', // Orange
      '#2ECC71', // Green
    ];
    
    // Use the word's value to select a color
    const colorIndex = Math.floor((value / maxValue) * colors.length);
    return colors[colorIndex % colors.length];
  };

  // Calculate maximum word value for font sizing
  const maxValue = Math.max(...words.map(w => w.value));
  const numWords = words.length;

  return (
    <div className="w-full h-full" style={{ position: 'relative' }}>
      <ReactWordcloud
        data={words}
        width={dimensions.width}
        height={dimensions.height}
        font="Titillium Web"
        fontSize={(word) => calculateFontSize(word.value, maxValue, numWords)}
        rotate={0}
        padding={5}
        random={() => 0.5} // Fixed random seed for consistent layout
        fill={(word) => getWordColor(word.value, maxValue)}
      />
    </div>
  );
} 