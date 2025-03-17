'use client';

import { useEffect, useState } from 'react';
import { wsService } from '@/services/websocket';

export default function TestPage() {
  const [status, setStatus] = useState('Initializing...');
  const [wsStatus, setWsStatus] = useState('Not connected');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    setStatus('Page loaded successfully');

    // Test WebSocket connection
    try {
      wsService.connect('test');
      setWsStatus('Connected to WebSocket');

      // Add message listener
      const ws = wsService['ws'];
      if (ws) {
        const originalOnMessage = ws.onmessage;
        ws.onmessage = (event) => {
          const timestamp = new Date().toLocaleTimeString();
          setMessages(prev => [...prev, `[${timestamp}] ${event.data}`.slice(0, 100)]);
          if (originalOnMessage) {
            originalOnMessage.call(ws, event);
          }
        };
      }

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
        <h1 className="text-2xl font-bold mb-6">WebSocket Test Page</h1>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Connection Status</h2>
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

          {/* Message Log */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Message Log</h2>
            <div className="h-96 overflow-y-auto font-mono text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="py-1 border-b border-gray-200">
                  {msg}
                </div>
              ))}
            </div>
          </div>

          {/* Test Controls */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Test Controls</h2>
            <div className="space-x-4">
              <button
                onClick={() => wsService.sendWord('test')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Test Word
              </button>
              <button
                onClick={() => {
                  wsService.disconnect();
                  setWsStatus('Disconnected');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
              <button
                onClick={() => {
                  wsService.connect('test');
                  setWsStatus('Reconnecting...');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 