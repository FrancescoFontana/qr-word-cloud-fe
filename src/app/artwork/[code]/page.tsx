'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import WordCloud from '@/components/WordCloud';
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
    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      setFontLoaded(true);
    });

    // Fetch initial words
    const fetchWords = async () => {
      try {
        const response = await fetch(`/api/words/${code}`);
        if (!response.ok) throw new Error('Failed to fetch words');
        const data = await response.json();
        setWords(data.words);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      }
    };

    fetchWords();

    // Set up WebSocket connection
    wsService.connect(code, false);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'update_cloud':
          if (data.words) {
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
            
            setWords(newWords);
          }
          break;

        case 'error':
          setError(data.message);
          break;
      }
    };

    wsService.addEventListener('message', handleMessage);

    return () => {
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