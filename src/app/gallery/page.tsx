'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QRCodeSVG } from 'qrcode.react';
import { wsService } from '@/services/websocket';

interface Word {
  text: string;
  value: number;
}

interface ArtworkData {
  words: Word[];
  isBlurred: boolean;
  showQR: boolean;
}

interface Artworks {
  [code: string]: ArtworkData;
}

interface ApiResponse {
  [code: string]: string[];
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artworks>({});
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    console.log('🔵 [GalleryPage] Initializing');

    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      console.log('🔵 [GalleryPage] Font loaded');
      setFontLoaded(true);
    });

    // Fetch initial words
    const fetchWords = async () => {
      try {
        console.log('🔵 [GalleryPage] Fetching initial words');
        const response = await fetch('https://qr-word-cloud-be.onrender.com/api/words/all');
        if (!response.ok) throw new Error('Failed to fetch words');
        const data: ApiResponse = await response.json();
        console.log('📥 [GalleryPage] Received initial words:', data);

        // Convert string arrays to Word arrays and initialize artwork states
        const newArtworks: Artworks = {};
        Object.entries(data).forEach(([code, words]) => {
          const wordMap = new Map<string, number>();
          words.forEach(word => {
            const normalizedWord = word.toLowerCase();
            wordMap.set(normalizedWord, (wordMap.get(normalizedWord) || 0) + 1);
          });
          
          const wordArray: Word[] = Array.from(wordMap.entries()).map(([text, value]) => ({
            text,
            value
          }));

          newArtworks[code] = {
            words: wordArray,
            isBlurred: true,
            showQR: true
          };
        });

        setArtworks(newArtworks);

        // Set up WebSocket connections for each code
        Object.keys(newArtworks).forEach(code => {
          console.log('🔵 [GalleryPage] Setting up WebSocket connection for code:', code);
          wsService.connect(code, false);
        });
      } catch (err) {
        console.error('🔴 [GalleryPage] Error fetching words:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      }
    };

    fetchWords();

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📥 [GalleryPage] Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.words && data.artworkCode) {
              console.log('📊 [GalleryPage] Processing word update for code:', data.artworkCode);
              // Convert string array to Word array
              const wordMap = new Map<string, number>();
              data.words.forEach((word: string) => {
                const normalizedWord = word.toLowerCase();
                wordMap.set(normalizedWord, (wordMap.get(normalizedWord) || 0) + 1);
              });
              
              const wordArray: Word[] = Array.from(wordMap.entries()).map(([text, value]) => ({
                text,
                value
              }));
              
              console.log('✨ [GalleryPage] Setting new words for code:', data.artworkCode);
              
              // First, update the words and hide QR code
              setArtworks(prev => ({
                ...prev,
                [data.artworkCode]: {
                  ...prev[data.artworkCode],
                  words: wordArray,
                  isBlurred: false,
                  showQR: false
                }
              }));
              
              // After 3 seconds, blur word cloud and show QR code again
              setTimeout(() => {
                setArtworks(prev => ({
                  ...prev,
                  [data.artworkCode]: {
                    ...prev[data.artworkCode],
                    isBlurred: true,
                    showQR: true
                  }
                }));
              }, 3000);
            }
            break;

          case 'error':
            console.error('🔴 [GalleryPage] Received error:', data.message);
            setError(data.message);
            break;

          default:
            console.log('ℹ️ [GalleryPage] Received unknown message type:', data.type);
        }
      } catch (error) {
        console.error('🔴 [GalleryPage] Error processing WebSocket message:', error);
        setError('Failed to process message');
      }
    };

    wsService.addEventListener('message', handleMessage);

    return () => {
      console.log('🔵 [GalleryPage] Cleaning up');
      wsService.removeEventListener('message', handleMessage);
      // Disconnect all WebSocket connections
      Object.keys(artworks).forEach(code => {
        wsService.disconnect();
      });
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
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(artworks).map(([code, artwork]) => (
              <div key={code} className="relative aspect-square bg-black/30 rounded-2xl overflow-hidden">
                <div className="absolute inset-0">
                  <WordCloud words={artwork.words} isBlurred={artwork.isBlurred} />
                </div>
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                    artwork.showQR ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                      Artwork #{code}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <div className="bg-transparent p-3 rounded-lg">
                        <QRCodeSVG 
                          value={`${window.location.origin}/artwork/${code}`}
                          size={150}
                          fgColor="white"
                          bgColor="transparent"
                        />
                      </div>
                    </div>
                    <p className="text-center text-gray-300">
                      Scan to add words
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
} 