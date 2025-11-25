import { Menu, Notice, Plugin, TFile, TFolder, addIcon } from 'obsidian';
import { P2PShareSettingTab } from './settings';
import { PeerManager } from './peer-manager';
import { PeerModal, FilePickerModal, TransferModal, IncomingTransferModal, PairingModal } from './modals';
import type { P2PShareSettings, FileMetadata, TransferProgress, PairedDevice } from './types';
import { DEFAULT_SETTINGS } from './types';
import { logger } from './logger';
import { t, tp } from './i18n';

// Custom P2P Share icon
const P2P_SHARE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
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

export default class P2PSharePlugin extends Plugin {
  settings: P2PShareSettings = DEFAULT_SETTINGS;
  peerManager: PeerManager | null = null;
  private statusBarItem: HTMLElement | null = null;
  private activeTransferModal: TransferModal | null = null;
  private activePairingModal: PairingModal | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize logger level from settings
    logger.setLevel(this.settings.logLevel);

    // Register custom icon
    addIcon('p2p-share', P2P_SHARE_ICON);

    // Initialize peer manager
    this.peerManager = new PeerManager(this.app.vault, this.settings);
    this.setupPeerManagerHandlers();

    // Add ribbon icon
    this.addRibbonIcon('p2p-share', t('ribbon.tooltip'), () => {
      this.showPeerModal();
    });

    // Add status bar item with menu on click
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass('p2p-share-status-bar');
    this.statusBarItem.onclick = (e) => this.showStatusBarContextMenu(e);
    this.statusBarItem.oncontextmenu = (e) => {
      e.preventDefault();
      this.showStatusBarContextMenu(e);
    };
    this.updateStatusBar();

    // Add commands
    this.addCommand({
      id: 'p2p-share-show-peers',
      name: t('command.show-peers'),
      callback: () => this.showPeerModal(),
    });

    this.addCommand({
      id: 'p2p-share-current-file',
      name: t('command.share-current-file'),
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
      id: 'p2p-share-files',
      name: t('command.share-files'),
      callback: () => this.showFilePicker(),
    });

    this.addCommand({
      id: 'p2p-share-reconnect',
      name: t('command.reconnect'),
      callback: () => this.reconnect(),
    });

    this.addCommand({
      id: 'p2p-share-pair-device',
      name: t('command.pair-device'),
      callback: () => this.showPairingModal(),
    });

    this.addCommand({
      id: 'p2p-share-toggle-connection',
      name: t('command.toggle-connection'),
      callback: () => this.toggleConnection(),
    });

    // Register context menu for files
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle(t('context-menu.share-file'))
              .setIcon('p2p-share')
              .onClick(() => this.shareFiles([file]));
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle(t('context-menu.share-folder'))
              .setIcon('p2p-share')
              .onClick(() => this.shareFolder(file));
          });
        }
      })
    );

    // Add settings tab
    this.addSettingTab(new P2PShareSettingTab(this.app, this));

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
      // new Notice('P2P Share: Connected to server');
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
    });

    this.peerManager.on('send-progress', (progress: TransferProgress) => {
      this.activeTransferModal?.updateProgress(progress);
    });

    this.peerManager.on('receive-progress', (progress: TransferProgress) => {
      this.activeTransferModal?.updateProgress(progress);
    });

    this.peerManager.on('transfer-rejected', () => {
      this.activeTransferModal?.setError(t('notice.transfer-rejected').replace('P2P Share: ', ''));
      new Notice(t('notice.transfer-rejected'));
    });

    // Device pairing events
    this.peerManager.on('pair-device-initiated', (data: { pairKey: string; roomSecret: string }) => {
      this.activePairingModal?.setPairKey(data.pairKey, data.roomSecret);
    });

    this.peerManager.on('pair-device-joined', async (data: { roomSecret: string; peerId: string }) => {
      // Try to get the peer's display name, fall back to 'Paired Device' if not available yet
      const peerInfo = this.peerManager.getPeerInfo(data.peerId);
      const displayName = peerInfo?.displayName || 'Paired Device';

      // Save the pairing
      await this.addPairedDevice(data.roomSecret, displayName);

      this.activePairingModal?.setPairingSuccess(data.roomSecret, displayName);
      new Notice(t('notice.device-paired'));
    });

    this.peerManager.on('pair-device-join-key-invalid', () => {
      this.activePairingModal?.setPairingError(t('pairing-modal.error.invalid-code'));
    });

    this.peerManager.on('pair-device-canceled', () => {
      this.activePairingModal?.setPairingCanceled();
    });

    this.peerManager.on('secret-room-deleted', async (roomSecret: string) => {
      // Other device unpaired - remove from our list
      await this.removePairedDevice(roomSecret);
      new Notice(t('notice.device-removed'));
    });

    this.peerManager.on('paired-device-identified', async (data: { roomSecret: string; displayName: string }) => {
      // Update the paired device name now that we know it
      await this.updatePairedDeviceName(data.roomSecret, data.displayName);

      // Also update the pairing modal if it's still open showing this device
      if (this.activePairingModal) {
        this.activePairingModal.updatePeerDisplayName(data.displayName);
      }
    });
  }

  private async connectToServer(): Promise<void> {
    // Don't try to connect if no server URL is configured
    if (!this.settings.serverUrl || this.settings.serverUrl.trim() === '') {
      logger.info('No server URL configured');
      new Notice(t('notice.configure-server'));
      this.updateStatusBar();
      return;
    }

    try {
      await this.peerManager?.connect();
    } catch (error) {
      logger.error('Failed to connect', error);
      new Notice(t('notice.failed-to-connect'));
      this.updateStatusBar();
    }
  }

  async reconnect(): Promise<void> {
    if (!this.peerManager) return;
    try {
      await this.peerManager.reconnect();
    } catch (error) {
      logger.error('Failed to reconnect', error);
      new Notice(t('notice.failed-to-connect'));
    }
  }

  private updateStatusBar(): void {
    if (!this.statusBarItem) return;

    const isConnected = this.peerManager?.isConnected() ?? false;
    const peerCount = this.peerManager?.getPeers().length ?? 0;

    if (isConnected) {
      const peerText = t('status-bar.peers', peerCount, peerCount !== 1 ? 's' : '');
      this.statusBarItem.setText(`${t('plugin.name')}: ${peerText}`);
      this.statusBarItem.removeClass('p2p-share-disconnected');
    } else {
      this.statusBarItem.setText(t('status-bar.offline'));
      this.statusBarItem.addClass('p2p-share-disconnected');
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
      () => this.toggleConnection(),
      this.settings.pairedDevices
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
      () => this.toggleConnection(),
      this.settings.pairedDevices
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
      () => this.toggleConnection(),
      this.settings.pairedDevices
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
      new Notice(t('notice.no-files'));
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
        new Notice(t('notice.transfer-cancelled'));
      }
    );
    this.activeTransferModal.open();

    try {
      await this.peerManager.sendFilesToPeer(peerId, allFiles);
    } catch (error) {
      logger.error('Error sending files', error);
      this.activeTransferModal?.setError((error as Error).message);
      new Notice(t('notice.error-sending', (error as Error).message));
    }
  }

  private handleIncomingTransfer(data: { files: FileMetadata[]; totalSize: number; peerId: string }): void {
    if (!this.peerManager) return;

    const peerInfo = this.peerManager.getPeerInfo(data.peerId);
    const peerName = peerInfo?.name.displayName || peerInfo?.name.deviceName || 'Unknown peer';

    // Find if this peer is paired and check auto-accept setting
    const pairedDevice = this.settings.pairedDevices.find((d) => {
      // Match by peer ID stored during pairing, or by display name
      // Note: We should ideally store peerId during pairing, but for now match by name
      return d.displayName === peerName;
    });

    // Option C: If auto-accept is enabled, skip the accept modal and go straight to progress
    if (pairedDevice?.autoAccept) {
      logger.info('Auto-accepting transfer from paired device:', peerName);

      // Accept immediately
      this.peerManager?.acceptTransfer(data.peerId);

      // Show progress modal (skip the accept/reject modal)
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

      new Notice(t('notice.auto-accepting', peerName));
      return;
    }

    // Show accept/reject modal with optional auto-accept checkbox
    new IncomingTransferModal(
      this.app,
      data.files,
      peerName,
      data.totalSize,
      async (enableAutoAccept: boolean) => {
        // Accept
        this.peerManager?.acceptTransfer(data.peerId);

        // Update auto-accept setting if checkbox was checked
        if (enableAutoAccept && pairedDevice) {
          await this.updatePairedDeviceAutoAccept(pairedDevice.roomSecret, true);
        }

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
        new Notice(t('notice.transfer-declined'));
      },
      pairedDevice?.roomSecret || null,
      pairedDevice?.autoAccept || false
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
      new Notice(t('notice.not-connected'));
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
      autoAccept: false, // Default to manual accept
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

  async updatePairedDeviceAutoAccept(roomSecret: string, autoAccept: boolean): Promise<void> {
    const device = this.settings.pairedDevices.find((d) => d.roomSecret === roomSecret);
    if (device) {
      device.autoAccept = autoAccept;
      await this.saveSettings();
      logger.debug('Updated paired device auto-accept to', autoAccept);
    }
  }

  isConnected(): boolean {
    return this.peerManager?.isConnected() ?? false;
  }

  async toggleConnection(): Promise<void> {
    if (!this.peerManager) return;

    if (this.peerManager.isConnected()) {
      this.peerManager.disconnect();
      new Notice(t('notice.disconnected'));
    } else {
      await this.connectToServer();
      if (this.peerManager.isConnected()) {
        new Notice(t('notice.connected'));
      }
    }
    this.updateStatusBar();
  }

  private showStatusBarContextMenu(e: MouseEvent): void {
    const menu = new Menu();
    const isConnected = this.peerManager?.isConnected() ?? false;

    menu.addItem((item) =>
      item
        .setTitle(isConnected ? t('common.disconnect') : t('common.connect'))
        .setIcon(isConnected ? 'unlink' : 'link')
        .onClick(() => this.toggleConnection())
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle(t('status-bar.menu.show-peers'))
        .setIcon('users')
        .onClick(() => this.showPeerModal())
    );

    menu.addItem((item) =>
      item
        .setTitle(t('status-bar.menu.pair-device'))
        .setIcon('link')
        .onClick(() => this.showPairingModal())
    );

    menu.showAtMouseEvent(e);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Migration: Add autoAccept field to existing paired devices
    let needsSave = false;
    for (const device of this.settings.pairedDevices) {
      if (device.autoAccept === undefined) {
        device.autoAccept = false;
        needsSave = true;
      }
    }
    if (needsSave) {
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.peerManager?.updateSettings(this.settings);
    logger.setLevel(this.settings.logLevel);
  }
}
