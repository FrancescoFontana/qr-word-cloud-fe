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
  private wordMap: Map<string, number> = new Map();
  private isInitialLoad: boolean = true;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isViewPage: boolean = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private currentCode: string | null = null;
  private connectedCodes: Set<string> = new Set();

  constructor(private url: string) {}

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  connect(code: string, isViewPage: boolean = false) {
    if (this.connectedCodes.has(code)) {
      console.log('🔵 [WebSocket v3] Already connected to code:', code);
      return;
    }

    if (!this.ws) {
      console.log('🔵 [WebSocket v3] Initializing connection to:', this.url);
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
      this.reconnectAttempts = 0;
      this.isInitialLoad = true;

      this.keepAliveInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    }

    this.connectedCodes.add(code);
    this.currentCode = code;
    this.isViewPage = isViewPage;

    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendJoinMessage(code);
    }
  }

  private sendJoinMessage(code: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message = { 
      type: 'join_artwork', 
      artworkCode: code 
    };
    console.log('📤 [WebSocket v3] Sending join message:', message);
    this.ws.send(JSON.stringify(message));
  }

  private updateWordCloud() {
    const words = Array.from(this.wordMap.entries()).map(([text, value]) => ({
      text,
      value
    }));
    useWordCloudStore.getState().setWords(words);
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('🟢 [WebSocket v3] Connected');
      this.reconnectAttempts = 0;
      
      this.connectedCodes.forEach(code => {
        this.sendJoinMessage(code);
      });
    };

    this.ws.onmessage = (event) => {
      console.log('📥 [WebSocket v3] Received message:', event.data);
      const data = JSON.parse(event.data);
      
      this.messageHandlers.get('message')?.forEach(handler => handler(event));
      
      switch (data.type) {
        case 'update_cloud':
          if (data.words) {
            this.wordMap.clear();
            data.words.forEach((word: string) => {
              const normalizedWord = word.toLowerCase();
              this.wordMap.set(normalizedWord, (this.wordMap.get(normalizedWord) || 0) + 1);
            });
            this.updateWordCloud();
            
            if (data.newWord) {
              if (this.isViewPage) {
                useWordCloudStore.getState().setBlurred(false);
                setTimeout(() => {
                  useWordCloudStore.getState().setBlurred(true);
                }, 3000);
              } else {
                useWordCloudStore.getState().setBlurred(false);
              }
            } else if (!this.isInitialLoad) {
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
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.ws) {
        console.log('WebSocket state:', {
          readyState: this.ws.readyState,
          url: this.ws.url,
          protocol: this.ws.protocol
        });
      }
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.currentCode || '', this.isViewPage);
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
      this.currentCode = null;
      this.connectedCodes.clear();
    }
  }

  sendWord(word: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.isInitialLoad = false;
      const message = { 
        type: 'send_word', 
        word: word.toLowerCase()
      };
      console.log('📤 [WebSocket v3] Sending word message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'); 