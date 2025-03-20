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

interface WordsResponse {
  [code: string]: string[];
}

export default function ArtworkPage({ params }: PageProps) {
  const { code } = params;
  const [words, setWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    console.log('Initializing WebSocket connection for code:', code);
    wsService.connect(code, false); // Connect as artwork page
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
          
          // Only update blur state if it's not the initial load and there's a new word
          if (!isInitialLoad && data.newWord) {
            setIsBlurred(false);
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
      }
    };

    wsService.addEventListener('message', handleMessage);
    return () => wsService.removeEventListener('message', handleMessage);
  }, [isInitialLoad]);

  useEffect(() => {
    // Check if font is loaded
    document.fonts.ready.then(() => {
      console.log('Fonts loaded');
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch('https://qr-word-cloud-be.onrender.com/api/words/all');
        if (!response.ok) {
          throw new Error('Failed to fetch words');
        }
        const data: WordsResponse = await response.json();
        setWords(data[params.code] || []);
      } catch (err) {
        setError('Errore nel caricamento delle parole');
        console.error('Error fetching words:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [params.code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      try {
        await wsService.sendWord(inputValue.trim());
        setInputValue('');
        setHasSubmitted(true);
        setIsBlurred(false);
      } catch (err) {
        console.error('Failed to send word:', err);
        setError('Failed to send word. Please try again.');
      }
    }
  };

  if (loading || !fontLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Caricamento opera...
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
        <div className="relative w-full aspect-square max-w-4xl mx-auto bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
          <WordCloud words={words} />
        </div>
      </div>
    </div>
  );
} 