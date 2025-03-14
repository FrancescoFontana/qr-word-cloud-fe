import React from 'react';
import WordCloud from 'react-d3-cloud';
import { useWordCloudStore } from '@/store/wordCloudStore';

interface WordCloudProps {
  className?: string;
}

export const WordCloudComponent: React.FC<WordCloudProps> = ({ className = '' }) => {
  const { words, isBlurred } = useWordCloudStore();

  const options = {
    font: 'Inter',
    fontSizes: [20, 60],
    padding: 5,
    rotate: 0,
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <div className={`transition-all duration-500 ${isBlurred ? 'blur-sm' : ''}`}>
        <WordCloud
          data={words}
          width={800}
          height={600}
          font="Inter"
          fontSize={(word) => Math.log2(word.value) * 5}
          rotate={0}
          padding={5}
          random={() => 0.5}
        />
      </div>
    </div>
  );
}; 