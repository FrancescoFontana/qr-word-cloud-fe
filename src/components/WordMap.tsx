'use client';
  
import { useEffect, useRef } from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import cloud from 'd3-cloud';
import { transition } from 'd3-transition';
import { Word } from '@/types/word';
import type { BaseType } from 'd3-selection';
  
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
  
type D3Selection = Selection<SVGTextElement, CloudWord, SVGGElement, unknown>;
  
export function WordMap({ words, isBlurred = false }: WordMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const previousWordsRef = useRef<Word[]>([]);
  
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
  
  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;
  
    // Clear previous content
    select(svgRef.current).selectAll('*').remove();
  
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
  
    // Create SVG
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
  
    // Create scales
    const maxValue = max(words, (d: Word) => d.value) ?? 0;
    const fontSizeScale = scaleLinear<number, number>()
      .domain([0, maxValue])
      .range([14, Math.min(width, height) * 0.8]); // Scale to container size
  
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
      .on('end', draw);
  
    layout.start();
  
    function draw(words: CloudWord[]) {
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
  
      // Animate words in
      (wordElements as D3Selection)
        .transition()
        .duration(500)
        .style('opacity', 1);
  
      // Handle new words
      const newWords = words.filter(word => 
        !previousWordsRef.current.some(prev => prev.text === word.text)
      );
  
      if (newWords.length > 0) {
        // Fade out all words
        (wordElements as D3Selection)
          .transition()
          .duration(500)
          .style('opacity', 0)
          .on('end', () => {
            // Fade in new word at maximum size
            const newWordElement = wordElements.filter(d => 
              newWords.some(newWord => newWord.text === d.text)
            );
            (newWordElement as D3Selection)
              .transition()
              .duration(500)
              .style('opacity', 1)
              .on('end', () => {
                // Fade out new word
                (newWordElement as D3Selection)
                  .transition()
                  .duration(500)
                  .style('opacity', 0)
                  .on('end', () => {
                    // Fade in all words
                    (wordElements as D3Selection)
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
  }, [words, isBlurred]);
  
  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ filter: isBlurred ? 'blur(8px)' : 'none' }}
    />
  );
} 