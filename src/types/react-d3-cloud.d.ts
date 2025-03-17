declare module 'react-d3-cloud' {
  import { ComponentType } from 'react';

  interface Word {
    text: string;
    value: number;
  }

  interface WordCloudProps {
    data: Word[];
    width: number;
    height: number;
    font?: string;
    fontSize?: (word: Word) => number;
    rotate?: number;
    padding?: number;
    random?: () => number;
    fill?: (word: Word) => string;
  }

  const WordCloud: ComponentType<WordCloudProps>;
  export default WordCloud;
} 