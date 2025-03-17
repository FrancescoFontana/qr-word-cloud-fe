'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WordCloud } from '@/components/WordCloud';
import QRCode from 'qrcode';

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<string[]>([]);
  const [isBlurred, setIsBlurred] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Use environment variable for WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    console.log('🔵 [WebSocket v3] Initializing connection to:', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    setWs(socket);
    
    socket.onopen = () => {
      console.log('🟢 [WebSocket v3] Connected');
      const message = {
        type: 'join_artwork',
        artworkCode: code
      };
      console.log('📤 [WebSocket v3] Sending message:', message);
      socket.send(JSON.stringify(message));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 [WebSocket v3] Received message:', data);
        if (data.type === 'update_cloud') {
          console.log('📊 [WebSocket v3] Words data:', data.words);
          console.log('📊 [WebSocket v3] Words data type:', typeof data.words);
          console.log('📊 [WebSocket v3] Is words an array?', Array.isArray(data.words));
          
          // Ensure we're setting an array of strings
          const wordArray = Array.isArray(data.words) 
            ? data.words
                .filter((word: unknown) => typeof word === 'string' && String(word).trim().length > 0)
                .map((word: unknown) => String(word).trim())
            : [];
          console.log('✨ [WebSocket v3] Processed word array:', wordArray);
          setWords(wordArray);
        } else if (data.type === 'update_blur') {
          setIsBlurred(data.isBlurred ?? true);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setWords([]);
      }
    };

    socket.onclose = () => {
      console.log('🔴 [WebSocket v3] Disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (socket.readyState === WebSocket.CLOSED) {
          socket.close();
        }
      }, 1000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
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