import { Events } from 'obsidian';
import type { SignalingClient } from './signaling';
import { logger } from './logger';
import type {
  FileMetadata,
  PairDropRequest,
  PairDropFileHeader,
  PairDropTransferResponse,
  PairDropPartition,
  PairDropPartitionReceived,
  PairDropProgress,
  PairDropFileTransferComplete,
  PairDropFileInfo,
  PairDropTransferCanceled,
} from './types';

const CHUNK_SIZE = 64000; // 64KB chunks (PairDrop uses 64000, not 64*1024)
const PARTITION_SIZE = 1000000; // 1MB partitions (PairDrop uses 1e6)
const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB buffer threshold

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * Handles sending a file in partitions with flow control.
 * Mirrors PairDrop's FileChunker behavior.
 */
class FileChunker {
  private data: ArrayBuffer;
  private offset = 0;
  private partitionSize = 0;
  private onChunk: (chunk: ArrayBuffer) => void;
  private onPartitionEnd: (offset: number) => void;

  constructor(
    data: ArrayBuffer,
    onChunk: (chunk: ArrayBuffer) => void,
    onPartitionEnd: (offset: number) => void
  ) {
    this.data = data;
    this.onChunk = onChunk;
    this.onPartitionEnd = onPartitionEnd;
  }

  nextPartition(): void {
    this.partitionSize = 0;
    this.readChunks();
  }

  private readChunks(): void {
    while (this.offset < this.data.byteLength) {
      const chunk = this.data.slice(this.offset, this.offset + CHUNK_SIZE);
      this.offset += chunk.byteLength;
      this.partitionSize += chunk.byteLength;
      this.onChunk(chunk);

      if (this.isFileEnd()) {
        logger.debug(`File chunking complete: ${this.offset}/${this.data.byteLength} bytes`);
        return;
      }
      if (this.partitionSize >= PARTITION_SIZE) {
        logger.debug(`Partition complete: offset=${this.offset}, size=${this.partitionSize}`);
        this.onPartitionEnd(this.offset);
        return;
      }
    }
  }

  isFileEnd(): boolean {
    return this.offset >= this.data.byteLength;
  }
}

/**
 * Handles receiving file chunks and assembling them.
 * Mirrors PairDrop's FileDigester behavior.
 */
class FileDigester {
  private buffer: ArrayBuffer[] = [];
  private bytesReceived = 0;
  private size: number;
  private name: string;
  private mime: string;
  private totalSize: number;
  private totalBytesReceived: number;
  private callback: (data: ArrayBuffer, name: string, mime: string) => void;
  progress = 0;

  constructor(
    meta: { size: number; name: string; mime: string },
    totalSize: number,
    totalBytesReceived: number,
    callback: (data: ArrayBuffer, name: string, mime: string) => void
  ) {
    this.size = meta.size;
    this.name = meta.name;
    this.mime = meta.mime;
    this.totalSize = totalSize;
    this.totalBytesReceived = totalBytesReceived;
    this.callback = callback;
  }

  unchunk(chunk: ArrayBuffer): void {
    this.buffer.push(chunk);
    this.bytesReceived += chunk.byteLength;
    this.progress = (this.totalBytesReceived + this.bytesReceived) / this.totalSize;
    if (isNaN(this.progress)) this.progress = 1;

    logger.debug(`Received chunk for ${this.name}: ${this.bytesReceived}/${this.size} bytes (${(this.getFileProgress() * 100).toFixed(1)}%)`);

    if (this.bytesReceived < this.size) return;

    logger.debug(`File receive complete: ${this.name} (${this.bytesReceived} bytes)`);

    // File complete - assemble buffer
    const totalLength = this.buffer.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of this.buffer) {
      result.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }
    this.callback(result.buffer, this.name, this.mime);
  }

  getName(): string {
    return this.name;
  }

  /** Progress for this individual file (0-1) */
  getFileProgress(): number {
    return this.bytesReceived / this.size;
  }
}

export class RTCPeer extends Events {
  private peerId: string;
  private signaling: SignalingClient;
  private connection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isInitiator: boolean;
  private roomType: string | null = null;
  private roomId: string | null = null;

  // Sender state
  private filesRequested: { metadata: FileMetadata; data: ArrayBuffer }[] | null = null;
  private filesQueue: { metadata: FileMetadata; data: ArrayBuffer }[] = [];
  private chunker: FileChunker | null = null;
  private busy = false;
  private transferResponseResolve: ((accepted: boolean) => void) | null = null;
  private currentSendFile: { metadata: FileMetadata; data: ArrayBuffer } | null = null;
  private sendBytesSent = 0;

  // Receiver state
  private requestPending: PairDropRequest | null = null;
  private requestAccepted: PairDropRequest | null = null;
  private digester: FileDigester | null = null;
  private totalBytesReceived = 0;
  private filesReceived: { metadata: FileMetadata; data: ArrayBuffer }[] = [];
  private lastProgress = 0;

  constructor(peerId: string, signaling: SignalingClient, isInitiator: boolean, roomType?: string, roomId?: string) {
    super();
    this.peerId = peerId;
    this.signaling = signaling;
    this.isInitiator = isInitiator;
    this.roomType = roomType || null;
    this.roomId = roomId || null;
  }

  async connect(): Promise<void> {
    try {
      this.connection = new RTCPeerConnection(RTC_CONFIG);

      this.connection.onicecandidate = (event) => {
        if (event.candidate) {
          this.signaling.sendSignal(this.peerId, {
            ice: event.candidate.toJSON(),
          }, this.roomType || undefined, this.roomId || undefined);
        }
      };

      this.connection.oniceconnectionstatechange = () => {
        const state = this.connection?.iceConnectionState;
        logger.debug(`ICE connection state: ${state}`);

        if (state === 'connected') {
          this.trigger('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          this.trigger('disconnected');
        }
      };

      this.connection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };

      // Add error handler for RTCPeerConnection
      this.connection.onicecandidateerror = (event) => {
        logger.error('ICE candidate error:', event);
      };

      if (this.isInitiator) {
        this.dataChannel = this.connection.createDataChannel('data-channel', {
          ordered: true,
        });
        this.setupDataChannel(this.dataChannel);

        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);

        this.signaling.sendSignal(this.peerId, {
          sdp: offer,
        }, this.roomType || undefined, this.roomId || undefined);
      }
    } catch (error) {
      logger.error('WebRTC connection failed:', error);
      this.trigger('error', error);
      throw error;
    }
  }

  async handleSignal(signal: { sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit }): Promise<void> {
    try {
      logger.debug('Handling signal', signal);

      if (!this.connection) {
        await this.connect();
      }

      if (signal.sdp) {
        await this.connection!.setRemoteDescription(signal.sdp);

        if (signal.sdp.type === 'offer') {
          const answer = await this.connection!.createAnswer();
          await this.connection!.setLocalDescription(answer);
          this.signaling.sendSignal(this.peerId, {
            sdp: answer,
          }, this.roomType || undefined, this.roomId || undefined);
        }
      }

      if (signal.ice) {
        await this.connection!.addIceCandidate(new RTCIceCandidate(signal.ice));
      }
    } catch (error) {
      logger.error('WebRTC signal handling failed:', error);
      this.trigger('error', error);
      throw error;
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      logger.debug('Data channel open');
      this.trigger('channel-open');
    };

    channel.onclose = () => {
      logger.debug('Data channel closed');
      this.trigger('channel-closed');
    };

    channel.onerror = (error) => {
      // Ignore expected errors from user-initiated connection closures
      const rtcError = error as RTCErrorEvent;
      if (rtcError.error?.message?.includes('User-Initiated Abort')) {
        logger.debug('Data channel closed by user');
        return;
      }
      logger.error('Data channel error', error);
      this.trigger('error', error);
    };

    channel.onmessage = (event) => {
      this.handleIncomingData(event.data);
    };
  }

  // ============================================================================
  // SENDER LOGIC - PairDrop Protocol
  // ============================================================================

  /**
   * Send files using PairDrop protocol.
   * Flow: request -> wait for response -> send files with partitions
   */
  async sendFiles(files: { metadata: FileMetadata; data: ArrayBuffer }[]): Promise<void> {
    try {
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready');
      }

      // Build request with file headers
      const header: PairDropFileInfo[] = files.map((f) => ({
        name: f.metadata.name,
        mime: f.metadata.type,
        size: f.data.byteLength,
        path: f.metadata.path, // Include path for plugin-to-plugin folder structure
      }));

      const totalSize = files.reduce((sum, f) => sum + f.data.byteLength, 0);
      const imagesOnly = files.every((f) => f.metadata.type.startsWith('image/'));

      // Store files for later sending
      this.filesRequested = files;

      // Send request
      const request: PairDropRequest = {
        type: 'request',
        header,
        totalSize,
        imagesOnly,
      };
      this.sendJSON(request);

      logger.debug('Sent transfer request, waiting for response...');

      // Wait for response
      const accepted = await new Promise<boolean>((resolve) => {
        this.transferResponseResolve = resolve;

        // Timeout after 60 seconds
        setTimeout(() => {
          if (this.transferResponseResolve) {
            this.transferResponseResolve(false);
            this.transferResponseResolve = null;
          }
        }, 60000);
      });

      if (!accepted) {
        this.filesRequested = null;
        throw new Error('Transfer rejected by peer');
      }

      logger.debug('Transfer accepted, sending files...');
      this.trigger('transfer-accepted');

      // Queue files and start sending
      this.filesQueue = [...this.filesRequested];
      this.filesRequested = null;
      this.dequeueFile();
    } catch (error) {
      logger.error('File transfer initiation failed:', error);
      this.filesRequested = null;
      this.trigger('error', error);
      throw error;
    }
  }

  private dequeueFile(): void {
    if (this.filesQueue.length === 0) {
      this.busy = false;
      this.trigger('transfer-complete', { files: [] });
      return;
    }

    this.busy = true;
    const file = this.filesQueue.shift()!;
    this.sendFile(file);
  }

  private async sendFile(file: { metadata: FileMetadata; data: ArrayBuffer }): Promise<void> {
    // Track current file for progress reporting
    this.currentSendFile = file;
    this.sendBytesSent = 0;

    logger.debug(`Sending file: ${file.metadata.name} (${file.data.byteLength} bytes, type: ${file.metadata.type})`);

    // Send header for this file
    const header: PairDropFileHeader = {
      type: 'header',
      name: file.metadata.name,
      mime: file.metadata.type,
      size: file.data.byteLength,
      path: file.metadata.path, // Include path for plugin-to-plugin folder structure
    };
    this.sendJSON(header);

    // Create chunker and start sending
    this.chunker = new FileChunker(
      file.data,
      (chunk) => this.sendChunk(chunk),
      (offset) => this.onPartitionEnd(offset)
    );
    this.chunker.nextPartition();
  }

  private async sendChunk(chunk: ArrayBuffer): Promise<void> {
    // Wait if buffer is full
    while (this.dataChannel && this.dataChannel.bufferedAmount > MAX_BUFFER_SIZE) {
      await this.waitForBufferDrain();
    }
    this.dataChannel?.send(chunk);

    // Track progress
    this.sendBytesSent += chunk.byteLength;
    if (this.currentSendFile) {
      const progress = this.sendBytesSent / this.currentSendFile.data.byteLength;
      this.trigger('send-progress', {
        fileName: this.currentSendFile.metadata.name,
        progress,
        bytesTransferred: this.sendBytesSent,
        totalBytes: this.currentSendFile.data.byteLength,
      });
    }
  }

  private onPartitionEnd(offset: number): void {
    const partition: PairDropPartition = { type: 'partition', offset };
    this.sendJSON(partition);
    // Wait for partition-received before continuing (handled in message handler)
  }

  private sendNextPartition(): void {
    if (!this.chunker) {
      logger.warn('sendNextPartition called but no chunker exists');
      return;
    }
    if (this.chunker.isFileEnd()) {
      logger.debug('File send complete, no more partitions to send');
      return;
    }
    logger.debug('Sending next partition');
    this.chunker.nextPartition();
  }

  private waitForBufferDrain(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.dataChannel || this.dataChannel.bufferedAmount <= MAX_BUFFER_SIZE / 2) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  // ============================================================================
  // RECEIVER LOGIC - PairDrop Protocol
  // ============================================================================

  /**
   * Accept the pending transfer request.
   */
  acceptTransfer(): void {
    if (!this.requestPending) return;

    const response: PairDropTransferResponse = {
      type: 'files-transfer-response',
      accepted: true,
    };
    this.sendJSON(response);

    this.requestAccepted = this.requestPending;
    this.totalBytesReceived = 0;
    this.busy = true;
    this.filesReceived = [];
    this.requestPending = null;
  }

  /**
   * Reject the pending transfer request.
   */
  rejectTransfer(reason?: string): void {
    const response: PairDropTransferResponse = {
      type: 'files-transfer-response',
      accepted: false,
      reason,
    };
    this.sendJSON(response);
    this.requestPending = null;
    this.trigger('transfer-rejected');
  }

  /**
   * Cancel an outgoing transfer (sender-side cancellation).
   */
  cancelTransfer(): void {
    // Clear any pending transfer
    this.filesRequested = null;
    this.filesQueue = [];
    this.chunker = null;
    this.busy = false;

    // Notify the receiver
    const cancelMessage: PairDropTransferCanceled = {
      type: 'transfer-canceled',
    };
    this.sendJSON(cancelMessage);
  }

  private onFileReceived(data: ArrayBuffer, name: string, mime: string): void {
    logger.debug(`onFileReceived called for ${name} (${data.byteLength} bytes)`);

    if (!this.requestAccepted) {
      logger.warn('onFileReceived but no requestAccepted');
      return;
    }

    const acceptedHeader = this.requestAccepted.header.shift();
    if (!acceptedHeader) {
      logger.warn('onFileReceived but no acceptedHeader in queue');
      return;
    }

    this.totalBytesReceived += data.byteLength;

    logger.debug(`Sending file-transfer-complete for ${name}`);
    // Send file-transfer-complete to sender
    const complete: PairDropFileTransferComplete = { type: 'file-transfer-complete' };
    this.sendJSON(complete);

    // Build metadata from accepted header
    const metadata: FileMetadata = {
      name: acceptedHeader.name,
      size: acceptedHeader.size,
      type: acceptedHeader.mime,
      path: acceptedHeader.path, // Preserve path for plugin-to-plugin folder structure
    };

    this.trigger('file-received', { metadata, data });
    this.filesReceived.push({ metadata, data });

    // Check if all files received
    if (this.requestAccepted.header.length === 0) {
      this.busy = false;
      this.trigger('transfer-complete', {
        files: this.filesReceived,
        totalSize: this.requestAccepted.totalSize,
      });
      this.filesReceived = [];
      this.requestAccepted = null;
    }
  }

  private sendProgress(progress: number): void {
    const msg: PairDropProgress = { type: 'progress', progress };
    this.sendJSON(msg);
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

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
      // === Receiver handling (messages from sender) ===
      case 'request':
        this.handleRequest(message as unknown as PairDropRequest);
        break;

      case 'header':
        this.handleFileHeader(message as unknown as PairDropFileHeader);
        break;

      case 'partition':
        this.handlePartition(message as unknown as PairDropPartition);
        break;

      // === Sender handling (messages from receiver) ===
      case 'files-transfer-response':
        this.handleTransferResponse(message as unknown as PairDropTransferResponse);
        break;

      case 'partition-received':
        this.sendNextPartition();
        break;

      case 'progress':
        this.handleProgress(message as unknown as PairDropProgress);
        break;

      case 'file-transfer-complete':
        this.handleFileTransferComplete();
        break;

      case 'transfer-canceled':
        this.handleTransferCanceled();
        break;

      // === Legacy protocol support (plugin-to-plugin) ===
      case 'transfer-accepted':
        // Legacy: map to new protocol
        if (this.transferResponseResolve) {
          this.transferResponseResolve(true);
          this.transferResponseResolve = null;
        }
        break;

      case 'transfer-rejected':
        // Legacy: map to new protocol
        if (this.transferResponseResolve) {
          this.transferResponseResolve(false);
          this.transferResponseResolve = null;
        }
        this.trigger('transfer-rejected');
        break;

      case 'display-name-changed':
        this.handleDisplayNameChanged(message.displayName as string);
        break;

      default:
        logger.warn('Unknown message type', message.type);
    }
  }

  private handleRequest(request: PairDropRequest): void {
    if (this.requestPending) {
      // Only accept one request at a time
      this.rejectTransfer();
      return;
    }

    this.requestPending = request;

    // Convert to FileMetadata format for UI
    const files: FileMetadata[] = request.header.map((h) => ({
      name: h.name,
      size: h.size,
      type: h.mime,
      path: h.path, // Preserve path for plugin-to-plugin folder structure
    }));

    this.trigger('transfer-request', {
      files,
      totalSize: request.totalSize,
      peerId: this.peerId,
      thumbnailDataUrl: request.thumbnailDataUrl,
    });
  }

  private handleFileHeader(header: PairDropFileHeader): void {
    if (!this.requestAccepted || !this.requestAccepted.header.length) return;

    this.lastProgress = 0;
    this.digester = new FileDigester(
      { size: header.size, name: header.name, mime: header.mime },
      this.requestAccepted.totalSize,
      this.totalBytesReceived,
      (data, name, mime) => this.onFileReceived(data, name, mime)
    );
  }

  private handlePartition(partition: PairDropPartition): void {
    logger.debug(`Received partition at offset ${partition.offset}, sending ack`);
    // Acknowledge partition received
    const ack: PairDropPartitionReceived = {
      type: 'partition-received',
      offset: partition.offset,
    };
    this.sendJSON(ack);
  }

  private handleTransferResponse(response: PairDropTransferResponse): void {
    if (this.transferResponseResolve) {
      this.transferResponseResolve(response.accepted);
      this.transferResponseResolve = null;
    }

    if (!response.accepted) {
      this.filesRequested = null;
      if (response.reason === 'ios-memory-limit') {
        this.trigger('transfer-rejected', { reason: 'iOS memory limit exceeded' });
      } else {
        this.trigger('transfer-rejected');
      }
    }
  }

  private handleProgress(progress: PairDropProgress): void {
    // Receiver's progress report - update sender's UI
    this.trigger('receive-progress-from-peer', { progress: progress.progress });
  }

  private handleFileTransferComplete(): void {
    logger.debug('Received file-transfer-complete from receiver');
    // Receiver confirmed file received - move to next file
    this.chunker = null;
    if (this.filesQueue.length === 0) {
      logger.debug('All files sent, transfer complete');
      this.busy = false;
      this.trigger('transfer-complete', { files: [] });
    } else {
      logger.debug(`${this.filesQueue.length} files remaining in queue`);
      this.dequeueFile();
    }
  }

  private handleTransferCanceled(): void {
    logger.debug('Transfer canceled by sender');

    // Clear any pending or in-progress transfer state
    this.requestPending = null;
    this.requestAccepted = null;
    this.digester = null;
    this.filesReceived = [];
    this.totalBytesReceived = 0;
    this.busy = false;

    // Notify the application layer
    this.trigger('transfer-canceled');
  }

  private handleChunk(chunk: ArrayBuffer): void {
    if (!this.digester || chunk.byteLength === 0) return;

    this.digester.unchunk(chunk);
    const overallProgress = this.digester.progress;
    const fileProgress = this.digester.getFileProgress();

    // Emit progress for UI (per-file progress for modal to aggregate)
    this.trigger('receive-progress', {
      fileName: this.digester.getName(),
      progress: fileProgress,
      bytesTransferred: this.totalBytesReceived + chunk.byteLength,
      totalBytes: this.requestAccepted?.totalSize || 0,
    });

    // Send overall progress to sender occasionally
    if (overallProgress - this.lastProgress >= 0.005 || overallProgress === 1) {
      this.lastProgress = overallProgress;
      this.sendProgress(overallProgress);
    }
  }

  private handleDisplayNameChanged(newDisplayName: string): void {
    // Sanitize and validate
    const trimmed = newDisplayName?.trim() || '';

    // Reject empty/invalid names
    if (!trimmed || trimmed.length === 0) {
      logger.warn('Rejected empty display name change');
      return;
    }

    // Length limits
    const maxLength = 50;
    const sanitized = trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;

    // Basic XSS prevention (strip HTML tags)
    const cleaned = sanitized.replace(/<[^>]*>/g, '');

    logger.debug('Peer changed display name to', cleaned);
    this.trigger('display-name-changed', cleaned);
  }

  sendDisplayNameChange(displayName: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      logger.warn('Cannot send display name change, channel not open');
      return;
    }

    const message = {
      type: 'display-name-changed',
      displayName,
    };

    logger.debug('Sending display name change to peer', this.peerId, displayName);
    this.dataChannel.send(JSON.stringify(message));
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

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
