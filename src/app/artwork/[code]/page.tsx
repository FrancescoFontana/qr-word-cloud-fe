'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWordCloudStore, wsService } from '@/services/websocket';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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

export default function ArtworkPage() {
  const params = useParams();
  const code = params.code as string;
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [inputWord, setInputWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showInput, setShowInput] = useState(true);

  useEffect(() => {
    console.log('🔵 [ArtworkPage] Initializing');

    // Load font
    document.fonts.load('1em "Titillium Web"').then(() => {
      console.log('🔵 [ArtworkPage] Font loaded');
      setFontLoaded(true);
    });

    // Connect to WebSocket
    console.log('🔵 [ArtworkPage] Setting up WebSocket connection for code:', code);
    wsService.connect(code, false);

    // Handle WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📥 [ArtworkPage] Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'update_cloud':
            if (data.words) {
              console.log('📊 [ArtworkPage] Processing word update');
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
              
              console.log('✨ [ArtworkPage] Setting new words:', wordArray);
              setWords(wordArray);
            }
            break;

          case 'error':
            console.error('🔴 [ArtworkPage] Received error:', data.message);
            setError(data.message);
            break;

          default:
            console.log('ℹ️ [ArtworkPage] Received unknown message type:', data.type);
        }
      } catch (error) {
        console.error('🔴 [ArtworkPage] Error processing WebSocket message:', error);
        setError('Failed to process message');
      }
    };

    wsService.addEventListener('message', handleMessage);

    return () => {
      console.log('🔵 [ArtworkPage] Cleaning up');
      wsService.removeEventListener('message', handleMessage);
      wsService.disconnect();
    };
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('📤 [ArtworkPage] Sending word:', inputWord);
      wsService.sendWord(inputWord.trim());
      setInputWord('');
      
      // Fade out input and unblur word cloud
      setShowInput(false);
      setIsBlurred(false);
    } catch (err) {
      console.error('🔴 [ArtworkPage] Error sending word:', err);
      setError('Failed to send word');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showInput ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-full max-w-md px-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
                  <h1 className="text-xl font-light italic mb-6 text-center">
                    Lascia una parola o un concetto
                  </h1>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={inputWord}
                        onChange={(e) => setInputWord(e.target.value)}
                        placeholder="Inserisci qui"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputWord.trim() || isSubmitting}
                      className="w-full px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Invia al CloudWall'}
                    </button>
                  </form>
                </div>
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