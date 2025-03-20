'use client';

import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
  isBlurred?: boolean;
}

export function WordCloud({ words, isBlurred = false }: WordCloudProps) {
  // Calculate min and max values for proper scaling
  const minValue = Math.min(...words.map(w => w.value));
  const maxValue = Math.max(...words.map(w => w.value));

  // Options for the word cloud
  const options = {
    rotations: 0,
    rotationAngles: [0],
    fontFamily: 'Titillium Web',
    fontSizes: [20, 60], // Min and max font sizes
    padding: 5,
    fontStyle: 'normal',
    fontWeight: 'bold',
    colors: ['#ffffff'],
    enableTooltip: false,
    deterministic: true,
    randomSeed: 42,
    minValue,
    maxValue,
    spiral: 'archimedean',
    scale: 'sqrt', // Use square root scaling for better visual distribution
    transitionDuration: 500,
  };

  return (
    <div className={`w-full h-full transition-all duration-500 ${isBlurred ? 'blur-xl' : ''}`}>
      <ReactWordcloud words={words} options={options} />
    </div>
  );
} 