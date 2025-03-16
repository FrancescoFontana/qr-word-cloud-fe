import { create } from 'zustand';

interface Word {
  text: string;
  value: number;
}

interface WordCloudState {
  words: Word[];
  blurred: boolean;
  error: string | null;
  setWords: (words: Word[]) => void;
  setBlurred: (blurred: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWordCloudStore = create<WordCloudState>((set) => ({
  words: [],
  blurred: true,
  error: null,
  setWords: (words) => set({ words }),
  setBlurred: (blurred) => set({ blurred }),
  setError: (error) => set({ error }),
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
            // Handle initial words array
            useWordCloudStore.getState().setWords(
              data.words.map((word: string) => ({ text: word, value: 1 }))
            );
          } else if (data.newWord) {
            // Handle new word
            const currentWords = useWordCloudStore.getState().words;
            const existingWord = currentWords.find(w => w.text === data.newWord);
            
            if (existingWord) {
              useWordCloudStore.getState().setWords(
                currentWords.map(w => 
                  w.text === data.newWord 
                    ? { ...w, value: w.value + 1 }
                    : w
                )
              );
            } else {
              useWordCloudStore.getState().setWords([
                ...currentWords,
                { text: data.newWord, value: 1 }
              ]);
            }
          }
          
          useWordCloudStore.getState().setBlurred(false);
          setTimeout(() => {
            useWordCloudStore.getState().setBlurred(true);
          }, 1000);
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
        word 
      };
      console.log('📤 [WebSocket v3] Sending word message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const wsService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'wss://qr-word-cloud-be.onrender.com/ws'); 