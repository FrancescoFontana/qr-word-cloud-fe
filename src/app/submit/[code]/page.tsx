'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WordCloudComponent } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';

export default function SubmitPage() {
  const params = useParams();
  const artworkCode = params.code as string;
  const [word, setWord] = useState('');

  useEffect(() => {
    wsService.connect(artworkCode);
    return () => {
      wsService.disconnect();
    };
  }, [artworkCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim()) {
      wsService.sendWord(word.trim());
      setWord('');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <WordCloudComponent className="w-full h-full" />
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Inserisci la prima parola che ti è venuta in mente guardando l'opera
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Scrivi una parola..."
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
            >
              Invia
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 