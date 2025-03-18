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

  useEffect(() => {
    console.log('Initializing WebSocket connection for code:', code);
    wsService.connect(code);
    return () => wsService.disconnect();
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'update_cloud' && Array.isArray(data.words)) {
          console.log('Processing words array:', data.words);
          const processedWords = data.words.map((word: any) => {
            console.log('Processing word:', word, 'Type:', typeof word);
            return String(word).trim();
          }).filter(Boolean);
          console.log('Final processed words:', processedWords);
          setWords(processedWords);
        } else if (data.type === 'error') {
          setError(data.message);
          setTimeout(() => setError(null), 3000);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    wsService.addEventListener('message', handleMessage);
    return () => wsService.removeEventListener('message', handleMessage);
  }, []);

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
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background Word Cloud - Always visible but blurred until submission */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          isBlurred ? 'blur-xl opacity-30' : 'blur-0 opacity-100'
        }`}
      >
        <WordCloud words={words} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Error Message */}
        {error && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-300 px-6 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Input Form - Only visible before submission */}
        {!hasSubmitted && (
          <div className="w-full max-w-md transform transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter a word or short phrase..."
                maxLength={50}
                className="w-full px-6 py-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300"
                autoFocus
              />
              <button
                type="submit"
                className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium tracking-wide"
              >
                Add to Artwork
              </button>
            </form>
          </div>
        )}

        {/* Success Message - Shown briefly after submission */}
        {hasSubmitted && (
          <div className="transform transition-all duration-500 opacity-0 animate-fade-out">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white text-center">
              <p className="text-lg font-light">
                Word added to the artwork
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 