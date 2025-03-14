declare module 'socket.io-client' {
  import { Socket as NetSocket } from 'net';

  interface SocketOptions {
    query?: Record<string, string>;
    transports?: string[];
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    autoConnect?: boolean;
    path?: string;
  }

  interface Socket extends NetSocket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    io: Manager;
    emit(event: string, ...args: any[]): boolean;
    on(event: string, callback: (...args: any[]) => void): this;
    once(event: string, callback: (...args: any[]) => void): this;
    off(event: string, callback?: (...args: any[]) => void): this;
    connect(): this;
    disconnect(): this;
  }

  interface Manager {
    socket(namespace: string, opts?: SocketOptions): Socket;
  }

  function io(uri: string, opts?: SocketOptions): Socket;
  export = io;
} 