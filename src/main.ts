import { Menu, Notice, Plugin, TFile, TFolder, addIcon } from 'obsidian';
import { PeerDropSettingTab } from './settings';
import { PeerManager } from './peer-manager';
import { PeerModal, FilePickerModal, TransferModal, IncomingTransferModal, PairingModal } from './modals';
import type { PeerDropSettings, FileMetadata, TransferProgress, PairedDevice } from './types';
import { DEFAULT_SETTINGS } from './types';
import { logger } from './logger';

// Custom PeerDrop icon
const PEERDROP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="30" cy="30" r="12"/>
  <circle cx="70" cy="30" r="12"/>
  <circle cx="30" cy="70" r="12"/>
  <circle cx="70" cy="70" r="12"/>
  <line x1="42" y1="30" x2="58" y2="30"/>
  <line x1="30" y1="42" x2="30" y2="58"/>
  <line x1="70" y1="42" x2="70" y2="58"/>
  <line x1="42" y1="70" x2="58" y2="70"/>
  <line x1="40" y1="40" x2="60" y2="60"/>
  <line x1="60" y1="40" x2="40" y2="60"/>
</svg>`;

export default class PeerDropPlugin extends Plugin {
  settings: PeerDropSettings = DEFAULT_SETTINGS;
  private peerManager: PeerManager | null = null;
  private statusBarItem: HTMLElement | null = null;
  private activeTransferModal: TransferModal | null = null;
  private activePairingModal: PairingModal | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize logger level from settings
    logger.setLevel(this.settings.logLevel);

    // Register custom icon
    addIcon('peerdrop', PEERDROP_ICON);

    // Initialize peer manager
    this.peerManager = new PeerManager(this.app.vault, this.settings);
    this.setupPeerManagerHandlers();

    // Add ribbon icon
    this.addRibbonIcon('peerdrop', 'PeerDrop', () => {
      this.showPeerModal();
    });

    // Add status bar item with menu on click
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass('peerdrop-status-bar');
    this.statusBarItem.onclick = (e) => this.showStatusBarContextMenu(e);
    this.statusBarItem.oncontextmenu = (e) => {
      e.preventDefault();
      this.showStatusBarContextMenu(e);
    };
    this.updateStatusBar();

    // Add commands
    this.addCommand({
      id: 'peerdrop-show-peers',
      name: 'Show available peers',
      callback: () => this.showPeerModal(),
    });

    this.addCommand({
      id: 'peerdrop-share-current-file',
      name: 'Share current file',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          if (!checking) {
            this.shareFiles([file]);
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: 'peerdrop-share-files',
      name: 'Share files...',
      callback: () => this.showFilePicker(),
    });

    this.addCommand({
      id: 'peerdrop-reconnect',
      name: 'Reconnect to server',
      callback: () => this.reconnect(),
    });

    this.addCommand({
      id: 'peerdrop-pair-device',
      name: 'Pair with device',
      callback: () => this.showPairingModal(),
    });

    this.addCommand({
      id: 'peerdrop-toggle-connection',
      name: 'Toggle connection',
      callback: () => this.toggleConnection(),
    });

    // Register context menu for files
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle('Share via PeerDrop')
              .setIcon('peerdrop')
              .onClick(() => this.shareFiles([file]));
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Share folder via PeerDrop')
              .setIcon('peerdrop')
              .onClick(() => this.shareFolder(file));
          });
        }
      })
    );

    // Add settings tab
    this.addSettingTab(new PeerDropSettingTab(this.app, this));

    // Connect to server
    this.connectToServer();
  }

  async onunload(): Promise<void> {
    this.peerManager?.disconnect();
  }

  private setupPeerManagerHandlers(): void {
    if (!this.peerManager) return;

    this.peerManager.on('server-connected', () => {
      this.updateStatusBar();
      // new Notice('PeerDrop: Connected to server');
    });

    this.peerManager.on('server-disconnected', () => {
      this.updateStatusBar();
    });

    this.peerManager.on('peers-updated', () => {
      this.updateStatusBar();
    });

    this.peerManager.on('transfer-request', (data: { files: FileMetadata[]; totalSize: number; peerId: string }) => {
      this.handleIncomingTransfer(data);
    });

    this.peerManager.on('file-received', async (data: { metadata: FileMetadata; data: ArrayBuffer }) => {
      try {
        await this.peerManager?.saveReceivedFile(data.metadata, data.data);
      } catch (error) {
        logger.error('Error saving file', error);
      }
    });

    this.peerManager.on('transfer-complete', () => {
      logger.debug('transfer-complete event, activeTransferModal:', !!this.activeTransferModal);
      if (this.activeTransferModal) {
        this.activeTransferModal.setComplete();
      } else {
        logger.warn('No active transfer modal to update');
      }
      if (this.settings.showNotifications) {
        new Notice('PeerDrop: Transfer complete!');
      }
    });

    this.peerManager.on('send-progress', (progress: TransferProgress) => {
      this.activeTransferModal?.updateProgress(progress);
    });

    this.peerManager.on('receive-progress', (progress: TransferProgress) => {
      this.activeTransferModal?.updateProgress(progress);
    });

    this.peerManager.on('transfer-rejected', () => {
      this.activeTransferModal?.setError('Transfer rejected by peer');
      new Notice('PeerDrop: Transfer rejected');
    });

    // Device pairing events
    this.peerManager.on('pair-device-initiated', (data: { pairKey: string; roomSecret: string }) => {
      this.activePairingModal?.setPairKey(data.pairKey, data.roomSecret);
    });

    this.peerManager.on('pair-device-joined', async (data: { roomSecret: string; peerId: string }) => {
      // Save the pairing - peer info might not be available yet, will update when we see them
      await this.addPairedDevice(data.roomSecret, 'Paired Device');

      this.activePairingModal?.setPairingSuccess(data.roomSecret, 'Paired Device');
      new Notice('PeerDrop: Device paired successfully!');
    });

    this.peerManager.on('pair-device-join-key-invalid', () => {
      this.activePairingModal?.setPairingError('Invalid or expired pairing code.');
    });

    this.peerManager.on('pair-device-canceled', () => {
      this.activePairingModal?.setPairingCanceled();
    });

    this.peerManager.on('secret-room-deleted', async (roomSecret: string) => {
      // Other device unpaired - remove from our list
      await this.removePairedDevice(roomSecret);
      new Notice('PeerDrop: A paired device was removed');
    });

    this.peerManager.on('paired-device-identified', async (data: { roomSecret: string; displayName: string }) => {
      // Update the paired device name now that we know it
      await this.updatePairedDeviceName(data.roomSecret, data.displayName);
    });
  }

  private async connectToServer(): Promise<void> {
    // Don't try to connect if no server URL is configured
    if (!this.settings.serverUrl || this.settings.serverUrl.trim() === '') {
      logger.info('No server URL configured');
      new Notice('PeerDrop: Please configure a server URL in settings');
      this.updateStatusBar();
      return;
    }

    try {
      await this.peerManager?.connect();
    } catch (error) {
      logger.error('Failed to connect', error);
      new Notice('PeerDrop: Failed to connect to server. Check the URL and ensure the server accepts external connections.');
      this.updateStatusBar();
    }
  }

  async reconnect(): Promise<void> {
    this.peerManager?.disconnect();
    await this.connectToServer();
  }

  private updateStatusBar(): void {
    if (!this.statusBarItem) return;

    const isConnected = this.peerManager?.isConnected() ?? false;
    const peerCount = this.peerManager?.getPeers().length ?? 0;

    if (isConnected) {
      this.statusBarItem.setText(`PeerDrop: ${peerCount} peer${peerCount !== 1 ? 's' : ''}`);
      this.statusBarItem.removeClass('peerdrop-disconnected');
    } else {
      this.statusBarItem.setText('PeerDrop: Offline');
      this.statusBarItem.addClass('peerdrop-disconnected');
    }
  }

  private showPeerModal(): void {
    if (!this.peerManager) return;

    new PeerModal(
      this.app,
      this.peerManager,
      (peerId) => {
        this.showFilePicker(peerId);
      },
      () => this.toggleConnection()
    ).open();
  }

  private showFilePicker(targetPeerId?: string): void {
    new FilePickerModal(this.app, (files, folders) => {
      if (targetPeerId) {
        this.sendToPeer(targetPeerId, files, folders);
      } else {
        this.shareFiles(files, folders);
      }
    }).open();
  }

  private shareFiles(files: TFile[], folders: TFolder[] = []): void {
    if (!this.peerManager) return;

    new PeerModal(
      this.app,
      this.peerManager,
      (peerId) => {
        this.sendToPeer(peerId, files, folders);
      },
      () => this.toggleConnection()
    ).open();
  }

  private shareFolder(folder: TFolder): void {
    if (!this.peerManager) return;

    new PeerModal(
      this.app,
      this.peerManager,
      (peerId) => {
        this.sendToPeer(peerId, [], [folder]);
      },
      () => this.toggleConnection()
    ).open();
  }

  private async sendToPeer(peerId: string, files: TFile[], folders: TFolder[]): Promise<void> {
    if (!this.peerManager) return;

    const peerInfo = this.peerManager.getPeerInfo(peerId);
    const peerName = peerInfo?.name.displayName || peerInfo?.name.deviceName || 'Unknown peer';

    // Collect all files including from folders
    const allFiles = [...files];
    for (const folder of folders) {
      const folderFiles = this.getFilesInFolder(folder);
      allFiles.push(...folderFiles);
    }

    if (allFiles.length === 0) {
      new Notice('PeerDrop: No files to send');
      return;
    }

    // Create file metadata for the modal
    const fileMetadata: FileMetadata[] = allFiles.map((f) => ({
      name: f.name,
      size: f.stat.size,
      type: this.getMimeType(f.extension),
    }));

    // Show transfer modal
    this.activeTransferModal = new TransferModal(
      this.app,
      'send',
      fileMetadata,
      peerName,
      () => {
        // Cancel callback - could implement cancellation
        new Notice('PeerDrop: Transfer cancelled');
      }
    );
    this.activeTransferModal.open();

    try {
      await this.peerManager.sendFilesToPeer(peerId, allFiles);
    } catch (error) {
      logger.error('Error sending files', error);
      this.activeTransferModal?.setError((error as Error).message);
      new Notice(`PeerDrop: Error sending files - ${(error as Error).message}`);
    }
  }

  private handleIncomingTransfer(data: { files: FileMetadata[]; totalSize: number; peerId: string }): void {
    if (!this.peerManager) return;

    const peerInfo = this.peerManager.getPeerInfo(data.peerId);
    const peerName = peerInfo?.name.displayName || peerInfo?.name.deviceName || 'Unknown peer';

    // Check if auto-accept is enabled (would need paired device tracking)
    // For now, always show the modal

    new IncomingTransferModal(
      this.app,
      data.files,
      peerName,
      data.totalSize,
      () => {
        // Accept
        this.peerManager?.acceptTransfer(data.peerId);

        // Show progress modal
        this.activeTransferModal = new TransferModal(
          this.app,
          'receive',
          data.files,
          peerName,
          () => {
            this.peerManager?.rejectTransfer(data.peerId);
          }
        );
        this.activeTransferModal.open();
      },
      () => {
        // Reject
        this.peerManager?.rejectTransfer(data.peerId);
        new Notice('PeerDrop: Transfer declined');
      }
    ).open();
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
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  // ============================================================================
  // DEVICE PAIRING
  // ============================================================================

  private showPairingModal(): void {
    if (!this.peerManager) return;

    if (!this.peerManager.isConnected()) {
      new Notice('PeerDrop: Not connected to server. Please reconnect first.');
      return;
    }

    this.activePairingModal = new PairingModal(this.app, {
      onInitiate: () => {
        this.peerManager?.pairDeviceInitiate();
      },
      onJoin: (pairKey: string) => {
        this.peerManager?.pairDeviceJoin(pairKey);
      },
      onCancel: () => {
        this.peerManager?.pairDeviceCancel();
      },
      onSuccess: async (roomSecret: string, peerDisplayName: string) => {
        await this.addPairedDevice(roomSecret, peerDisplayName);
      },
    });
    this.activePairingModal.open();
  }

  async addPairedDevice(roomSecret: string, displayName: string): Promise<void> {
    // Check if already paired
    if (this.settings.pairedDevices.some((d) => d.roomSecret === roomSecret)) {
      return;
    }

    const pairedDevice: PairedDevice = {
      roomSecret,
      displayName,
      pairedAt: Date.now(),
    };

    this.settings.pairedDevices.push(pairedDevice);
    await this.saveSettings();
  }

  async removePairedDevice(roomSecret: string): Promise<void> {
    this.settings.pairedDevices = this.settings.pairedDevices.filter(
      (d) => d.roomSecret !== roomSecret
    );
    this.peerManager?.deleteRoomSecret(roomSecret);
    await this.saveSettings();
  }

  async updatePairedDeviceName(roomSecret: string, displayName: string): Promise<void> {
    const device = this.settings.pairedDevices.find((d) => d.roomSecret === roomSecret);
    if (device && device.displayName !== displayName) {
      device.displayName = displayName;
      await this.saveSettings();
      logger.debug('Updated paired device name to', displayName);
    }
  }

  isConnected(): boolean {
    return this.peerManager?.isConnected() ?? false;
  }

  async toggleConnection(): Promise<void> {
    if (!this.peerManager) return;

    if (this.peerManager.isConnected()) {
      this.peerManager.disconnect();
      new Notice('PeerDrop: Disconnected');
    } else {
      await this.connectToServer();
      if (this.peerManager.isConnected()) {
        new Notice('PeerDrop: Connected');
      }
    }
    this.updateStatusBar();
  }

  private showStatusBarContextMenu(e: MouseEvent): void {
    const menu = new Menu();
    const isConnected = this.peerManager?.isConnected() ?? false;

    menu.addItem((item) =>
      item
        .setTitle(isConnected ? 'Disconnect' : 'Connect')
        .setIcon(isConnected ? 'wifi-off' : 'wifi')
        .onClick(() => this.toggleConnection())
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle('Show peers')
        .setIcon('users')
        .onClick(() => this.showPeerModal())
    );

    menu.addItem((item) =>
      item
        .setTitle('Pair with device')
        .setIcon('link')
        .onClick(() => this.showPairingModal())
    );

    menu.showAtMouseEvent(e);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.peerManager?.updateSettings(this.settings);
    logger.setLevel(this.settings.logLevel);
  }
}
