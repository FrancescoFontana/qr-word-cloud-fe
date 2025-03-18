'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';

interface PageProps {
  params: {
    code: string;
  };
}

export default function ArtworkPage({ params }: PageProps) {
  const { code } = params;
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    console.log('Initializing WebSocket connection for code:', code);
    wsService.connect(code, true);
    return () => wsService.disconnect();
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'update_cloud' && Array.isArray(data.words)) {
          console.log('Processing words array:', data.words);
          const processedWords = data.words.map((word: any) => {
            console.log('Processing word:', word, 'Type:', typeof word);
            return String(word).trim();
          }).filter(Boolean);
          console.log('Final processed words:', processedWords);
          setWords(processedWords);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    wsService.addEventListener('message', handleMessage);
    return () => wsService.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Artwork: {code}</h1>
        <div className="bg-gray-900 rounded-lg p-6">
          <WordCloud words={words} />
        </div>
      </div>
    </div>
  );
} 