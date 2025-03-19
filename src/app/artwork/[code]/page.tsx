'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';

interface PageProps {
  params: {
    code: string;
  };
}

export default function ArtworkPage({ params }: PageProps) {
  const { code } = params;
  const [words, setWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Background Word Cloud - Always visible but blurred until submission */}
      <div 
        className={`fixed inset-0 w-full h-screen transition-all duration-1000 ${
          isBlurred ? 'blur-xl opacity-60' : 'blur-0 opacity-100'
        }`}
      >
        <WordCloud words={words} />
      </div>

      {/* Content Overlay */}
      <div className="relative z-40 flex flex-col items-center justify-center min-h-screen">
        {/* Input Form - Only visible before submission */}
        {!hasSubmitted && (
          <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Inserisci una parola o una breve frase..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-base sm:text-lg"
                  maxLength={50}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {inputValue.length}/50
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 sm:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-medium transition-colors duration-200 text-base sm:text-lg"
              >
                Aggiungi
              </button>
            </form>
          </div>
        )}

        {/* Success Message */}
        {hasSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6 animate-fade-out">
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-white">
              Grazie per il tuo Contributo
            </p>
            <p className="text-sm sm:text-base text-gray-300">
              La tua parola è stata aggiunta nel Cloudwall
            </p>
          </div>
        )}

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