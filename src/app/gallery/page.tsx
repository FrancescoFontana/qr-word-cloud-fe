'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWordCloudStore, wsService } from '@/services/websocket';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QRCodeSVG } from 'qrcode.react';

const WordCloud = dynamic(() => import('@/components/WordCloud').then(mod => ({ default: mod.WordCloud })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <p className="text-white/50 text-xl">Loading word cloud...</p>
    </div>
  ),
});

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
  [key: string]: ArtworkData;
}

interface ApiResponse {
  [code: string]: string[];
}

interface WebSocketMessage {
  type: string;
  artworkCode: string;
  words?: string[];
  newWord?: string;
  codes?: string[];
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artworks>({});
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const updateInProgressRef = useRef<{ [key: string]: boolean }>({});
  const connectedCodesRef = useRef<Set<string>>(new Set());

  // Load font and fetch initial data
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

        // Connect to WebSocket for each artwork code that isn't already connected
        Object.keys(newArtworks).forEach(code => {
          if (!connectedCodesRef.current.has(code)) {
            console.log('🔵 [GalleryPage] Setting up WebSocket connection for code:', code);
            wsService.connect(code, false);
            connectedCodesRef.current.add(code);
          }
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
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.artworkCode && data.words) {
              console.log('📊 [GalleryPage] Processing word update for code:', data.artworkCode);
              
              // Skip if an update is already in progress for this artwork
              if (updateInProgressRef.current[data.artworkCode]) {
                console.log('⏭️ [GalleryPage] Skipping update - already in progress for code:', data.artworkCode);
                return;
              }
              
              // Mark this artwork as having an update in progress
              updateInProgressRef.current[data.artworkCode] = true;
              
              // Clear any existing timeout for this artwork
              if (timeoutsRef.current[data.artworkCode]) {
                console.log('🧹 [GalleryPage] Clearing existing timeout for code:', data.artworkCode);
                clearTimeout(timeoutsRef.current[data.artworkCode]);
                delete timeoutsRef.current[data.artworkCode];
              }
              
              // Convert words array to Word array
              const wordMap = new Map<string, number>();
              data.words.forEach(word => {
                const normalizedWord = word.toLowerCase();
                wordMap.set(normalizedWord, (wordMap.get(normalizedWord) || 0) + 1);
              });
              
              const wordArray: Word[] = Array.from(wordMap.entries()).map(([text, value]) => ({
                text,
                value
              }));
              
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
              timeoutsRef.current[data.artworkCode] = setTimeout(() => {
                console.log('⏰ [GalleryPage] Timeout triggered for code:', data.artworkCode);
                setArtworks(prev => ({
                  ...prev,
                  [data.artworkCode]: {
                    ...prev[data.artworkCode],
                    isBlurred: true,
                    showQR: true
                  }
                }));
                // Clear the update in progress flag
                delete updateInProgressRef.current[data.artworkCode];
              }, 3000);
            }
            break;

          case 'new_artwork':
            if (data.artworkCode && data.codes) {
              console.log('🎨 [GalleryPage] Processing new artwork:', data.artworkCode);
              // Initialize new artwork with empty words
              setArtworks(prev => ({
                ...prev,
                [data.artworkCode]: {
                  words: [],
                  isBlurred: true,
                  showQR: true
                }
              }));
              // Connect to the new artwork's WebSocket only if not already connected
              if (!connectedCodesRef.current.has(data.artworkCode)) {
                console.log('🔵 [GalleryPage] Setting up WebSocket connection for new artwork:', data.artworkCode);
                wsService.connect(data.artworkCode, false);
                connectedCodesRef.current.add(data.artworkCode);
              }
            }
            break;

          case 'error':
            console.error('🔴 [GalleryPage] WebSocket error:', data);
            setError('Connection error occurred');
            break;

          default:
            console.warn('⚠️ [GalleryPage] Unknown message type:', data.type);
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
      wsService.disconnect();
      
      // Clear all timeouts on unmount
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      
      // Clear connected codes set
      connectedCodesRef.current.clear();
    };
  }, []);

  if (!fontLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="text-3xl font-light italic mb-12 text-center">
          "Send a word in the Cloud"
        </div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Object.entries(artworks).map(([code, artwork]) => (
              <div key={code} className="relative w-full aspect-square bg-black/30 rounded-2xl overflow-hidden">
                <div className="absolute inset-0">
                  <WordCloud words={artwork.words} isBlurred={artwork.isBlurred} />
                </div>
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                    artwork.showQR ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <QRCodeSVG 
                      value={`${window.location.origin}/artwork/${code}`}
                      size={Math.min(window.innerWidth * 0.12, 180)}
                      fgColor="white"
                      bgColor="transparent"
                    />
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