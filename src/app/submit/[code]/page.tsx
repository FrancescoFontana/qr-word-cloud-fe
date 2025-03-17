'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { wsService } from '@/services/websocket';

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [word, setWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await wsService.sendWord(word.trim());
      setWord('');
      router.push(`/view/${code}`);
    } catch (error) {
      console.error('Failed to submit word:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Artistic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black/90" />
      
      {/* Artistic overlay pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-white/50 to-transparent" />

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-12">
          {/* Decorative elements */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10" />
            <h1 className="text-white/80 text-2xl tracking-[0.3em] uppercase font-light text-center">
              Contribute
            </h1>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter your word"
                className="w-full bg-transparent border-b border-white/20 text-white/80 placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors duration-300 text-center text-lg tracking-wider py-2"
                disabled={isSubmitting}
              />
              {/* Decorative underline animation */}
              <div className="absolute bottom-0 left-0 w-full h-px bg-white/20 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !word.trim()}
              className="w-full py-3 text-white/60 text-sm tracking-[0.3em] uppercase font-light hover:text-white/80 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 