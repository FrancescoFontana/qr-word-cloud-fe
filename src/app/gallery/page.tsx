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
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  ),
});

interface Word {
  text: string;
  value: number;
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

// Function to generate a unique, light color based on a string
function generateLightColor(code: string): string {
  // Use the code to generate a consistent hue
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  
  // Generate a light color with high saturation and lightness
  return `hsl(${hue}, 70%, 85%)`;
}

interface Artwork {
  words: Word[];
  isBlurred: boolean;
  showQR: boolean;
  color: string;
}

interface Artworks {
  [key: string]: Artwork;
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
            showQR: true,
            color: generateLightColor(code)
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
              // Initialize new artwork with empty words and a unique color
              setArtworks(prev => ({
                ...prev,
                [data.artworkCode]: {
                  words: [],
                  isBlurred: true,
                  showQR: true,
                  color: generateLightColor(data.artworkCode)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(artworks).map(([code, artwork]) => (
            <div key={code} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative aspect-square">
                {artwork.showQR ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="w-[90%] h-[90%]">
                      <QRCodeSVG
                        value={`https://qr-word-cloud-fe.vercel.app/artwork/${code}/display`}
                        size={300}
                        level="H"
                        includeMargin={false}
                        bgColor={artwork.color}
                        fgColor="#000000"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`absolute inset-0 transition-opacity duration-300 ${artwork.isBlurred ? 'opacity-50' : 'opacity-100'}`}>
                    <WordCloud words={artwork.words} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 