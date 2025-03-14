'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WordCloudComponent } from '@/components/WordCloud';
import { wsService } from '@/services/websocket';

export default function ViewPage() {
  const params = useParams();
  const artworkCode = params.code as string;

  useEffect(() => {
    wsService.connect(artworkCode);
    return () => {
      wsService.disconnect();
    };
  }, [artworkCode]);

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="w-full h-screen">
        <WordCloudComponent className="w-full h-full" />
      </div>
    </main>
  );
} 