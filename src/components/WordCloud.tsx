import { useMemo } from 'react';
import Cloud from 'react-d3-cloud';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
}

export default function WordCloud({ words = [] }: WordCloudProps) {
  const cloudWords = useMemo(() => {
    if (!words?.length) return [];
    
    // Scale the values for better visualization
    return words.map(word => ({
      ...word,
      value: Math.max(word.value, 1) * 20,
    }));
  }, [words]);

  if (!words?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No words yet</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Cloud
        data={cloudWords}
        width={800}
        height={600}
        font="Inter"
        fontSize={(word: Word) => Math.max(word.value, 12)}
        rotate={0}
        padding={2}
      />
    </div>
  );
} 