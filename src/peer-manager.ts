import { Events, TFile, TFolder, Vault } from 'obsidian';
import { SignalingClient } from './signaling';
import { RTCPeer } from './rtc-peer';
import { logger } from './logger';
import type { PeerInfo, FileMetadata, P2PShareSettings } from './types';

export class PeerManager extends Events {
  private signaling: SignalingClient;
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, RTCPeer> = new Map();
  private vault: Vault;
  private settings: P2PShareSettings;

  constructor(vault: Vault, settings: P2PShareSettings) {
    super();
    this.vault = vault;
    this.settings = settings;
    this.signaling = new SignalingClient(settings.serverUrl, settings.deviceName);
    // Set room secrets from paired devices before connecting
    this.signaling.setRoomSecrets(settings.pairedDevices.map((d) => d.roomSecret));
    this.setupSignalingHandlers();
  }

  private setupSignalingHandlers(): void {
    this.signaling.on('connected', () => {
      this.trigger('server-connected');
    });

    this.signaling.on('disconnected', () => {
      // Clear all peers and connections on disconnect
      this.peers.clear();
      for (const connection of this.connections.values()) {
        connection.close();
      }
      this.connections.clear();
      this.trigger('server-disconnected');
      this.trigger('peers-updated', []);
    });

    this.signaling.on('peers', (data: { peers: PeerInfo[]; roomType: string; roomId: string }) => {
      // Add peers to our map (don't clear - we may be in multiple rooms)
      for (const peer of data.peers) {
        this.peers.set(peer.id, peer);
      }
      this.trigger('peers-updated', Array.from(this.peers.values()));

      // If this is a secret room (paired device), emit event to update device name
      if (data.roomType === 'secret' && data.peers.length > 0) {
        const peer = data.peers[0];
        const displayName = peer.name.displayName || peer.name.deviceName || peer.name.model || 'Paired Device';
        this.trigger('paired-device-identified', {
          roomSecret: data.roomId,
          displayName,
        });
      }
    });

    this.signaling.on('peer-joined', (data: { peer: PeerInfo; roomType: string; roomId: string }) => {
      this.peers.set(data.peer.id, data.peer);
      this.trigger('peer-joined', data.peer);
      this.trigger('peers-updated', Array.from(this.peers.values()));

      // If this is a secret room (paired device), emit event to update device name
      if (data.roomType === 'secret') {
        const displayName = data.peer.name.displayName || data.peer.name.deviceName || data.peer.name.model || 'Paired Device';
        this.trigger('paired-device-identified', {
          roomSecret: data.roomId,
          displayName,
        });
      }
    });

    this.signaling.on('peer-left', (peerId: string) => {
      this.peers.delete(peerId);
      const connection = this.connections.get(peerId);
      if (connection) {
        connection.close();
        this.connections.delete(peerId);
      }
      this.trigger('peer-left', peerId);
      this.trigger('peers-updated', Array.from(this.peers.values()));
    });

    this.signaling.on('signal', async (signal: { senderId: string; sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit; [key: string]: unknown }) => {
      const { senderId, ...rest } = signal;

      if (!senderId) {
        logger.warn('Received signal without senderId');
        return;
      }

      let connection = this.connections.get(senderId);

      if (!connection) {
        // Create new connection for incoming peer
        connection = new RTCPeer(senderId, this.signaling, false);
        this.setupPeerHandlers(connection);
        this.connections.set(senderId, connection);
      }

      await connection.handleSignal(rest as { sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit });
    });

    // Device pairing events
    this.signaling.on('pair-device-initiated', (data: { pairKey: string; roomSecret: string }) => {
      this.trigger('pair-device-initiated', data);
    });

    this.signaling.on('pair-device-joined', (data: { roomSecret: string; peerId: string }) => {
      this.trigger('pair-device-joined', data);
    });

    this.signaling.on('pair-device-join-key-invalid', () => {
      this.trigger('pair-device-join-key-invalid');
    });

    this.signaling.on('pair-device-canceled', (pairKey: string) => {
      this.trigger('pair-device-canceled', pairKey);
    });

    this.signaling.on('secret-room-deleted', (roomSecret: string) => {
      this.trigger('secret-room-deleted', roomSecret);
    });
  }

  private setupPeerHandlers(peer: RTCPeer): void {
    peer.on('connected', () => {
      this.trigger('peer-connected', peer.getPeerId());
    });

    peer.on('disconnected', () => {
      this.trigger('peer-disconnected', peer.getPeerId());
    });

    peer.on('transfer-request', (data: { files: FileMetadata[]; totalSize: number; peerId: string }) => {
      this.trigger('transfer-request', data);
    });

    peer.on('file-received', (data: { metadata: FileMetadata; data: ArrayBuffer }) => {
      this.trigger('file-received', data);
    });

    peer.on('transfer-complete', (data: { files: { metadata: FileMetadata; data: ArrayBuffer }[] }) => {
      this.trigger('transfer-complete', data);
    });

    peer.on('send-progress', (progress: object) => {
      this.trigger('send-progress', { peerId: peer.getPeerId(), ...progress });
    });

    peer.on('receive-progress', (progress: object) => {
      this.trigger('receive-progress', { peerId: peer.getPeerId(), ...progress });
    });

    peer.on('transfer-accepted', () => {
      this.trigger('transfer-accepted', peer.getPeerId());
    });

    peer.on('transfer-rejected', () => {
      this.trigger('transfer-rejected', peer.getPeerId());
    });

    peer.on('display-name-changed', (data: { peerId: string; displayName: string }) => {
      // Update peer info in our map
      const peerInfo = this.peers.get(data.peerId);
      if (peerInfo) {
        peerInfo.name.displayName = data.displayName;
        this.trigger('peers-updated', Array.from(this.peers.values()));
      }
      this.trigger('peer-display-name-changed', data);
    });
  }

  async connect(): Promise<void> {
    await this.signaling.connect();
  }

  getDisplayName(): string | null {
    return this.signaling.getDisplayName();
  }

  disconnect(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.signaling.disconnect();
  }

  isConnected(): boolean {
    return this.signaling.isConnected();
  }

  /**
   * Refresh the peer list by reconnecting to the server.
   * This clears stale peers and gets a fresh list.
   */
  async refresh(): Promise<void> {
    if (this.isConnected()) {
      this.signaling.disconnect();
    }
    await this.signaling.connect();
  }

  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  async sendFilesToPeer(peerId: string, files: TFile[], basePath?: string): Promise<void> {
    let connection = this.connections.get(peerId);

    // If existing connection is stale (channel closed), clean it up
    if (connection && !connection.isReady()) {
      logger.debug('Closing stale connection to', peerId);
      connection.close();
      this.connections.delete(peerId);
      connection = undefined;
    }

    if (!connection) {
      connection = new RTCPeer(peerId, this.signaling, true);
      this.setupPeerHandlers(connection);
      this.connections.set(peerId, connection);
      await connection.connect();
    }

    // Wait for channel to be ready
    if (!connection.isReady()) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 120000); // 2 minutes
        connection!.on('channel-open', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Read files from vault
    // Note: PairDrop web doesn't support folder structure, so we flatten files.
    // The 'path' field is kept for potential plugin-to-plugin transfers but
    // PairDrop web will ignore it and use only the filename.
    const fileData: { metadata: FileMetadata; data: ArrayBuffer }[] = [];
    for (const file of files) {
      const data = await this.vault.readBinary(file);

      // Calculate relative path from basePath (for plugin-to-plugin transfers)
      let relativePath = file.path;
      if (basePath && file.path.startsWith(basePath)) {
        relativePath = file.path.slice(basePath.length).replace(/^\//, '');
      }

      fileData.push({
        metadata: {
          name: file.name,
          path: relativePath,  // Kept for backwards compat, not used in PairDrop protocol
          size: data.byteLength,
          type: this.getMimeType(file.extension),
          lastModified: file.stat.mtime,
        },
        data,
      });
    }

    await connection.sendFiles(fileData);
  }

  async sendFolderToPeer(peerId: string, folder: TFolder): Promise<void> {
    const files = this.getFilesInFolder(folder);
    // Use parent path as base so folder name is included in relative paths
    const basePath = folder.parent?.path || '';
    await this.sendFilesToPeer(peerId, files, basePath);
  }

  private getFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile) {
        files.push(child);
      } else if (child instanceof TFolder) {
        files.push(...this.getFilesInFolder(child));
      }
    }
    return files;
  }

  async saveReceivedFile(metadata: FileMetadata, data: ArrayBuffer): Promise<TFile> {
    const saveFolder = this.settings.saveLocation;

    // Use path from metadata if available, otherwise just the filename
    const relativePath = metadata.path || metadata.name;
    let filePath = `${saveFolder}/${relativePath}`;

    // Ensure all parent folders exist
    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
    await this.ensureFolderExists(folderPath);

    // Generate unique filename if file already exists
    let counter = 1;
    let finalPath = filePath;
    while (this.vault.getAbstractFileByPath(finalPath)) {
      const ext = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '';
      const base = filePath.includes('.') ? filePath.slice(0, filePath.lastIndexOf('.')) : filePath;
      finalPath = `${base} (${counter})${ext}`;
      counter++;
    }

    // Save file
    const file = await this.vault.createBinary(finalPath, data);
    return file;
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath || this.vault.getAbstractFileByPath(folderPath)) {
      return;
    }

    // Create folders recursively
    const parts = folderPath.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!this.vault.getAbstractFileByPath(currentPath)) {
        try {
          await this.vault.createFolder(currentPath);
        } catch (e) {
          // Ignore "Folder already exists" errors (race condition with parallel file saves)
          if (!(e instanceof Error && e.message.includes('Folder already exists'))) {
            throw e;
          }
        }
      }
    }
  }

  acceptTransfer(peerId: string): void {
    const connection = this.connections.get(peerId);
    connection?.acceptTransfer();
  }

  rejectTransfer(peerId: string): void {
    const connection = this.connections.get(peerId);
    connection?.rejectTransfer();
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      md: 'text/markdown',
      txt: 'text/plain',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      webm: 'video/webm',
      zip: 'application/zip',
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  updateSettings(settings: P2PShareSettings): void {
    this.settings = settings;
    this.signaling.updateServerUrl(settings.serverUrl);
    this.signaling.updateDeviceName(settings.deviceName);
    this.signaling.setRoomSecrets(settings.pairedDevices.map((d) => d.roomSecret));
  }

  // ============================================================================
  // DEVICE PAIRING
  // ============================================================================

  pairDeviceInitiate(): void {
    this.signaling.pairDeviceInitiate();
  }

  pairDeviceJoin(pairKey: string): void {
    this.signaling.pairDeviceJoin(pairKey);
  }

  pairDeviceCancel(): void {
    this.signaling.pairDeviceCancel();
  }

  deleteRoomSecret(roomSecret: string): void {
    this.signaling.deleteRoomSecret(roomSecret);
  }
}
