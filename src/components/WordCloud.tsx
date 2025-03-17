'use client';

import { useEffect, useState } from 'react';
import Cloud from 'react-d3-cloud';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: string[];
}

export function WordCloud({ words }: WordCloudProps) {
  const [mounted, setMounted] = useState(false);
  const [processedWords, setProcessedWords] = useState<Word[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Convert string array to Word array with random sizes
    const processed = words.map(word => ({
      text: word,
      value: Math.random() * 50 + 20 // Random size between 20 and 70
    }));
    setProcessedWords(processed);
  }, [words]);

  if (!mounted) {
    return null;
  }

  const colorScale = scaleOrdinal(schemeCategory10);

  return (
    <div className="w-full h-[600px] flex items-center justify-center">
      <Cloud
        data={processedWords}
        width={800}
        height={600}
        font="Inter"
        fontSize={(word: Word) => word.value}
        rotate={0}
        padding={5}
        random={() => 0.5}
        fill={(word: Word) => colorScale(word.text)}
      />
    </div>
  );
} 