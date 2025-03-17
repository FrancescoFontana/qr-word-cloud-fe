'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WordCloud } from '@/components/WordCloud';
import { WebSocketService } from '@/services/WebSocketService';
import QRCode from 'qrcode';

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<string[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    const ws = WebSocketService.getInstance();
    
    ws.onMessage((data) => {
      if (data.type === 'update_cloud') {
        setWords(data.words || []);
      } else if (data.type === 'update_blur') {
        setIsBlurred(data.isBlurred || false);
      }
      setIsLoading(false);
    });

    ws.connect();
    ws.joinArtwork(code);

    return () => {
      ws.disconnect();
    };
  }, [code]);

  useEffect(() => {
    const generateQR = async () => {
      const submitUrl = `${window.location.origin}/submit/${code}`;
      const qrDataUrl = await QRCode.toDataURL(submitUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#000000'
        }
      });
      setQrCode(qrDataUrl);
    };

    generateQR();
  }, [code]);

  const artworkUrl = `${window.location.origin}/artwork/${code}`;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 animate-gradient" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {isLoading ? (
          <div className="text-white/80 text-lg animate-pulse-slow">
            Loading artwork...
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className={`transition-all duration-1000 ${isBlurred ? 'blur-xl' : 'blur-0'}`}>
              <WordCloud words={words} />
            </div>
            
            {isBlurred && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white p-4 rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <img src={qrCode} alt="Submit QR Code" className="w-48 h-48" />
                  <p className="mt-4 text-black text-center text-sm font-light tracking-wider">
                    Scan to contribute
                  </p>
                </div>
                <a 
                  href={artworkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 text-white/80 hover:text-white text-sm font-light tracking-wider transition-colors duration-300"
                >
                  View full artwork →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 