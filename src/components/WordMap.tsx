'use client';
  
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { Word } from '@/types/word';
import type { BaseType } from 'd3-selection';
import 'd3-transition';  // This is needed to extend Selection with transition

interface WordMapProps {
  words: Word[];
  isBlurred?: boolean;
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

export function WordMap({ words, isBlurred = false }: WordMapProps) {
  console.log('🔵 [WordMap] Rendering with words:', words);
  console.log('🔵 [WordMap] Blurred state:', isBlurred);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const previousWordsRef = useRef<Word[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
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
  
  // Handle resize
  useEffect(() => {
    if (!svgRef.current) return;
  
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        console.log('📐 [WordMap] Resize detected:', { width, height });
        setDimensions({ width, height });
      }
    });
  
    resizeObserver.observe(svgRef.current);
  
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  useEffect(() => {
    console.log('🔵 [WordMap] useEffect triggered');
    console.log('🔵 [WordMap] Current words:', words);
    console.log('🔵 [WordMap] Previous words:', previousWordsRef.current);
    console.log('🔵 [WordMap] Current dimensions:', dimensions);
  
    if (!svgRef.current || words.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      console.log('⚠️ [WordMap] Missing required data, skipping render');
      return;
    }
  
    // Clear previous content
    console.log('🧹 [WordMap] Clearing previous content');
    d3.select(svgRef.current).selectAll('*').remove();
  
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
  
    console.log('📐 [WordMap] Using dimensions:', { width: dimensions.width, height: dimensions.height, centerX, centerY });
  
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);
  
    // Create scales
    const maxValue = d3.max(words, (d: Word) => d.value) ?? 0;
    console.log('📊 [WordMap] Max value:', maxValue);
  
    const fontSizeScale = d3.scaleLinear<number, number>()
      .domain([0, maxValue])
      .range([14, Math.min(dimensions.width, dimensions.height) * 0.8]); // Scale to container size
  
    console.log('📏 [WordMap] Font size scale:', {
      domain: [0, maxValue],
      range: [14, Math.min(dimensions.width, dimensions.height) * 0.8]
    });
  
    // Create word cloud layout
    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map(d => ({
        text: d.text,
        size: fontSizeScale(d.value),
        color: colors[Math.floor(Math.random() * colors.length)]
      })))
      .padding(5)
      .rotate(0)
      .font('Titillium Web')
      .fontSize(function(d) { return (d as LayoutWord).size; })
      .on('end', draw);
  
    console.log('🎨 [WordMap] Starting cloud layout');
    layout.start();
  
    function draw(words: CloudWord[]) {
      console.log('✏️ [WordMap] Drawing words:', words);
  
      // Create a group for the words
      const wordGroup = svg.append('g')
        .attr('transform', `translate(${centerX},${centerY})`);
  
      // Add words with transitions
      const wordElements = wordGroup.selectAll<SVGTextElement, CloudWord>('text')
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
  
      console.log('📝 [WordMap] Created word elements:', wordElements.size());
  
      // Animate words in
      wordElements
        .transition()
        .duration(500)
        .style('opacity', 1);
  
      // Handle new words
      const newWords = words.filter(word => 
        !previousWordsRef.current.some(prev => prev.text === word.text)
      );
  
      console.log('🆕 [WordMap] New words:', newWords);
  
      if (newWords.length > 0) {
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
    }
  
    // Store current words for next update
    previousWordsRef.current = words;
  
    return () => {
      console.log('🧹 [WordMap] Cleaning up');
    };
  }, [words, isBlurred, dimensions]);
  
  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ filter: isBlurred ? 'blur(8px)' : 'none' }}
    />
  );
} 