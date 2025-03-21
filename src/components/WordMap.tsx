'use client';
  
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { Word } from '@/types/word';

interface WordMapProps {
  words: Word[];
  isBlurred?: boolean;
  onWordClick?: (word: Word) => void;
}

interface CloudWord extends cloud.Word {
  color: string;
  size: number;
}

interface LayoutWord {
  text: string;
  size: number;
  color: string;
}

type D3Selection = d3.Selection<SVGTextElement, CloudWord, SVGGElement, unknown>;

export function WordMap({ words, isBlurred = false, onWordClick }: WordMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousWordsRef = useRef<Word[]>([]);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [error, setError] = useState<string | null>(null);
  
  // Light color palette
  const colors = [
    '#FFE5E5', // Light pink
    '#E5FFE5', // Light green
    '#E5E5FF', // Light blue
    '#FFE5FF', // Light purple
    '#FFFFE5', // Light yellow
    '#E5FFFF', // Light cyan
    '#FFE5CC', // Light orange
    '#E5FFCC', // Light lime
    '#CCE5FF', // Light sky blue
    '#FFCCE5', // Light rose
  ];

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 300);
      
      console.log('📐 [WordMap] Container dimensions:', { width, height });
      setDimensions({ width, height });
    };

    // Initial dimensions
    updateDimensions();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main effect for rendering
  useEffect(() => {
    console.log('🔵 [WordMap] useEffect triggered');
    console.log('🔵 [WordMap] Current words:', words);
    console.log('🔵 [WordMap] Previous words:', previousWordsRef.current);
    console.log('🔵 [WordMap] Current dimensions:', dimensions);

    if (!svgRef.current || words.length === 0) {
      console.log('⚠️ [WordMap] Missing required data, skipping render');
      return;
    }

    const draw = (words: Array<cloud.Word & { color: string }>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, centerX: number, centerY: number) => {
      console.log('🎨 [WordMap] Drawing words:', words.length);
      
      // Create a group for the words
      const wordGroup = svg.append('g')
        .attr('transform', `translate(${centerX},${centerY})`);

      // Add words with transitions
      const wordElements = wordGroup.selectAll<SVGTextElement, cloud.Word & { color: string }>('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-family', 'Titillium Web')
        .style('font-size', d => `${d.size}px`)
        .style('fill', d => d.color)
        .style('text-anchor', 'middle')
        .style('cursor', 'pointer')
        .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text || '')
        .style('opacity', 0)
        .style('filter', isBlurred ? 'blur(8px)' : 'none')
        .style('transition', 'filter 0.5s ease-in-out');

      // Animate words in
      wordElements
        .transition()
        .duration(500)
        .style('opacity', 1);

      // Handle new words
      const newWords = words.filter(word => 
        !previousWordsRef.current.some(prev => prev.text === word.text)
      );

      if (newWords.length > 0) {
        console.log('✨ [WordMap] New words detected:', newWords.length);
        // Fade out all words
        wordElements
          .transition()
          .duration(500)
          .style('opacity', 0)
          .on('end', () => {
            // Fade in new word at maximum size
            const newWordElement = wordElements
              .filter(d => newWords.some(newWord => newWord.text === d.text));

            newWordElement
              .transition()
              .duration(500)
              .style('opacity', 1)
              .on('end', () => {
                // Fade out new word
                newWordElement
                  .transition()
                  .duration(500)
                  .style('opacity', 0)
                  .on('end', () => {
                    // Fade in all words
                    wordElements
                      .transition()
                      .duration(500)
                      .style('opacity', 1);
                  });
              });
          });
      }

      // Handle word click
      wordElements
        .on('click', (event, d) => {
          const word = words.find(w => w.text === d.text);
          if (word && onWordClick) {
            onWordClick(word as unknown as Word);
          }
        });
    };

    try {
      // Clear previous content
      d3.select(svgRef.current).selectAll('*').remove();

      const width = dimensions.width;
      const height = dimensions.height;
      const centerX = width / 2;
      const centerY = height / 2;

      console.log('📊 [WordMap] Creating word cloud with dimensions:', { width, height, centerX, centerY });

      // Create SVG with explicit dimensions
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // Create scales
      const maxValue = d3.max(words, (d: Word) => d.value) ?? 0;
      const fontSizeScale = d3.scaleLinear<number, number>()
        .domain([0, maxValue])
        .range([14, Math.min(width, height) * 0.8]);

      // Create word cloud layout
      const layout = cloud()
        .size([width, height])
        .words(words.map(d => ({
          text: d.text,
          size: fontSizeScale(d.value),
          color: colors[Math.floor(Math.random() * colors.length)]
        })))
        .padding(5)
        .rotate(0)
        .font('Titillium Web')
        .fontSize(function(d) { return (d as LayoutWord).size; })
        .on('end', (cloudWords: Array<cloud.Word & { color: string }>) => {
          draw(cloudWords, svg, centerX, centerY);
        })
        .on('error', (err: Error) => {
          console.error('❌ [WordMap] Layout error:', err);
          setError('Failed to layout words');
        });

      layout.start();
    } catch (err) {
      console.error('❌ [WordMap] Render error:', err);
      setError('Failed to render word cloud');
    }

    // Store current words for next update
    previousWordsRef.current = words;
  }, [words, isBlurred, dimensions, onWordClick]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gray-100 rounded-lg p-4 flex items-center justify-center"
      style={{ 
        width: '300px',
        height: '300px',
        minWidth: '300px',
        minHeight: '300px'
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          width: '100%',
          height: '100%',
          filter: isBlurred ? 'blur(8px)' : 'none',
          transition: 'filter 0.5s ease-in-out'
        }}
      />
    </div>
  );
} 