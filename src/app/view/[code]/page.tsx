'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { QRCodeSVG } from 'qrcode.react';
import { wsService } from '@/services/websocket';

interface PageProps {
  params: {
    code: string;
  };
}

export default function ViewPage({ params }: PageProps) {
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [artworkUrl, setArtworkUrl] = useState('');
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'update_cloud' && data.artworkCode === params.code) {
          setWords(prev => [...prev, data.word]);
        } else if (data.type === 'error') {
          setError(data.message);
          setTimeout(() => setError(null), 3000);
        } else if (data.type === 'artwork_url') {
          setArtworkUrl(data.url);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    wsService.addEventListener('message', handleMessage);
    return () => wsService.removeEventListener('message', handleMessage);
  }, [isInitialLoad, params.code]);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch('https://qr-word-cloud-be.onrender.com/api/words/all');
        if (!response.ok) {
          throw new Error('Failed to fetch words');
        }
        const data = await response.json();
        setWords(data[params.code] || []);
      } catch (err) {
        setError('Errore nel caricamento delle parole');
        console.error('Error fetching words:', err);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchWords();
  }, [params.code]);

  if (isInitialLoad || !fontLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Caricamento opera...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Word Cloud */}
          <div className="relative w-full aspect-square bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <WordCloud words={words} />
          </div>

          {/* QR Code */}
          {artworkUrl && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
                Scansiona per aggiungere parole nel Cloudwall
              </h1>
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="bg-transparent p-2 sm:p-3 rounded-lg">
                  <QRCodeSVG 
                    value={artworkUrl} 
                    size={200} 
                    fgColor="white"
                    bgColor="transparent"
                  />
                </div>
              </div>
              <p className="text-sm sm:text-base text-center text-gray-300">
                Scansiona questo codice QR con il tuo telefono per aggiungere parole nel Cloudwall
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm sm:text-base">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 