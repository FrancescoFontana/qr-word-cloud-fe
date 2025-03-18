'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

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
  const [qrCode, setQrCode] = useState<string | null>(null);

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
        } else if (data.type === 'qr_code' && typeof data.qrCode === 'string') {
          setQrCode(data.qrCode);
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
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Word Cloud Container */}
      <div 
        className={`fixed inset-0 w-full h-screen transition-all duration-1000 ${
          isBlurred ? 'blur-xl' : ''
        }`}
      >
        <WordCloud words={words} />
      </div>

      {/* Content Overlay */}
      <div className="relative z-40 flex flex-col items-center justify-center min-h-screen">
        {/* QR Code Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
            Scan to Add Words
          </h1>
          <div className="flex justify-center mb-4 sm:mb-6">
            {qrCode && (
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <Image
                  src={qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="w-48 sm:w-56 md:w-64 h-auto"
                />
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-center text-gray-300">
            Scan this QR code with your phone to add words to the cloud
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 