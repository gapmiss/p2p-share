// P2P Share Types

import type { LogLevel } from './logger';

/**
 * A paired device that can be discovered across networks.
 */
export interface PairedDevice {
  /** The room secret used to connect to this device */
  roomSecret: string;
  /** Display name of the paired device */
  displayName: string;
  /** When the pairing was created */
  pairedAt: number;
  /** Whether to automatically accept transfers from this device */
  autoAccept: boolean;
}

export interface P2PShareSettings {
  serverUrl: string;
  saveLocation: string;
  discoveryMode: 'auto' | 'paired-only';
  /** Room secrets for paired devices (enables cross-network discovery) */
  pairedDevices: PairedDevice[];
  /** Log level for console output */
  logLevel: LogLevel;
  /** Whether to automatically connect on plugin load */
  autoConnect: boolean;
  /** Whether to show system notifications for incoming transfers */
  useSystemNotifications: boolean;
  /** Share history settings */
  history: ShareHistorySettings;
}

export const DEFAULT_SETTINGS: P2PShareSettings = {
  serverUrl: 'wss://pairdrop.net',
  saveLocation: 'P2P Share',
  discoveryMode: 'auto',
  pairedDevices: [],
  logLevel: 'error',
  autoConnect: true,
  useSystemNotifications: false,
  history: {
    enabled: true,
    retentionDays: 30,
  },
};

export interface PeerInfo {
  id: string;
  name: {
    displayName?: string;
    deviceName?: string;
    model?: string;
    os?: string;
    browser?: string;
    type?: string;  // undefined for desktop browsers
  };
  rtcSupported: boolean;
}

export interface FileMetadata {
  name: string;
  path?: string;  // Relative path including folders (e.g., "folder/subfolder/file.md")
  size: number;
  type: string;
  lastModified?: number;
}

export interface TransferHeader {
  type: 'header';
  files: FileMetadata[];
  totalSize: number;
  fileCount: number;
}

export interface TransferProgress {
  peerId: string;
  fileName: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  direction: 'send' | 'receive';
}

export interface SignalingMessage {
  type: string;
  sender?: string;
  recipient?: string;
  [key: string]: unknown;
}

export interface RTCMessage {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export type TransferState = 'idle' | 'connecting' | 'transferring' | 'completed' | 'error';

// ============================================================================
// PairDrop Protocol Messages
// These types implement the PairDrop file transfer protocol for compatibility
// with PairDrop web/mobile apps.
// ============================================================================

/**
 * File header metadata in PairDrop format.
 * Used in request messages to describe files to be transferred.
 */
export interface PairDropFileInfo {
  name: string;
  mime: string;
  size: number;
  path?: string; // Extension for plugin-to-plugin folder structure (ignored by PairDrop web)
}

/**
 * Initial transfer request sent by the sender.
 * Contains metadata about all files to be transferred.
 */
export interface PairDropRequest {
  type: 'request';
  header: PairDropFileInfo[];
  totalSize: number;
  imagesOnly: boolean;
  thumbnailDataUrl?: string;
}

/**
 * Header sent before each file's binary data.
 */
export interface PairDropFileHeader {
  type: 'header';
  name: string;
  mime: string;
  size: number;
  path?: string; // Extension for plugin-to-plugin folder structure (ignored by PairDrop web)
}

/**
 * Sent after each 1MB partition of data.
 * Triggers flow control - sender waits for partition-received before continuing.
 */
export interface PairDropPartition {
  type: 'partition';
  offset: number;
}

/**
 * Acknowledgment sent by receiver after receiving a partition.
 */
export interface PairDropPartitionReceived {
  type: 'partition-received';
  offset: number;
}

/**
 * Response to a transfer request.
 */
export interface PairDropTransferResponse {
  type: 'files-transfer-response';
  accepted: boolean;
  reason?: string;  // e.g., 'ios-memory-limit'
}

/**
 * Progress update sent by receiver during transfer.
 */
export interface PairDropProgress {
  type: 'progress';
  progress: number;  // 0-1
}

/**
 * Sent by receiver when a file has been fully received.
 */
export interface PairDropFileTransferComplete {
  type: 'file-transfer-complete';
}

/**
 * Sent by sender when they cancel the transfer.
 */
export interface PairDropTransferCanceled {
  type: 'transfer-canceled';
}

/**
 * Text message (for future text sharing feature).
 */
export interface PairDropTextMessage {
  type: 'text';
  text: string;
}

/**
 * Display name change notification sent to peers.
 */
export interface PairDropDisplayNameChanged {
  type: 'display-name-changed';
  displayName: string;
}

/**
 * Request peer's display name (plugin extension).
 */
export interface PairDropDisplayNameRequest {
  type: 'display-name-request';
}

/**
 * Union type of all PairDrop data channel messages.
 */
export type PairDropMessage =
  | PairDropRequest
  | PairDropFileHeader
  | PairDropPartition
  | PairDropPartitionReceived
  | PairDropTransferResponse
  | PairDropProgress
  | PairDropFileTransferComplete
  | PairDropTextMessage
  | PairDropDisplayNameChanged
  | PairDropDisplayNameRequest;

// ============================================================================
// Share History
// Types for tracking and displaying transfer history
// ============================================================================

/**
 * Represents a single file in a transfer history entry
 */
export interface ShareHistoryFile {
  name: string;
  size: number;
  path?: string; // Vault path for received files
}

/**
 * Status of a transfer
 */
export type ShareHistoryStatus = 'completed' | 'failed' | 'cancelled';

/**
 * Direction of a transfer
 */
export type ShareHistoryDirection = 'sent' | 'received';

/**
 * A single entry in the share history
 */
export interface ShareHistoryEntry {
  /** Unique identifier for this entry */
  id: string;
  /** When the transfer occurred (Unix timestamp in ms) */
  timestamp: number;
  /** Direction of the transfer */
  direction: ShareHistoryDirection;
  /** Peer display name at time of transfer */
  peerName: string;
  /** Peer OS (e.g., "Mac OS", "Windows", "Android") */
  peerOs?: string;
  /** Peer app/browser (e.g., "Safari", "Chrome", "Firefox") */
  peerApp?: string;
  /** Peer device type (e.g., "mobile", "tablet", "desktop") */
  peerDeviceType?: string;
  /** Whether this was a paired device */
  isPaired: boolean;
  /** List of files transferred */
  files: ShareHistoryFile[];
  /** Total size of all files in bytes */
  totalSize: number;
  /** Status of the transfer */
  status: ShareHistoryStatus;
  /** Error message if failed */
  error?: string;
  /** Transfer duration in milliseconds */
  duration?: number;
}

/**
 * Settings for share history feature
 */
export interface ShareHistorySettings {
  /** Whether to track transfer history */
  enabled: boolean;
  /** How long to keep history entries (in days, 0 = forever) */
  retentionDays: number;
}
