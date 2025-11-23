import { Events } from 'obsidian';
import type { SignalingClient } from './signaling';
import type { FileMetadata, TransferHeader } from './types';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB buffer threshold

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class RTCPeer extends Events {
  private peerId: string;
  private signaling: SignalingClient;
  private connection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isInitiator: boolean;

  // Transfer state
  private sendQueue: { data: ArrayBuffer; metadata: FileMetadata }[] = [];
  private receiveBuffer: ArrayBuffer[] = [];
  private currentReceiveMetadata: FileMetadata | null = null;
  private receivedFiles: { metadata: FileMetadata; data: ArrayBuffer }[] = [];
  private expectedFiles: FileMetadata[] = [];
  private totalExpectedSize = 0;
  private totalReceivedSize = 0;

  constructor(peerId: string, signaling: SignalingClient, isInitiator: boolean) {
    super();
    this.peerId = peerId;
    this.signaling = signaling;
    this.isInitiator = isInitiator;
  }

  async connect(): Promise<void> {
    this.connection = new RTCPeerConnection(RTC_CONFIG);

    this.connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendSignal(this.peerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    this.connection.oniceconnectionstatechange = () => {
      const state = this.connection?.iceConnectionState;
      console.log(`PeerDrop: ICE connection state: ${state}`);

      if (state === 'connected') {
        this.trigger('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        this.trigger('disconnected');
      }
    };

    this.connection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    if (this.isInitiator) {
      this.dataChannel = this.connection.createDataChannel('fileTransfer', {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);

      const offer = await this.connection.createOffer();
      await this.connection.setLocalDescription(offer);

      this.signaling.sendSignal(this.peerId, {
        type: 'offer',
        sdp: offer.sdp,
      });
    }
  }

  async handleSignal(signal: { type: string; sdp?: string; candidate?: RTCIceCandidateInit }): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }

    switch (signal.type) {
      case 'offer':
        await this.connection!.setRemoteDescription({
          type: 'offer',
          sdp: signal.sdp,
        });
        const answer = await this.connection!.createAnswer();
        await this.connection!.setLocalDescription(answer);
        this.signaling.sendSignal(this.peerId, {
          type: 'answer',
          sdp: answer.sdp,
        });
        break;

      case 'answer':
        await this.connection!.setRemoteDescription({
          type: 'answer',
          sdp: signal.sdp,
        });
        break;

      case 'candidate':
        if (signal.candidate) {
          await this.connection!.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
        break;
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log('PeerDrop: Data channel open');
      this.trigger('channel-open');
      this.processQueue();
    };

    channel.onclose = () => {
      console.log('PeerDrop: Data channel closed');
      this.trigger('channel-closed');
    };

    channel.onerror = (error) => {
      console.error('PeerDrop: Data channel error', error);
      this.trigger('error', error);
    };

    channel.onmessage = (event) => {
      this.handleIncomingData(event.data);
    };
  }

  async sendFiles(files: { metadata: FileMetadata; data: ArrayBuffer }[]): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    // Send header first
    const header: TransferHeader = {
      type: 'header',
      files: files.map((f) => f.metadata),
      totalSize: files.reduce((sum, f) => sum + f.data.byteLength, 0),
      fileCount: files.length,
    };

    this.sendJSON(header);

    // Send each file
    for (const file of files) {
      await this.sendFile(file.metadata, file.data);
    }

    // Send completion message
    this.sendJSON({ type: 'transfer-complete' });
  }

  private async sendFile(metadata: FileMetadata, data: ArrayBuffer): Promise<void> {
    // Send file start marker
    this.sendJSON({ type: 'file-start', metadata });

    // Send chunks
    let offset = 0;
    while (offset < data.byteLength) {
      // Wait if buffer is full
      while (
        this.dataChannel &&
        this.dataChannel.bufferedAmount > MAX_BUFFER_SIZE
      ) {
        await this.waitForBufferDrain();
      }

      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      this.dataChannel?.send(chunk);
      offset += chunk.byteLength;

      // Report progress
      this.trigger('send-progress', {
        fileName: metadata.name,
        progress: offset / data.byteLength,
        bytesTransferred: offset,
        totalBytes: data.byteLength,
      });
    }

    // Send file end marker
    this.sendJSON({ type: 'file-end', name: metadata.name });
  }

  private waitForBufferDrain(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (
          !this.dataChannel ||
          this.dataChannel.bufferedAmount <= MAX_BUFFER_SIZE / 2
        ) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  private sendJSON(data: object): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  private handleIncomingData(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      this.handleControlMessage(JSON.parse(data));
    } else {
      this.handleChunk(data);
    }
  }

  private handleControlMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {
      case 'header':
        this.expectedFiles = (message as TransferHeader).files;
        this.totalExpectedSize = (message as TransferHeader).totalSize;
        this.totalReceivedSize = 0;
        this.receivedFiles = [];
        this.trigger('transfer-request', {
          files: this.expectedFiles,
          totalSize: this.totalExpectedSize,
          peerId: this.peerId,
        });
        break;

      case 'file-start':
        this.currentReceiveMetadata = message.metadata as FileMetadata;
        this.receiveBuffer = [];
        break;

      case 'file-end':
        if (this.currentReceiveMetadata) {
          const fileData = this.concatenateBuffers(this.receiveBuffer);
          this.receivedFiles.push({
            metadata: this.currentReceiveMetadata,
            data: fileData,
          });
          this.trigger('file-received', {
            metadata: this.currentReceiveMetadata,
            data: fileData,
          });
          this.currentReceiveMetadata = null;
          this.receiveBuffer = [];
        }
        break;

      case 'transfer-complete':
        this.trigger('transfer-complete', {
          files: this.receivedFiles,
          totalSize: this.totalReceivedSize,
        });
        break;

      case 'transfer-accepted':
        this.trigger('transfer-accepted');
        break;

      case 'transfer-rejected':
        this.trigger('transfer-rejected');
        break;
    }
  }

  private handleChunk(chunk: ArrayBuffer): void {
    this.receiveBuffer.push(chunk);
    this.totalReceivedSize += chunk.byteLength;

    if (this.currentReceiveMetadata) {
      const currentFileSize = this.receiveBuffer.reduce(
        (sum, buf) => sum + buf.byteLength,
        0
      );
      this.trigger('receive-progress', {
        fileName: this.currentReceiveMetadata.name,
        progress: currentFileSize / this.currentReceiveMetadata.size,
        bytesTransferred: currentFileSize,
        totalBytes: this.currentReceiveMetadata.size,
        totalTransferProgress: this.totalReceivedSize / this.totalExpectedSize,
      });
    }
  }

  private concatenateBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    return result.buffer;
  }

  acceptTransfer(): void {
    this.sendJSON({ type: 'transfer-accepted' });
  }

  rejectTransfer(): void {
    this.sendJSON({ type: 'transfer-rejected' });
  }

  private processQueue(): void {
    // Process any queued sends
  }

  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  getPeerId(): string {
    return this.peerId;
  }

  isReady(): boolean {
    return this.dataChannel?.readyState === 'open';
  }
}
