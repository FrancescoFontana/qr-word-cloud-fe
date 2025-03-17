'use client';

import React from 'react';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface WordCloudProps {
  words: Array<{
    text: string;
    value: number;
  }>;
}

const WordCloud: React.FC<WordCloudProps> = ({ words }) => {
  const options = {
    rotations: 0,
    rotationAngles: [0],
    fontSizes: [20, 60],
    padding: 5,
    fontFamily: 'Inter, system-ui, sans-serif',
    colors: ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080'],
    enableTooltip: true,
    deterministic: true,
    randomSeed: 42,
    minRotation: 0,
    maxRotation: 0,
    spiral: 'archimedean',
    scale: 'sqrt',
    transitionDuration: 1000,
  };

  return (
    <div className="w-full h-full">
      <ReactWordcloud words={words} options={options} />
    </div>
  );
};

export default WordCloud; 