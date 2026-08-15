import { io, Socket } from 'socket.io-client';
import type { ClientEvent, ServerEvent, PlayerState } from '@aether/shared';

export type GameListener = (ev: ServerEvent) => void;

export class GameSocket {
  socket: Socket | null = null;
  private listeners = new Set<GameListener>();

  connect(token: string): void {
    this.disconnect();
    this.socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelayMax: 5000,
    });
    this.socket.on('game', (ev: ServerEvent) => {
      for (const l of this.listeners) l(ev);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(listener: GameListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(ev: ClientEvent): void {
    this.socket?.emit('game', ev);
  }
}

export const gameSocket = new GameSocket();

export type { PlayerState };
