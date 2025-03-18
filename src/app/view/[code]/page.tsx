'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';
import { QRCodeSVG } from 'qrcode.react';

interface PageProps {
  params: {
    code: string;
  };
}

export default function ViewPage({ params }: PageProps) {
  const { code } = params;
  const [words, setWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [artworkUrl, setArtworkUrl] = useState('');

  useEffect(() => {
    // Set artwork URL after component mounts
    setArtworkUrl(`${window.location.origin}/artwork/${code}`);
  }, [code]);

  useEffect(() => {
    console.log('Initializing WebSocket connection for code:', code);
    // Connect as a view page
    wsService.connect(code, true);
    return () => wsService.disconnect();
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 [WebSocket v3] Received message:', data);
        
        if (data.type === 'update_cloud' && Array.isArray(data.words)) {
          console.log('📊 [WebSocket v3] Words data:', data.words);
          // Ensure we're setting an array of strings
          const processedWords = data.words
            .filter((word: unknown) => typeof word === 'string' && String(word).trim().length > 0)
            .map((word: unknown) => String(word).trim());
          console.log('✨ [WebSocket v3] Processed words:', processedWords);
          setWords(processedWords);
          setIsLoading(false);

          // Only handle blur/QR effects if it's not the initial load and there's a new word
          if (!isInitialLoad && data.newWord) {
            // Hide QR and unblur
            setShowQR(false);
            setIsBlurred(false);

            // After 3 seconds, show QR and blur again
            setTimeout(() => {
              setShowQR(true);
              setIsBlurred(true);
            }, 3000);
          } else {
            setIsInitialLoad(false);
          }
        } else if (data.type === 'error') {
          setError(data.message);
          setTimeout(() => setError(null), 3000);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        setWords([]);
        setIsLoading(false);
      }
    };

    wsService.addEventListener('message', handleMessage);
    return () => wsService.removeEventListener('message', handleMessage);
  }, [isInitialLoad]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Error Message */}
      {error && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-200 px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-center shadow-2xl">
            <p className="text-2xl font-light animate-pulse text-white">
              Loading word cloud...
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-screen">
          {/* Word Cloud Container */}
          <div 
            className={`absolute inset-0 transition-all duration-1000 ${
              isBlurred ? 'blur-xl' : ''
            }`}
          >
            <WordCloud words={words} />
          </div>

          {/* QR Code Section */}
          {showQR && artworkUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-500 z-40">
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-white p-6 rounded-xl transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                  <QRCodeSVG value={artworkUrl} size={200} />
                </div>
                <p className="text-2xl text-white font-light tracking-wide">
                  Scan to contribute to the artwork
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 