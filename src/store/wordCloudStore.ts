import { create } from 'zustand';

interface Word {
  text: string;
  value: number;
}

interface WordCloudState {
  words: Word[];
  isBlurred: boolean;
  socket: WebSocket | null;
  connect: (artworkCode: string) => void;
  disconnect: () => void;
  submitWord: (word: string) => void;
  setBlurred: (blurred: boolean) => void;
  fetchInitialWords: (artworkCode: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export const useWordCloudStore = create<WordCloudState>((set, get) => ({
  words: [],
  isBlurred: true,
  socket: null,

  fetchInitialWords: async (artworkCode: string) => {
    try {
      const response = await fetch(`${API_URL}/api/words/${artworkCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch initial words');
      }
      const words = await response.json();
      set({ words });
      // Unblur the word cloud when initial words are loaded
      set({ isBlurred: false });
      // Re-blur after 3 seconds
      setTimeout(() => set({ isBlurred: true }), 3000);
    } catch (error) {
      console.error('Error fetching initial words:', error);
    }
  },

  connect: (artworkCode: string) => {
    // Fetch initial words first
    get().fetchInitialWords(artworkCode);

    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      // Send the artwork code when connection is established
      ws.send(JSON.stringify({ type: 'join', artworkCode }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'wordCloudUpdate') {
          set({ words: data.words || [] });
          // Unblur the word cloud when new words arrive
          set({ isBlurred: false });
          // Re-blur after 3 seconds
          setTimeout(() => set({ isBlurred: true }), 3000);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    set({ socket: ws });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null });
    }
  },

  submitWord: (word: string) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'submitWord', word }));
    }
  },

  setBlurred: (blurred: boolean) => {
    set({ isBlurred: blurred });
  },
})); 