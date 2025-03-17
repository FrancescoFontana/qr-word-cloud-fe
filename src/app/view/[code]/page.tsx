'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WordCloud } from '@/components/WordCloud';
import { QRCodeSVG } from 'qrcode.react';
import { WebSocketService } from '@/services/websocket';

export default function ViewPage() {
  const params = useParams();
  const [isBlurred, setIsBlurred] = useState(true);
  const [words, setWords] = useState<{ text: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const code = params.code as string;
    const ws = new WebSocketService(code);

    ws.onUpdate = (newWords) => {
      setWords(newWords);
      setIsLoading(false);
    };

    ws.onBlurChange = (blurred) => {
      setIsBlurred(blurred);
    };

    return () => {
      ws.disconnect();
    };
  }, [params.code]);

  const artworkUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/submit/${params.code}`
    : `http://localhost:3000/submit/${params.code}`;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black animate-gradient" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {isLoading ? (
          <div className="text-gray-400 text-sm tracking-widest uppercase animate-pulse-slow">
            Loading...
          </div>
        ) : (
          <>
            <div className={`relative w-full max-w-4xl aspect-square transition-all duration-1000 ${isBlurred ? 'blur-xl' : 'blur-0'}`}>
              <WordCloud words={words} />
            </div>
            
            {isBlurred && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="relative">
                  <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-white/10 p-8 rounded-lg backdrop-blur-sm">
                    <QRCodeSVG
                      value={artworkUrl}
                      size={256}
                      level="H"
                      includeMargin
                      className="animate-pulse-slow"
                    />
                    <p className="mt-4 text-center text-gray-300 text-sm tracking-widest uppercase">
                      Scan to contribute
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 