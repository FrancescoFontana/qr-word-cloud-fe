'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WebSocketService } from '@/services/websocket';

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const [word, setWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ws, setWs] = useState<WebSocketService | null>(null);

  useEffect(() => {
    const code = params.code as string;
    const websocket = new WebSocketService(code);
    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, [params.code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isSubmitting) return;

    setIsSubmitting(true);
    ws?.sendWord(word.trim());
    setWord('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black animate-gradient" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-light text-gray-300 mb-8 text-center tracking-widest uppercase animate-fade-in">
            Contribute
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl animate-pulse-slow" />
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter a word"
                className="relative w-full bg-transparent border-b border-gray-700 py-4 px-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-300 transition-colors duration-300"
                disabled={isSubmitting}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !word.trim()}
              className="w-full py-4 px-6 bg-white/10 text-gray-300 rounded-sm hover:bg-white/20 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase text-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 