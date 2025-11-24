import { App, Modal, setIcon } from 'obsidian';
import type { FileMetadata, TransferProgress } from '../types';

export class TransferModal extends Modal {
  private direction: 'send' | 'receive';
  private files: FileMetadata[];
  private peerName: string;
  private progressContainer: HTMLElement | null = null;
  private overallProgress: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private currentFileProgress: Map<string, number> = new Map();
  private onCancel: () => void;
  private isComplete = false;

  constructor(
    app: App,
    direction: 'send' | 'receive',
    files: FileMetadata[],
    peerName: string,
    onCancel: () => void
  ) {
    super(app);
    this.direction = direction;
    this.files = files;
    this.peerName = peerName;
    this.onCancel = onCancel;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-transfer-modal');

    // Header
    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const icon = header.createDiv({ cls: 'p2p-share-transfer-icon' });
    setIcon(icon, this.direction === 'send' ? 'upload' : 'download');
    header.createEl('h2', {
      text: this.direction === 'send' ? 'Sending Files' : 'Receiving Files',
    });

    // Peer info
    const peerInfo = contentEl.createDiv({ cls: 'p2p-share-transfer-peer' });
    peerInfo.createSpan({ text: this.direction === 'send' ? 'To: ' : 'From: ' });
    peerInfo.createSpan({ text: this.peerName, cls: 'p2p-share-peer-name-highlight' });

    // File list summary
    const summary = contentEl.createDiv({ cls: 'p2p-share-transfer-summary' });
    const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
    summary.setText(`${this.files.length} file${this.files.length > 1 ? 's' : ''} (${this.formatSize(totalSize)})`);

    // Overall progress bar
    const overallContainer = contentEl.createDiv({ cls: 'p2p-share-progress-overall' });
    this.overallProgress = overallContainer.createDiv({ cls: 'p2p-share-progress-bar' });
    const overallFill = this.overallProgress.createDiv({ cls: 'p2p-share-progress-fill' });
    overallFill.style.width = '0%';

    // Status text
    this.statusText = contentEl.createDiv({
      cls: 'p2p-share-transfer-status',
      text: this.direction === 'send' ? 'Connecting...' : 'Waiting for files...'
    });

    // Individual file progress
    this.progressContainer = contentEl.createDiv({ cls: 'p2p-share-file-progress-list' });
    for (const file of this.files) {
      this.renderFileProgress(file);
    }

    // Cancel button
    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => {
      if (!this.isComplete) {
        this.onCancel();
      }
      this.close();
    };
  }

  private renderFileProgress(file: FileMetadata): void {
    if (!this.progressContainer) return;

    const item = this.progressContainer.createDiv({
      cls: 'p2p-share-file-progress-item',
      attr: { 'data-file': file.name },
    });

    const info = item.createDiv({ cls: 'p2p-share-file-progress-info' });
    info.createDiv({ cls: 'p2p-share-file-progress-name', text: file.name });
    info.createDiv({ cls: 'p2p-share-file-progress-size', text: this.formatSize(file.size) });

    const progressBar = item.createDiv({ cls: 'p2p-share-progress-bar' });
    const fill = progressBar.createDiv({ cls: 'p2p-share-progress-fill' });
    fill.style.width = '0%';

    const status = item.createDiv({ cls: 'p2p-share-file-progress-status', text: 'Pending' });
  }

  updateProgress(progress: TransferProgress): void {
    this.currentFileProgress.set(progress.fileName, progress.progress);

    // Update individual file - use CSS.escape to handle special characters in filenames
    const escapedName = CSS.escape(progress.fileName);
    const item = this.progressContainer?.querySelector(`[data-file="${escapedName}"]`);
    if (item) {
      const fill = item.querySelector('.peerdrop-progress-fill') as HTMLElement;
      const status = item.querySelector('.peerdrop-file-progress-status') as HTMLElement;
      if (fill) {
        fill.style.width = `${progress.progress * 100}%`;
      }
      if (status) {
        if (progress.progress >= 1) {
          status.setText('Complete');
          status.addClass('complete');
        } else {
          status.setText(`${Math.round(progress.progress * 100)}%`);
        }
      }
    }

    // Update overall progress
    const totalProgress =
      Array.from(this.currentFileProgress.values()).reduce((sum, p) => sum + p, 0) /
      this.files.length;

    if (this.overallProgress) {
      const fill = this.overallProgress.querySelector('.peerdrop-progress-fill') as HTMLElement;
      if (fill) {
        fill.style.width = `${totalProgress * 100}%`;
      }
    }

    // Update status text
    if (this.statusText) {
      const completedFiles = Array.from(this.currentFileProgress.values()).filter((p) => p >= 1).length;
      this.statusText.setText(
        `${this.direction === 'send' ? 'Sending' : 'Receiving'}: ${completedFiles}/${this.files.length} files`
      );
    }
  }

  setComplete(): void {
    this.isComplete = true;

    if (this.statusText) {
      this.statusText.setText('Transfer complete!');
      this.statusText.addClass('complete');
    }

    // Update all file statuses and progress bars to 100%
    const items = this.progressContainer?.querySelectorAll('.peerdrop-file-progress-item');
    items?.forEach((item) => {
      const fill = item.querySelector('.peerdrop-progress-fill') as HTMLElement;
      const status = item.querySelector('.peerdrop-file-progress-status') as HTMLElement;
      if (fill) fill.style.width = '100%';
      if (status) {
        status.setText('Complete');
        status.addClass('complete');
      }
    });

    // Always set overall progress to 100% on complete
    if (this.overallProgress) {
      const fill = this.overallProgress.querySelector('.peerdrop-progress-fill') as HTMLElement;
      if (fill) {
        fill.style.width = '100%';
      }
    }

    // Update status text to show all files complete
    if (this.statusText) {
      this.statusText.setText(`Complete: ${this.files.length}/${this.files.length} files`);
    }

    // Change cancel to close
    const cancelBtn = this.contentEl.querySelector('.peerdrop-modal-footer button');
    if (cancelBtn) {
      cancelBtn.textContent = 'Close';
    }
  }

  setError(message: string): void {
    if (this.statusText) {
      this.statusText.setText(`Error: ${message}`);
      this.statusText.addClass('error');
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
