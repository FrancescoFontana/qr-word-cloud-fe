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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Word Cloud - Always visible but blurred until submission */}
      <div 
        className={`fixed inset-0 w-full h-screen transition-all duration-1000 ${
          isBlurred ? 'blur-xl opacity-60' : 'blur-0 opacity-100'
        }`}
      >
        <WordCloud words={words} />
      </div>

      {/* Content Container */}
      <div className="relative z-40 min-h-screen flex flex-col items-center justify-center">
        {/* Error Message */}
        {error && (
          <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-200 px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}

        {/* Input Form - Only visible before submission */}
        {!hasSubmitted && (
          <div className="w-full max-w-md transform transition-all duration-500 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter a word or short phrase..."
                maxLength={50}
                className="w-full px-6 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300 shadow-lg text-xl"
                autoFocus
              />
              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 font-medium tracking-wide shadow-lg text-xl"
              >
                Add to Artwork
              </button>
            </form>
          </div>
        )}

        {/* Success Message - Shown briefly after submission */}
        {hasSubmitted && (
          <div className="transform transition-all duration-500 opacity-0 animate-fade-out">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 text-white text-center shadow-lg">
              <p className="text-2xl font-light">
                Word added to the artwork
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 