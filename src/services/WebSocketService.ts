interface WebSocketMessage {
  type: 'update_cloud' | 'update_blur' | 'join_artwork';
  words?: string[];
  isBlurred?: boolean;
  artworkCode?: string;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandler: ((data: WebSocketMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private initializeConnection() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://qr-word-cloud-be.onrender.com/ws';
    console.log('🔵 [WebSocket v3] Initializing connection to:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('🟢 [WebSocket v3] Connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('📥 [WebSocket v3] Received message:', data);
        this.messageHandler?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔴 [WebSocket v3] Disconnected');
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.initializeConnection();
      }, 1000 * Math.min(this.reconnectAttempts, 5));
    }
  }

  public onMessage(handler: (data: WebSocketMessage) => void) {
    this.messageHandler = handler;
  }

  public joinArtwork(code: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'join_artwork',
        artworkCode: code
      };
      console.log('📤 [WebSocket v3] Sending message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }

  public connect() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.initializeConnection();
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.messageHandler = null;
  }
}

export { WebSocketService }; 