'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
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

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showQR, setShowQR] = useState(true);

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

        setWords(wordArray);
      } catch (err) {
        console.error('🔴 [ViewPage] Error fetching words:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      }
    };

    fetchWords();

    // Set up WebSocket connection
    console.log('🔵 [ViewPage] Setting up WebSocket connection');
    wsService.connect(code, false);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📥 [ViewPage] Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.words) {
              console.log('📊 [ViewPage] Processing word update');
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
              
              console.log('✨ [ViewPage] Setting new words:', wordArray);
              setWords(wordArray);
              
              // Fade out QR code and unblur word cloud
              setShowQR(false);
              setIsBlurred(false);
              
              // After 3 seconds, blur word cloud and show QR code again
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
      <Header />
      <main className="pt-16 pb-20">
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <WordCloud words={words} isBlurred={isBlurred} />
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showQR ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8">
                <h1 className="text-3xl font-bold mb-6 text-center">
                  Scan to add words
                </h1>
                <div className="flex justify-center mb-6">
                  <div className="bg-transparent p-3 rounded-lg">
                    <QRCodeSVG 
                      value={`${window.location.origin}/artwork/${code}`}
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