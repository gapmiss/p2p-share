import { Events, TFile, TFolder, Vault } from 'obsidian';
import { SignalingClient } from './signaling';
import { RTCPeer } from './rtc-peer';
import type { PeerInfo, FileMetadata, PeerDropSettings } from './types';

export class PeerManager extends Events {
  private signaling: SignalingClient;
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, RTCPeer> = new Map();
  private vault: Vault;
  private settings: PeerDropSettings;

  constructor(vault: Vault, settings: PeerDropSettings) {
    super();
    this.vault = vault;
    this.settings = settings;
    this.signaling = new SignalingClient(settings.serverUrl, settings.deviceName);
    this.setupSignalingHandlers();
  }

  private setupSignalingHandlers(): void {
    this.signaling.on('connected', () => {
      this.trigger('server-connected');
    });

    this.signaling.on('disconnected', () => {
      this.trigger('server-disconnected');
    });

    this.signaling.on('peers', (peers: PeerInfo[]) => {
      this.peers.clear();
      for (const peer of peers) {
        this.peers.set(peer.id, peer);
      }
      this.trigger('peers-updated', Array.from(this.peers.values()));
    });

    this.signaling.on('peer-joined', (peer: PeerInfo) => {
      this.peers.set(peer.id, peer);
      this.trigger('peer-joined', peer);
      this.trigger('peers-updated', Array.from(this.peers.values()));
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

    this.signaling.on('signal', async (signal: { senderId: string; type: string; [key: string]: unknown }) => {
      const { senderId, ...rest } = signal;
      let connection = this.connections.get(senderId);

      if (!connection) {
        // Create new connection for incoming peer
        connection = new RTCPeer(senderId, this.signaling, false);
        this.setupPeerHandlers(connection);
        this.connections.set(senderId, connection);
      }

      await connection.handleSignal(rest as { type: string; sdp?: string; candidate?: RTCIceCandidateInit });
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
  }

  async connect(): Promise<void> {
    await this.signaling.connect();
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

  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  async sendFilesToPeer(peerId: string, files: TFile[]): Promise<void> {
    let connection = this.connections.get(peerId);

    if (!connection) {
      connection = new RTCPeer(peerId, this.signaling, true);
      this.setupPeerHandlers(connection);
      this.connections.set(peerId, connection);
      await connection.connect();
    }

    // Wait for channel to be ready
    if (!connection.isReady()) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
        connection!.on('channel-open', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Read files from vault
    const fileData: { metadata: FileMetadata; data: ArrayBuffer }[] = [];
    for (const file of files) {
      const data = await this.vault.readBinary(file);
      fileData.push({
        metadata: {
          name: file.name,
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
    await this.sendFilesToPeer(peerId, files);
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

    // Ensure folder exists
    const folderExists = this.vault.getAbstractFileByPath(saveFolder);
    if (!folderExists) {
      await this.vault.createFolder(saveFolder);
    }

    // Generate unique filename if needed
    let fileName = metadata.name;
    let filePath = `${saveFolder}/${fileName}`;
    let counter = 1;

    while (this.vault.getAbstractFileByPath(filePath)) {
      const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
      const base = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
      fileName = `${base} (${counter})${ext}`;
      filePath = `${saveFolder}/${fileName}`;
      counter++;
    }

    // Save file
    const file = await this.vault.createBinary(filePath, data);
    return file;
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

  updateSettings(settings: PeerDropSettings): void {
    this.settings = settings;
    this.signaling.updateServerUrl(settings.serverUrl);
    this.signaling.updateDeviceName(settings.deviceName);
  }
}
