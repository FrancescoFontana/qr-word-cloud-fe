'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import WordCloud from '@/components/WordCloud';

interface Word {
  text: string;
  value: number;
}

export default function ViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [words, setWords] = useState<Word[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join', code }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'words') {
        setWords(data.words);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [code]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Word Cloud Display</h1>
        <p className="text-center text-gray-600">Code: {code}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
          {!isConnected ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Connecting...</p>
            </div>
          ) : (
            <WordCloud words={words} />
          )}
        </div>
      </div>
    </main>
  );
} 