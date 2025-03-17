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
  private wordMap: Map<string, number> = new Map();
  private isInitialLoad: boolean = true;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isViewPage: boolean = false;

  constructor(private url: string) {}

  connect(code: string, isViewPage: boolean = false) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isViewPage = isViewPage;
    console.log('🔵 [WebSocket v3] Initializing connection to:', this.url);
    this.ws = new WebSocket(this.url);
    this.setupEventListeners(code);
    this.reconnectAttempts = 0;
    this.isInitialLoad = true;

    // Start keep-alive interval
    this.keepAliveInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private updateWordCloud() {
    const words = Array.from(this.wordMap.entries()).map(([text, value]) => ({
      text,
      value
    }));
    useWordCloudStore.getState().setWords(words);
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
            // Clear the word map and update with new words
            this.wordMap.clear();
            data.words.forEach((word: string) => {
              const normalizedWord = word.toLowerCase();
              this.wordMap.set(normalizedWord, (this.wordMap.get(normalizedWord) || 0) + 1);
            });
            this.updateWordCloud();
            
            // Handle blur state based on page type and newWord field
            if (data.newWord) {
              if (this.isViewPage) {
                // On view page, unblur for 3 seconds when new word arrives
                useWordCloudStore.getState().setBlurred(false);
                setTimeout(() => {
                  useWordCloudStore.getState().setBlurred(true);
                }, 3000);
              } else {
                // On artwork page, unblur and stay unblurred when new word arrives
                useWordCloudStore.getState().setBlurred(false);
              }
            } else if (!this.isInitialLoad) {
              // For non-new-word updates, only unblur if not initial load
              useWordCloudStore.getState().setBlurred(false);
              if (this.isViewPage) {
                setTimeout(() => {
                  useWordCloudStore.getState().setBlurred(true);
                }, 3000);
              }
            }
          }
          break;

        case 'error':
          useWordCloudStore.getState().setError(data.message);
          break;
      }
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket disconnected with code ${event.code} and reason: ${event.reason}`);
      this.handleReconnect(code);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Log additional connection state information
      if (this.ws) {
        console.log('WebSocket state:', {
          readyState: this.ws.readyState,
          url: this.ws.url,
          protocol: this.ws.protocol
        });
      }
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
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.wordMap.clear();
    }
  }

  sendWord(word: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.isInitialLoad = false; // Mark that we're no longer in initial load
      const message = { 
        type: 'send_word', 
        word: word.toLowerCase() // Normalize to lowercase before sending
      };
      console.log('📤 [WebSocket v3] Sending word message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const wsService = new WebSocketService('wss://qr-word-cloud-be.onrender.com/ws'); 