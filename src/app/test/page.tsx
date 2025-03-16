'use client';

import { useEffect, useState } from 'react';
import { wsService } from '@/services/websocket';

export default function TestPage() {
  const [status, setStatus] = useState('Initializing...');
  const [wsStatus, setWsStatus] = useState('Not connected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('Page loaded successfully');

    // Test WebSocket connection
    try {
      wsService.connect('test');
      setWsStatus('Connected to WebSocket');

      return () => {
        wsService.disconnect();
        setWsStatus('Disconnected');
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to WebSocket');
      setWsStatus('Connection failed');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Service Test Page</h1>
        
        <div className="space-y-4">
          {/* Page Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Page Status</h2>
            <p className="text-green-600">{status}</p>
          </div>

          {/* Environment Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Environment Variables</h2>
            <p>WS URL: {process.env.NEXT_PUBLIC_WS_URL || 'Not set'}</p>
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
          </div>

          {/* WebSocket Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">WebSocket Status</h2>
            <p className={wsStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'}>
              {wsStatus}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              <h2 className="font-semibold mb-2">Error</h2>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 