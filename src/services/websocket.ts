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

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private isInitialLoad: boolean = true;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isViewPage: boolean = false;
  private messageHandlers: ((event: MessageEvent) => void)[] = [];

  constructor(private url: string) {}

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    this.messageHandlers.push(handler);
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

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
      
      // Call registered message handlers
      this.messageHandlers.forEach(handler => handler(event));
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

export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'); 