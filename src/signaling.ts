import { Events } from 'obsidian';
import type { PeerInfo, SignalingMessage } from './types';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

interface WsConfig {
  rtcConfig?: RTCConfiguration;
  wsFallback?: boolean;
}

export class SignalingClient extends Events {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private deviceName: string;
  private reconnectAttempt = 0;
  private peerId: string | null = null;
  private peerIdHash: string | null = null;
  private manualDisconnect = false;
  private wsConfig: WsConfig = {};
  private currentRoomType: string | null = null;
  private currentRoomId: string | null = null;

  constructor(serverUrl: string, deviceName: string) {
    super();
    this.serverUrl = serverUrl;
    this.deviceName = deviceName;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.manualDisconnect = false;

      try {
        // Build WebSocket URL
        let wsUrl = this.serverUrl;

        // Ensure we have a proper WebSocket URL
        if (wsUrl.startsWith('http://')) {
          wsUrl = wsUrl.replace('http://', 'ws://');
        } else if (wsUrl.startsWith('https://')) {
          wsUrl = wsUrl.replace('https://', 'wss://');
        } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
          wsUrl = 'wss://' + wsUrl;
        }

        // Remove trailing slash
        wsUrl = wsUrl.replace(/\/$/, '');

        // Add /server path if connecting to a PairDrop instance without a path
        const url = new URL(wsUrl);
        if (url.pathname === '/' || url.pathname === '') {
          url.pathname = '/server';
        }

        // Add query parameters that PairDrop expects
        url.searchParams.set('webrtc_supported', 'true');
        if (this.peerId && this.peerIdHash) {
          url.searchParams.set('peer_id', this.peerId);
          url.searchParams.set('peer_id_hash', this.peerIdHash);
        }

        console.log('PeerDrop: Connecting to', url.toString());

        this.ws = new WebSocket(url.toString());

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('PeerDrop: Connection timeout');
            this.ws.close();
            reject(new Error('Connection timeout - server may not accept external connections'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('PeerDrop: Connected to signaling server');
          this.reconnectAttempt = 0;
          // Don't send introduction - PairDrop server sends us our identity automatically
          // Don't start ping interval - server sends pings to us, we just respond with pong
          this.trigger('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('PeerDrop: Disconnected from signaling server', event.code, event.reason);
          this.trigger('disconnected');

          // Only auto-reconnect if not manually disconnected
          if (!this.manualDisconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('PeerDrop: WebSocket error', error);
          this.trigger('error', error);
          reject(new Error('WebSocket connection failed - check server URL and ensure the server accepts external connections'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.manualDisconnect = true;
    if (this.ws) {
      // Tell the server we're disconnecting gracefully
      this.send({ type: 'disconnect' });
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getPeerId(): string | null {
    return this.peerId;
  }

  send(message: SignalingMessage): void {
    if (!this.isConnected()) {
      console.warn('PeerDrop: Cannot send message, not connected');
      return;
    }
    this.ws?.send(JSON.stringify(message));
  }

  sendSignal(recipientId: string, message: object): void {
    if (!this.currentRoomId) {
      console.warn('PeerDrop: Cannot send signal, not in a room yet');
      return;
    }
    console.log('PeerDrop: Sending signal to', recipientId, message);
    this.send({
      type: 'signal',
      to: recipientId,
      roomType: this.currentRoomType,
      roomId: this.currentRoomId,
      ...message,
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as SignalingMessage;

      // Don't log ping/pong to reduce noise
      if (message.type !== 'ping') {
        console.log('PeerDrop: Received', message.type, message);
      }

      switch (message.type) {
        case 'ws-config':
          // Server sends RTC config and WS fallback settings
          this.wsConfig = (message.wsConfig as WsConfig) || {};
          console.log('PeerDrop: Got ws-config', this.wsConfig);
          this.trigger('ws-config', this.wsConfig);
          break;

        case 'display-name':
          // Server assigns us an identity - store it and join the IP room
          this.peerId = message.peerId as string;
          this.peerIdHash = message.peerIdHash as string;
          console.log('PeerDrop: Got identity', this.peerId);
          this.trigger('display-name', message);
          // Now join the IP room to discover peers on the same network
          this.joinIpRoom();
          break;

        case 'peers':
          // List of peers already in the room - also contains room info
          this.currentRoomType = (message.roomType as string) || 'ip';
          this.currentRoomId = (message.roomId as string) || null;
          console.log('PeerDrop: In room', this.currentRoomType, this.currentRoomId);
          this.trigger('peers', (message.peers as PeerInfo[]) || []);
          break;

        case 'peer-joined':
          // A new peer joined the room
          this.trigger('peer-joined', message.peer as PeerInfo);
          break;

        case 'peer-left':
          // A peer left the room
          this.trigger('peer-left', message.peerId as string);
          break;

        case 'signal':
          // WebRTC signaling message from another peer
          // sender is an object with id and rtcSupported
          const sender = message.sender as { id: string; rtcSupported: boolean } | undefined;
          this.trigger('signal', {
            senderId: sender?.id,
            ...message,
          });
          break;

        case 'ping':
          // Server keepalive - must respond immediately with pong
          this.send({ type: 'pong' });
          break;

        default:
          console.log('PeerDrop: Unknown message type', message.type);
      }
    } catch (error) {
      console.error('PeerDrop: Error parsing message', error);
    }
  }

  private joinIpRoom(): void {
    // Join the IP-based room so peers on the same network can discover us
    console.log('PeerDrop: Joining IP room');
    this.send({ type: 'join-ip-room' });
  }

  getWsConfig(): WsConfig {
    return this.wsConfig;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= RECONNECT_DELAYS.length) {
      console.log('PeerDrop: Max reconnection attempts reached');
      this.trigger('max-reconnect-failed');
      return;
    }

    const delay = RECONNECT_DELAYS[this.reconnectAttempt];
    console.log(`PeerDrop: Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.reconnectAttempt++;
      this.connect().catch((error) => {
        console.error('PeerDrop: Reconnection failed', error);
      });
    }, delay);
  }

  updateServerUrl(url: string): void {
    this.serverUrl = url;
  }

  updateDeviceName(name: string): void {
    this.deviceName = name;
  }
}
