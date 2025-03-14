import { useWordCloudStore } from '@/store/wordCloudStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private static instance: WebSocketService;
  private artworkCode: string = '';

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(artworkCode: string) {
    if (this.ws) {
      this.ws.close();
    }

    this.artworkCode = artworkCode;
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
      // Join the room when connection is established
      this.ws?.send(JSON.stringify({
        type: 'join_room',
        artworkCode: this.artworkCode
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update_cloud') {
        useWordCloudStore.getState().setWords(data.words);
        useWordCloudStore.getState().setBlurred(false);
        setTimeout(() => {
          useWordCloudStore.getState().setBlurred(true);
        }, 3000);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws = null;
    };
  }

  sendWord(word: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'send_word',
        word,
        artworkCode: this.artworkCode
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = WebSocketService.getInstance(); 