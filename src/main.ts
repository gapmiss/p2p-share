import { Notice, Plugin, TFile, TFolder, addIcon } from 'obsidian';
import { PeerDropSettingTab } from './settings';
import { PeerManager } from './peer-manager';
import { PeerModal, FilePickerModal, TransferModal, IncomingTransferModal } from './modals';
import type { PeerDropSettings, FileMetadata, TransferProgress } from './types';
import { DEFAULT_SETTINGS } from './types';

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

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register custom icon
    addIcon('peerdrop', PEERDROP_ICON);

    // Initialize peer manager
    this.peerManager = new PeerManager(this.app.vault, this.settings);
    this.setupPeerManagerHandlers();

    // Add ribbon icon
    this.addRibbonIcon('peerdrop', 'PeerDrop', () => {
      this.showPeerModal();
    });

    // Add status bar item
    this.statusBarItem = this.addStatusBarItem();
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
      new Notice('PeerDrop: Connected to server');
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
        const file = await this.peerManager?.saveReceivedFile(data.metadata, data.data);
        if (file && this.settings.showNotifications) {
          new Notice(`PeerDrop: Received ${data.metadata.name}`);
        }
      } catch (error) {
        console.error('PeerDrop: Error saving file', error);
        new Notice(`PeerDrop: Error saving ${data.metadata.name}`);
      }
    });

    this.peerManager.on('transfer-complete', () => {
      if (this.activeTransferModal) {
        this.activeTransferModal.setComplete();
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
  }

  private async connectToServer(): Promise<void> {
    // Don't try to connect if no server URL is configured
    if (!this.settings.serverUrl || this.settings.serverUrl.trim() === '') {
      console.log('PeerDrop: No server URL configured');
      new Notice('PeerDrop: Please configure a server URL in settings');
      this.updateStatusBar();
      return;
    }

    try {
      await this.peerManager?.connect();
    } catch (error) {
      console.error('PeerDrop: Failed to connect', error);
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

    new PeerModal(this.app, this.peerManager, (peerId) => {
      this.showFilePicker(peerId);
    }).open();
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

    new PeerModal(this.app, this.peerManager, (peerId) => {
      this.sendToPeer(peerId, files, folders);
    }).open();
  }

  private shareFolder(folder: TFolder): void {
    if (!this.peerManager) return;

    new PeerModal(this.app, this.peerManager, (peerId) => {
      this.sendToPeer(peerId, [], [folder]);
    }).open();
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
      console.error('PeerDrop: Error sending files', error);
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

  isConnected(): boolean {
    return this.peerManager?.isConnected() ?? false;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.peerManager?.updateSettings(this.settings);
  }
}
