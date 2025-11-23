// PeerDrop Types

export interface PeerDropSettings {
  serverUrl: string;
  saveLocation: string;
  discoveryMode: 'auto' | 'paired-only';
  deviceName: string;
  autoAcceptFromPaired: boolean;
  showNotifications: boolean;
}

export const DEFAULT_SETTINGS: PeerDropSettings = {
  serverUrl: 'wss://pairdrop.net',
  saveLocation: 'PeerDrop',
  discoveryMode: 'auto',
  deviceName: '',
  autoAcceptFromPaired: false,
  showNotifications: true,
};

export interface PeerInfo {
  id: string;
  name: {
    displayName: string;
    deviceName: string;
    os: string;
    browser: string;
    type: string;
  };
  rtcSupported: boolean;
}

export interface FileMetadata {
  name: string;
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
