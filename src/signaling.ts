import { Events } from 'obsidian';
import type { PeerInfo, SignalingMessage } from './types';
import { logger } from './logger';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

interface WsConfig {
  rtcConfig?: RTCConfiguration;
  wsFallback?: boolean;
}

export class SignalingClient extends Events {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private reconnectAttempt = 0;
  private peerId: string | null = null;
  private peerIdHash: string | null = null;
  private displayName: string | null = null;
  private manualDisconnect = false;
  private wsConfig: WsConfig = {};
  private currentRoomType: string | null = null;
  private currentRoomId: string | null = null;
  private roomSecrets: string[] = [];
  private discoveryMode: 'auto' | 'paired-only' = 'auto';

  constructor(serverUrl: string) {
    super();
    this.serverUrl = serverUrl;
  }

  /**
   * Set room secrets to rejoin on connect.
   * Call this before connect() to auto-join paired device rooms.
   */
  setRoomSecrets(secrets: string[]): void {
    this.roomSecrets = secrets;
  }

  /**
   * Set discovery mode to control which rooms to join.
   * 'auto': Join both IP room and paired device rooms
   * 'paired-only': Join only paired device rooms (no local network discovery)
   */
  setDiscoveryMode(mode: 'auto' | 'paired-only'): void {
    this.discoveryMode = mode;
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

        logger.info('Connecting to', url.toString());

        this.ws = new WebSocket(url.toString());

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            logger.error('Connection timeout');
            this.ws.close();
            reject(new Error('Connection timeout - server may not accept external connections'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          logger.info('Connected to signaling server');
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
          logger.info('Disconnected from signaling server', event.code, event.reason);
          this.trigger('disconnected');

          // Only auto-reconnect if not manually disconnected
          if (!this.manualDisconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          logger.error('WebSocket error', error);
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
      const currentWs = this.ws;
      this.ws = null;

      // Tell the server we're disconnecting gracefully
      if (currentWs.readyState === WebSocket.OPEN) {
        try {
          currentWs.send(JSON.stringify({ type: 'disconnect' }));
        } catch (error) {
          logger.warn('Failed to send disconnect message', error);
        }
      }

      // Remove event handlers to prevent stale events
      currentWs.onopen = null;
      currentWs.onmessage = null;
      currentWs.onerror = null;
      currentWs.onclose = null;

      // Close the connection
      currentWs.close();
    }
  }

  /**
   * Reconnect to the server (used for manual reconnection).
   * This properly disconnects and resets state before reconnecting.
   */
  async reconnect(): Promise<void> {
    // Disconnect cleanly
    this.disconnect();

    // Reset reconnect counter since this is a manual reconnect
    this.reconnectAttempt = 0;

    // Small delay to ensure the old connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Connect again
    await this.connect();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getPeerId(): string | null {
    return this.peerId;
  }

  getDisplayName(): string | null {
    return this.displayName;
  }

  send(message: SignalingMessage): void {
    if (!this.isConnected()) {
      logger.warn('Cannot send message, not connected');
      return;
    }
    this.ws?.send(JSON.stringify(message));
  }

  sendSignal(recipientId: string, message: object): void {
    if (!this.currentRoomId) {
      logger.warn('Cannot send signal, not in a room yet');
      return;
    }
    logger.debug('Sending signal to', recipientId, message);
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
        logger.debug('Received', message.type, message);
      }

      switch (message.type) {
        case 'ws-config':
          // Server sends RTC config and WS fallback settings
          this.wsConfig = (message.wsConfig as WsConfig) || {};
          logger.debug('Got ws-config', this.wsConfig);
          this.trigger('ws-config', this.wsConfig);
          break;

        case 'display-name':
          // Server assigns us an identity - store it and join the IP room
          this.peerId = message.peerId as string;
          this.peerIdHash = message.peerIdHash as string;
          this.displayName = (message.displayName as string) || (message.deviceName as string) || null;
          logger.debug('Got identity', this.peerId, 'displayName:', this.displayName);
          this.trigger('display-name', message);
          // Now join the IP room to discover peers on the same network
          this.joinIpRoom();
          break;

        case 'peers':
          // List of peers already in the room - also contains room info
          this.currentRoomType = (message.roomType as string) || 'ip';
          this.currentRoomId = (message.roomId as string) || null;
          logger.debug('In room', this.currentRoomType, this.currentRoomId);
          this.trigger('peers', {
            peers: (message.peers as PeerInfo[]) || [],
            roomType: this.currentRoomType,
            roomId: this.currentRoomId,
          });
          break;

        case 'peer-joined':
          // A new peer joined the room
          this.trigger('peer-joined', {
            peer: message.peer as PeerInfo,
            roomType: message.roomType as string,
            roomId: message.roomId as string,
          });
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

        // Device pairing responses
        case 'pair-device-initiated':
          // Server created a pairing room and gave us a code
          this.trigger('pair-device-initiated', {
            pairKey: message.pairKey as string,
            roomSecret: message.roomSecret as string,
          });
          break;

        case 'pair-device-joined':
          // Successfully joined a pairing - both devices now have the room secret
          this.trigger('pair-device-joined', {
            roomSecret: message.roomSecret as string,
            peerId: message.peerId as string,
          });
          break;

        case 'pair-device-join-key-invalid':
          // The pairing code was invalid or expired
          this.trigger('pair-device-join-key-invalid');
          break;

        case 'pair-device-canceled':
          // Pairing was canceled
          this.trigger('pair-device-canceled', message.pairKey as string);
          break;

        case 'secret-room-deleted':
          // A paired room was deleted (other device unpaired)
          this.trigger('secret-room-deleted', message.roomSecret as string);
          break;

        default:
          logger.warn('Unknown message type', message.type);
      }
    } catch (error) {
      logger.error('Error parsing message', error);
    }
  }

  private joinIpRoom(): void {
    // Join rooms based on discovery mode
    if (this.discoveryMode === 'auto') {
      // Join both IP room and paired device rooms
      logger.debug('Joining IP room (auto mode)');
      this.send({ type: 'join-ip-room' });

      if (this.roomSecrets.length > 0) {
        logger.debug('Sending room secrets for', this.roomSecrets.length, 'paired devices');
        this.send({ type: 'room-secrets', roomSecrets: this.roomSecrets });
      }
    } else if (this.discoveryMode === 'paired-only') {
      // Skip IP room, only join paired device rooms
      if (this.roomSecrets.length > 0) {
        logger.debug('Joining only paired device rooms (paired-only mode)');
        this.send({ type: 'room-secrets', roomSecrets: this.roomSecrets });
      } else {
        logger.warn('paired-only mode but no paired devices - not joining any rooms');
      }
    }
  }

  // ============================================================================
  // DEVICE PAIRING
  // ============================================================================

  /**
   * Initiate device pairing. Server will respond with a 6-digit code.
   * Listen for 'pair-device-initiated' event to get the code.
   */
  pairDeviceInitiate(): void {
    if (!this.isConnected()) {
      this.trigger('error', new Error('Not connected to server'));
      return;
    }
    logger.debug('Initiating device pairing');
    this.send({ type: 'pair-device-initiate' });
  }

  /**
   * Join a pairing using a 6-digit code from another device.
   * Listen for 'pair-device-joined' event on success.
   */
  pairDeviceJoin(pairKey: string): void {
    if (!this.isConnected()) {
      this.trigger('error', new Error('Not connected to server'));
      return;
    }
    logger.debug('Joining device pairing with key', pairKey);
    this.send({ type: 'pair-device-join', pairKey });
  }

  /**
   * Cancel an ongoing pairing attempt.
   */
  pairDeviceCancel(): void {
    if (!this.isConnected()) return;
    logger.debug('Canceling device pairing');
    this.send({ type: 'pair-device-cancel' });
  }

  /**
   * Remove a paired device by deleting its room secret.
   */
  deleteRoomSecret(roomSecret: string): void {
    this.roomSecrets = this.roomSecrets.filter((s) => s !== roomSecret);
    if (this.isConnected()) {
      logger.debug('Deleting room secret');
      this.send({ type: 'room-secrets-deleted', roomSecrets: [roomSecret] });
    }
  }

  getWsConfig(): WsConfig {
    return this.wsConfig;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= RECONNECT_DELAYS.length) {
      logger.warn('Max reconnection attempts reached');
      this.trigger('max-reconnect-failed');
      return;
    }

    const delay = RECONNECT_DELAYS[this.reconnectAttempt];
    logger.info(`Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.reconnectAttempt++;
      this.connect().catch((error) => {
        logger.error('Reconnection failed', error);
      });
    }, delay);
  }

  updateServerUrl(url: string): void {
    this.serverUrl = url;
  }

  /**
   * Switch discovery mode and rejoin appropriate rooms.
   * Requires an active connection.
   */
  switchDiscoveryMode(mode: 'auto' | 'paired-only'): void {
    if (!this.isConnected()) {
      logger.warn('Cannot switch discovery mode while disconnected');
      return;
    }

    const oldMode = this.discoveryMode;
    this.discoveryMode = mode;

    if (oldMode === mode) {
      return; // No change
    }

    logger.info('Switching discovery mode from', oldMode, 'to', mode);

    // Emit event to clear current peers before rejoining rooms
    this.trigger('discovery-mode-switching');

    // Rejoin appropriate rooms based on new mode
    if (mode === 'auto') {
      // Switch to auto: join both IP room and paired device rooms
      this.joinIpRoom();
    } else if (mode === 'paired-only') {
      // Switch to paired-only: only join paired device rooms
      if (this.roomSecrets.length > 0) {
        logger.debug('Rejoining paired device rooms only');
        this.send({ type: 'room-secrets', roomSecrets: this.roomSecrets });
      } else {
        logger.warn('paired-only mode but no paired devices');
        // Emit empty peers list since we're not in any rooms
        this.trigger('peers', { peers: [], roomType: null, roomId: null });
      }
    }
  }
}
