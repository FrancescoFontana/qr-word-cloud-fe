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

  constructor(private url: string) {
    console.log('🔵 [WebSocket] Service initialized with URL:', url);
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    console.log('🔵 [WebSocket] Adding message handler');
    this.messageHandlers.push(handler);
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void) {
    console.log('🔵 [WebSocket] Removing message handler');
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  connect(code: string, isViewPage: boolean = false) {
    console.log('🔵 [WebSocket] Connecting with code:', code, 'isViewPage:', isViewPage);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔵 [WebSocket] Connection already open, skipping');
      return;
    }

    this.isViewPage = isViewPage;
    console.log('🔵 [WebSocket] Creating new WebSocket connection to:', this.url);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners(code);
      this.reconnectAttempts = 0;
      this.isInitialLoad = true;

      // Start keep-alive interval
      this.keepAliveInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          console.log('🔵 [WebSocket] Sending keep-alive ping');
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds
    } catch (error) {
      console.error('🔴 [WebSocket] Error creating WebSocket:', error);
      this.handleReconnect(code);
    }
  }

  private setupEventListeners(code: string) {
    if (!this.ws) {
      console.error('🔴 [WebSocket] Cannot setup event listeners: WebSocket is null');
      return;
    }

    this.ws.onopen = () => {
      console.log('🟢 [WebSocket] Connection opened');
      this.reconnectAttempts = 0;
      const message = { 
        type: 'join_artwork', 
        artworkCode: code 
      };
      console.log('📤 [WebSocket] Sending join message:', message);
      this.ws?.send(JSON.stringify(message));
    };

    this.ws.onmessage = (event) => {
      console.log('📥 [WebSocket] Received message:', event.data);
      
      try {
        // Call registered message handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error('🔴 [WebSocket] Error in message handler:', error);
          }
        });
      } catch (error) {
        console.error('🔴 [WebSocket] Error processing message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`🔴 [WebSocket] Connection closed with code ${event.code} and reason: ${event.reason}`);
      this.handleReconnect(code);
    };

    this.ws.onerror = (error) => {
      console.error('🔴 [WebSocket] WebSocket error:', error);
      // Log additional connection state information
      if (this.ws) {
        console.log('🔴 [WebSocket] Connection state:', {
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
      const delay = this.reconnectTimeout * this.reconnectAttempts;
      console.log(`🔄 [WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      setTimeout(() => {
        this.connect(code);
      }, delay);
    } else {
      console.error('🔴 [WebSocket] Max reconnection attempts reached');
    }
  }

  disconnect() {
    console.log('🔵 [WebSocket] Disconnecting');
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
      console.log('📤 [WebSocket] Sending word message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('🔴 [WebSocket] Cannot send word: WebSocket is not open');
    }
  }
}

// Create and export a singleton instance
export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'); 