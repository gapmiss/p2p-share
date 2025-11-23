import { Events } from 'obsidian';
import type { PeerInfo, SignalingMessage } from './types';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const PING_INTERVAL = 30000;

export class SignalingClient extends Events {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private deviceName: string;
  private reconnectAttempt = 0;
  private pingInterval: number | null = null;
  private peerId: string | null = null;
  private manualDisconnect = false;

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
          this.startPingInterval();
          this.sendIntroduction();
          this.trigger('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('PeerDrop: Disconnected from signaling server', event.code, event.reason);
          this.stopPingInterval();
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
    this.stopPingInterval();
    if (this.ws) {
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
    this.send({
      type: 'signal',
      to: recipientId,
      ...message,
    });
  }

  private sendIntroduction(): void {
    const name = {
      model: 'Obsidian',
      os: this.getOS(),
      browser: 'Obsidian',
      type: 'desktop',
      deviceName: this.deviceName || this.generateDeviceName(),
    };

    this.send({
      type: 'introduce',
      name,
      rtcSupported: true,
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as SignalingMessage;

      switch (message.type) {
        case 'peers':
          this.peerId = message.you as string;
          this.trigger('peers', message.peers as PeerInfo[]);
          break;

        case 'peer-joined':
          this.trigger('peer-joined', message.peer as PeerInfo);
          break;

        case 'peer-left':
          this.trigger('peer-left', message.peerId as string);
          break;

        case 'signal':
          this.trigger('signal', {
            senderId: message.sender,
            ...message,
          });
          break;

        case 'ping':
          this.send({ type: 'pong' });
          break;

        case 'display-name':
          this.trigger('display-name', message);
          break;

        default:
          console.log('PeerDrop: Unknown message type', message.type);
      }
    } catch (error) {
      console.error('PeerDrop: Error parsing message', error);
    }
  }

  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, PING_INTERVAL);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
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

  private getOS(): string {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'Windows';
    if (platform.includes('mac')) return 'macOS';
    if (platform.includes('linux')) return 'Linux';
    if (platform.includes('iphone') || platform.includes('ipad')) return 'iOS';
    if (platform.includes('android')) return 'Android';
    return 'Unknown';
  }

  private generateDeviceName(): string {
    const adjectives = ['Swift', 'Bright', 'Noble', 'Clever', 'Bold', 'Calm', 'Keen', 'Wise'];
    const nouns = ['Falcon', 'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Lion'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  }

  updateServerUrl(url: string): void {
    this.serverUrl = url;
  }

  updateDeviceName(name: string): void {
    this.deviceName = name;
  }
}
