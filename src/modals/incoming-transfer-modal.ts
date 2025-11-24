import { App, Modal, setIcon } from 'obsidian';
import type { FileMetadata } from '../types';

export class IncomingTransferModal extends Modal {
  private files: FileMetadata[];
  private peerName: string;
  private totalSize: number;
  private onAccept: () => void;
  private onReject: () => void;

  constructor(
    app: App,
    files: FileMetadata[],
    peerName: string,
    totalSize: number,
    onAccept: () => void,
    onReject: () => void
  ) {
    super(app);
    this.files = files;
    this.peerName = peerName;
    this.totalSize = totalSize;
    this.onAccept = onAccept;
    this.onReject = onReject;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-incoming-modal');

    // Header with icon
    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-incoming-icon' });
    setIcon(iconContainer, 'download');
    header.createEl('h2', { text: 'Incoming Transfer' });

    // From peer
    const peerInfo = contentEl.createDiv({ cls: 'p2p-share-incoming-peer' });
    peerInfo.createSpan({ text: 'From: ' });
    peerInfo.createSpan({ text: this.peerName, cls: 'p2p-share-peer-name-highlight' });

    // File summary
    const summary = contentEl.createDiv({ cls: 'p2p-share-incoming-summary' });
    summary.createEl('p', {
      text: `${this.files.length} file${this.files.length > 1 ? 's' : ''} (${this.formatSize(this.totalSize)})`,
    });

    // File list
    const fileList = contentEl.createDiv({ cls: 'p2p-share-incoming-file-list' });
    const maxDisplay = 5;
    const displayFiles = this.files.slice(0, maxDisplay);

    for (const file of displayFiles) {
      const item = fileList.createDiv({ cls: 'p2p-share-incoming-file-item' });
      const icon = item.createDiv({ cls: 'p2p-share-file-icon' });
      setIcon(icon, this.getFileIcon(file.name));
      item.createDiv({ cls: 'p2p-share-file-name', text: file.name });
      item.createDiv({ cls: 'p2p-share-file-size', text: this.formatSize(file.size) });
    }

    if (this.files.length > maxDisplay) {
      fileList.createDiv({
        cls: 'p2p-share-incoming-more',
        text: `...and ${this.files.length - maxDisplay} more`,
      });
    }

    // Action buttons
    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer peerdrop-incoming-actions' });

    const rejectBtn = footer.createEl('button', { text: 'Decline', cls: 'p2p-share-btn-reject' });
    rejectBtn.onclick = () => {
      this.onReject();
      this.close();
    };

    const acceptBtn = footer.createEl('button', { text: 'Accept', cls: 'mod-cta' });
    acceptBtn.onclick = () => {
      this.onAccept();
      this.close();
    };
  }

  private getFileIcon(fileName: string): string {
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
    const iconMap: Record<string, string> = {
      md: 'file-text',
      txt: 'file-text',
      json: 'file-code',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      pdf: 'file',
      mp3: 'music',
      mp4: 'video',
      zip: 'archive',
    };
    return iconMap[ext || ''] || 'file';
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
