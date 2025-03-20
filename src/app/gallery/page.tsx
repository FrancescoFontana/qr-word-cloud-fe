'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WordCloud } from '@/components/WordCloud';
import { QRCodeSVG } from 'qrcode.react';
import { wsService } from '@/services/websocket';

interface Word {
  text: string;
  value: number;
}

interface Artwork {
  code: string;
  words: Word[];
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      setFontLoaded(true);
    });

    // Fetch initial artworks
    const fetchArtworks = async () => {
      try {
        const response = await fetch('/api/artworks');
        if (!response.ok) throw new Error('Failed to fetch artworks');
        const data = await response.json();
        setArtworks(data.artworks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch artworks');
      }
    };

    fetchArtworks();

    // Set up WebSocket connection
    wsService.connect('gallery', false);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_artwork':
          if (data.artworkCode) {
            // Add new artwork to the list
            setArtworks(prev => [...prev, { code: data.artworkCode, words: data.words || [] }]);
          }
          break;

        case 'update_cloud':
          if (data.artworkCode && data.words) {
            // Update existing artwork's words
            setArtworks(prev => prev.map(artwork => {
              if (artwork.code === data.artworkCode) {
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
                
                return { ...artwork, words: newWords };
              }
              return artwork;
            }));
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
  }, []);

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
        <div className="flex flex-row overflow-x-auto gap-8 pb-4">
          {artworks.map((artwork) => (
            <Link
              key={artwork.code}
              href={`/view/${artwork.code}`}
              className="flex-shrink-0 w-[400px] h-[400px] bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden"
            >
              <div className="relative w-full h-full">
                <WordCloud words={artwork.words} />
                <div className="absolute bottom-4 right-4 bg-transparent p-2 rounded-lg">
                  <QRCodeSVG
                    value={`${process.env.NEXT_PUBLIC_BASE_URL}/view/${artwork.code}`}
                    size={100}
                    level="H"
                    includeMargin={true}
                    fgColor="white"
                    bgColor="transparent"
                  />
                </div>
              </div>
            </Link>
          ))}
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