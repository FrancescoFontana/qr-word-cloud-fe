import { create } from 'zustand';

interface Word {
  text: string;
  value: number;
}

interface WordCloudState {
  words: Word[];
  error: string | null;
  isBlurred: boolean;
  setWords: (words: Word[]) => void;
  setError: (error: string | null) => void;
  setBlurred: (isBlurred: boolean) => void;
}

export const useWordCloudStore = create<WordCloudState>((set) => ({
  words: [],
  error: null,
  isBlurred: true,
  setWords: (words) => set({ words }),
  setError: (error) => set({ error }),
  setBlurred: (isBlurred) => set({ isBlurred }),
}));

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  constructor(private url: string) {}

  connect(code: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔵 [WebSocket v3] Initializing connection');
    this.ws = new WebSocket(this.url);
    this.setupEventListeners(code);
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(code: string) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('🟢 [WebSocket v3] Connected, sending join_artwork message');
      this.reconnectAttempts = 0;
      const message = { 
        type: 'join_artwork', 
        artworkCode: code 
      };
      console.log('📤 [WebSocket v3] Sending message:', message);
      this.ws?.send(JSON.stringify(message));
    };

    this.ws.onmessage = (event) => {
      console.log('📥 [WebSocket v3] Received message:', event.data);
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'update_cloud':
          if (data.words) {
            // Update the word cloud with the new words array
            useWordCloudStore.getState().setWords(data.words);
            // Unblur the word cloud when new words arrive
            useWordCloudStore.getState().setBlurred(false);
            // Re-blur after 3 seconds
            setTimeout(() => {
              useWordCloudStore.getState().setBlurred(true);
            }, 3000);
          }
          break;

        case 'error':
          useWordCloudStore.getState().setError(data.message);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect(code);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect(code);
    };
  }

  private handleReconnect(code: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(code);
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendWord(word: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = { 
        type: 'send_word', 
        word: word.toLowerCase() // Normalize to lowercase before sending
      };
      console.log('📤 [WebSocket v3] Sending word message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'wss://qr-word-cloud-be.onrender.com/ws'); 