'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { WordCloud } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';

interface ArtworkData {
  words: string[];
  isBlurred: boolean;
  showQR: boolean;
}

interface Artworks {
  [code: string]: ArtworkData;
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artworks>({});
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
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
        const data = await response.json();
        console.log('📥 [GalleryPage] Received initial words:', data);

        // Initialize artworks state with fetched data
        const initialArtworks: Artworks = {};
        Object.entries(data).forEach(([code, words]) => {
          initialArtworks[code] = {
            words: words as string[],
            isBlurred: true,
            showQR: true
          };
        });
        setArtworks(initialArtworks);

        // Connect to WebSocket for all codes
        console.log('🔵 [GalleryPage] Setting up WebSocket connection');
        Object.keys(initialArtworks).forEach(code => {
          wsService.connect(code, true);
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
        
        if (data.type === 'update_cloud' && data.words) {
          const code = data.artworkCode;
          console.log('📊 [GalleryPage] Processing word update for code:', code);
          
          // Update words for the specific code
          setArtworks(prev => ({
            ...prev,
            [code]: {
              ...prev[code],
              words: data.words,
              isBlurred: false,
              showQR: false
            }
          }));

          // After 3 seconds, blur word cloud and show QR again
          setTimeout(() => {
            setArtworks(prev => ({
              ...prev,
              [code]: {
                ...prev[code],
                isBlurred: true,
                showQR: true
              }
            }));
          }, 3000);
        } else if (data.type === 'error') {
          console.error('🔴 [GalleryPage] Received error:', data.message);
          setError(data.message);
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
      // Disconnect from all codes
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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(artworks).map(([code, data]) => (
            <div key={code} className="relative aspect-square">
              {/* Word Cloud */}
              <div className="absolute inset-0">
                <WordCloud words={data.words} isBlurred={data.isBlurred} />
              </div>

              {/* QR Code */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${data.showQR ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    Cloudwall #{code}
                  </h2>
                  <div className="flex justify-center">
                    <div className="bg-transparent p-3 rounded-lg">
                      <QRCodeSVG 
                        value={`${window.location.origin}/artwork/${code}`}
                        size={200}
                        fgColor="white"
                        bgColor="transparent"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-300 mt-4">
                    Scan to view and add words
                  </p>
                </div>
              </div>
            </div>
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