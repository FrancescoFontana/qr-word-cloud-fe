'use client';

import { useEffect, useRef, useState } from 'react';
import ReactWordcloud from 'react-d3-cloud';
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

export default function WordCloud({ words, isBlurred = false }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load the font
  useEffect(() => {
    const font = new FontFace('Titillium Web', 'url(https://fonts.gstatic.com/s/titilliumweb/v15/NaPecZTIAOhVxoMyOr9n_E7fdMPmCA.ttf)');
    font.load().then(() => {
      document.fonts.add(font);
      setFontLoaded(true);
    });
  }, []);

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

  if (!fontLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
  }

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