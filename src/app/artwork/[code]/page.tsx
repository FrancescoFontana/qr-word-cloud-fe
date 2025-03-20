'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WordCloud } from '@/components/WordCloud';
import { QRCodeSVG } from 'qrcode.react';
import { wsService } from '@/services/websocket';

interface Word {
  text: string;
  value: number;
}

export default function ArtworkPage() {
  const params = useParams();
  const code = params.code as string;
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    console.log('🔵 [ArtworkPage] Initializing with code:', code);

    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      console.log('🔵 [ArtworkPage] Font loaded');
      setFontLoaded(true);
    });

    // Fetch initial words
    const fetchWords = async () => {
      try {
        console.log('🔵 [ArtworkPage] Fetching initial words');
        const response = await fetch(`/api/words/${code}`);
        if (!response.ok) throw new Error('Failed to fetch words');
        const data = await response.json();
        console.log('📥 [ArtworkPage] Received initial words:', data);
        setWords(data.words);
      } catch (err) {
        console.error('🔴 [ArtworkPage] Error fetching words:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      }
    };

    fetchWords();

    // Set up WebSocket connection
    console.log('🔵 [ArtworkPage] Setting up WebSocket connection');
    wsService.connect(code, false);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📥 [ArtworkPage] Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.words) {
              console.log('📊 [ArtworkPage] Processing word update');
              // Process words to count frequencies
              const wordMap = new Map<string, number>();
              data.words.forEach((word: string) => {
                const normalizedWord = word.toLowerCase();
                wordMap.set(normalizedWord, (wordMap.get(normalizedWord) || 0) + 1);
              });
              
              // Convert to array format for WordCloud component
              const newWords = Array.from(wordMap.entries()).map(([text, value]) => ({
                text,
                value
              }));
              
              console.log('✨ [ArtworkPage] Setting new words:', newWords);
              setWords(newWords);
            }
            break;

          case 'error':
            console.error('🔴 [ArtworkPage] Received error:', data.message);
            setError(data.message);
            break;

          default:
            console.log('ℹ️ [ArtworkPage] Received unknown message type:', data.type);
        }
      } catch (error) {
        console.error('🔴 [ArtworkPage] Error processing WebSocket message:', error);
        setError('Failed to process message');
      }
    };

    wsService.addEventListener('message', handleMessage);

    return () => {
      console.log('🔵 [ArtworkPage] Cleaning up');
      wsService.removeEventListener('message', handleMessage);
      wsService.disconnect();
    };
  }, [code]);

  if (!fontLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-square">
            <WordCloud words={words} />
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-transparent p-4 rounded-lg">
              <QRCodeSVG
                value={`${process.env.NEXT_PUBLIC_BASE_URL}/view/${code}`}
                size={400}
                level="H"
                includeMargin={true}
                fgColor="white"
                bgColor="transparent"
              />
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
} 