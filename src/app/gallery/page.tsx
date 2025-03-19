'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

interface WordsResponse {
  [code: string]: string[];
}

type WebSocketMessage = {
  type: 'join_artwork' | 'update_cloud' | 'error';
  artworkCode?: string;
  words?: string[];
  message?: string;
};

export default function GalleryPage() {
  const [codes, setCodes] = useState<WordsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleQRs, setVisibleQRs] = useState<{ [key: string]: boolean }>({});
  const [websockets, setWebsockets] = useState<{ [key: string]: WebSocket }>({});
  const [wordClouds, setWordClouds] = useState<{ [key: string]: string[] }>({});
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('https://qr-word-cloud-be.onrender.com/api/words/all');
        if (!response.ok) {
          throw new Error('Failed to fetch codes');
        }
        const data: WordsResponse = await response.json();
        setCodes(data);
        // Initialize visible state for all QR codes
        const initialVisible = Object.keys(data).reduce((acc: { [key: string]: boolean }, code) => {
          acc[code] = true;
          return acc;
        }, {});
        setVisibleQRs(initialVisible);
      } catch (err) {
        setError('Errore nel caricamento dei codici');
        console.error('Error fetching codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, []);

  useEffect(() => {
    // Initialize WebSocket connections for each code
    Object.keys(codes).forEach((code) => {
      const ws = new WebSocket('wss://qr-word-cloud-be.onrender.com/ws');
      
      ws.onopen = () => {
        console.log(`WebSocket connected for code ${code}`);
        ws.send(JSON.stringify({ type: 'join_artwork', artworkCode: code }));
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Received message:', message);

        switch (message.type) {
          case 'update_cloud':
            if (message.words && Array.isArray(message.words)) {
              setWordClouds(prev => ({
                ...prev,
                [code]: message.words || []
              }));
            }
            break;
          case 'error':
            console.error(`WebSocket error for code ${code}:`, message.message);
            break;
          default:
            console.log(`Received unknown message type: ${message.type}`);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for code ${code}:`, error);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for code ${code}`);
      };

      setWebsockets(prev => ({
        ...prev,
        [code]: ws
      }));
    });

    // Cleanup WebSocket connections
    return () => {
      Object.values(websockets).forEach(ws => {
        ws.close();
      });
    };
  }, [codes]);

  const handleQRClick = (code: string) => {
    setVisibleQRs(prev => ({
      ...prev,
      [code]: false
    }));

    setTimeout(() => {
      setVisibleQRs(prev => ({
        ...prev,
        [code]: true
      }));
    }, 3000);
  };

  if (loading || !fontLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Caricamento galleria...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-4xl font-bold mb-4 text-center">
          "Leave a word in the clouds"
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {Object.entries(codes).map(([code, words]) => (
            <div key={code} className="relative aspect-square bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
              {visibleQRs[code] ? (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300"
                  onClick={() => handleQRClick(code)}
                >
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG
                      value={`https://qr-word-cloud-fe.vercel.app/view/${code}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <WordCloud words={wordClouds[code] || words} />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-white/80 text-center text-lg max-w-2xl mx-auto">
          Scansiona il codice QR di ogni opera per contribuire con le tue parole. Le parole appariranno nella nuvola in tempo reale, creando un'opera d'arte collaborativa e in continua evoluzione.
        </p>
      </div>
    </div>
  );
} 