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

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [artworkUrl, setArtworkUrl] = useState('');

  useEffect(() => {
    console.log('🔵 [ViewPage] Initializing with code:', code);

    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      console.log('🔵 [ViewPage] Font loaded');
      setFontLoaded(true);
    });

    // Fetch initial words
    const fetchWords = async () => {
      try {
        console.log('🔵 [ViewPage] Fetching initial words');
        const response = await fetch(`/api/words/${code}`);
        if (!response.ok) throw new Error('Failed to fetch words');
        const data = await response.json();
        console.log('📥 [ViewPage] Received initial words:', data);
        setWords(data.words);
        setArtworkUrl(data.artworkUrl);
      } catch (err) {
        console.error('🔴 [ViewPage] Error fetching words:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      }
    };

    fetchWords();

    // Set up WebSocket connection
    console.log('🔵 [ViewPage] Setting up WebSocket connection');
    wsService.connect(code, true);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📥 [ViewPage] Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.words) {
              console.log('📊 [ViewPage] Processing word update');
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
              
              console.log('✨ [ViewPage] Setting new words:', newWords);
              setWords(newWords);
              
              // Fade out QR and unblur word cloud
              setShowQR(false);
              setIsBlurred(false);
              
              // After 3 seconds, blur word cloud and show QR again
              setTimeout(() => {
                setIsBlurred(true);
                setShowQR(true);
              }, 3000);
            }
            break;

          case 'error':
            console.error('🔴 [ViewPage] Received error:', data.message);
            setError(data.message);
            break;

          default:
            console.log('ℹ️ [ViewPage] Received unknown message type:', data.type);
        }
      } catch (error) {
        console.error('🔴 [ViewPage] Error processing WebSocket message:', error);
        setError('Failed to process message');
      }
    };

    wsService.addEventListener('message', handleMessage);

    return () => {
      console.log('🔵 [ViewPage] Cleaning up');
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
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <WordCloud words={words} isBlurred={isBlurred} />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showQR ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <h1 className="text-3xl font-bold mb-6 text-center">
                Scan to add words to the cloud
              </h1>
              <div className="flex justify-center mb-6">
                <div className="bg-transparent p-3 rounded-lg">
                  <QRCodeSVG 
                    value={artworkUrl} 
                    size={200} 
                    fgColor="white"
                    bgColor="transparent"
                  />
                </div>
              </div>
              <p className="text-center text-gray-300">
                Scan this QR code with your phone to add words to the cloud
              </p>
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