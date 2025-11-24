import { App, Modal, TFile, TFolder, TAbstractFile, setIcon } from 'obsidian';

export class FilePickerModal extends Modal {
  private selectedFiles: Set<TFile> = new Set();
  private selectedFolders: Set<TFolder> = new Set();
  private onConfirm: (files: TFile[], folders: TFolder[]) => void;
  private currentPath: string = '/';
  private contentContainer: HTMLElement | null = null;
  private selectionInfo: HTMLElement | null = null;

  constructor(app: App, onConfirm: (files: TFile[], folders: TFolder[]) => void) {
    super(app);
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-file-picker');

    // Header
    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    header.createEl('h2', { text: 'Select Files to Share' });

    // Breadcrumb / path
    const pathContainer = contentEl.createDiv({ cls: 'p2p-share-path-container' });
    this.renderBreadcrumb(pathContainer);

    // Content area
    this.contentContainer = contentEl.createDiv({ cls: 'p2p-share-file-list' });
    this.renderFileList();

    // Selection info
    this.selectionInfo = contentEl.createDiv({ cls: 'p2p-share-selection-info' });
    this.updateSelectionInfo();

    // Footer with actions
    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });

    const selectAllBtn = footer.createEl('button', { text: 'Select All' });
    selectAllBtn.onclick = () => this.selectAll();

    const clearBtn = footer.createEl('button', { text: 'Clear Selection' });
    clearBtn.onclick = () => this.clearSelection();

    const confirmBtn = footer.createEl('button', { text: 'Share Selected', cls: 'mod-cta' });
    confirmBtn.onclick = () => this.confirm();
  }

  private renderBreadcrumb(container: HTMLElement): void {
    container.empty();

    const parts = this.currentPath.split('/').filter((p) => p);
    const homeBtn = container.createEl('button', { text: 'Vault', cls: 'p2p-share-breadcrumb-item' });
    homeBtn.onclick = () => {
      this.currentPath = '/';
      this.renderFileList();
      this.renderBreadcrumb(container);
    };

    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      container.createSpan({ text: ' / ', cls: 'p2p-share-breadcrumb-sep' });
      const partPath = path;
      const btn = container.createEl('button', { text: part, cls: 'p2p-share-breadcrumb-item' });
      btn.onclick = () => {
        this.currentPath = partPath;
        this.renderFileList();
        this.renderBreadcrumb(container);
      };
    }
  }

  private renderFileList(): void {
    if (!this.contentContainer) return;
    this.contentContainer.empty();

    const folder =
      this.currentPath === '/'
        ? this.app.vault.getRoot()
        : (this.app.vault.getAbstractFileByPath(this.currentPath.slice(1)) as TFolder);

    if (!folder || !(folder instanceof TFolder)) {
      this.contentContainer.createEl('p', { text: 'Folder not found' });
      return;
    }

    // Sort: folders first, then files
    const children = [...folder.children].sort((a, b) => {
      if (a instanceof TFolder && b instanceof TFile) return -1;
      if (a instanceof TFile && b instanceof TFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    if (children.length === 0) {
      this.contentContainer.createEl('p', { text: 'Empty folder', cls: 'p2p-share-empty-folder' });
      return;
    }

    for (const child of children) {
      this.renderFileItem(child);
    }
  }

  private renderFileItem(file: TAbstractFile): void {
    if (!this.contentContainer) return;

    const item = this.contentContainer.createDiv({ cls: 'p2p-share-file-item' });

    // Checkbox
    const checkbox = item.createEl('input', { type: 'checkbox' });
    checkbox.checked =
      file instanceof TFile ? this.selectedFiles.has(file) : this.selectedFolders.has(file as TFolder);

    checkbox.onchange = () => {
      if (file instanceof TFile) {
        if (checkbox.checked) {
          this.selectedFiles.add(file);
        } else {
          this.selectedFiles.delete(file);
        }
      } else if (file instanceof TFolder) {
        if (checkbox.checked) {
          this.selectedFolders.add(file);
        } else {
          this.selectedFolders.delete(file);
        }
      }
      this.updateSelectionInfo();
    };

    // Icon
    const iconContainer = item.createDiv({ cls: 'p2p-share-file-icon' });
    if (file instanceof TFolder) {
      setIcon(iconContainer, 'folder');
    } else {
      setIcon(iconContainer, this.getFileIcon((file as TFile).extension));
    }

    // Name (clickable for folders)
    const nameEl = item.createDiv({ cls: 'p2p-share-file-name', text: file.name });
    if (file instanceof TFolder) {
      nameEl.addClass('p2p-share-folder-name');
      nameEl.onclick = (e) => {
        e.stopPropagation();
        this.currentPath = `/${file.path}`;
        this.renderFileList();
        const pathContainer = this.contentEl.querySelector('.peerdrop-path-container');
        if (pathContainer) this.renderBreadcrumb(pathContainer as HTMLElement);
      };
    }

    // Size (for files)
    if (file instanceof TFile) {
      const size = this.formatSize(file.stat.size);
      item.createDiv({ cls: 'p2p-share-file-size', text: size });
    }
  }

  private getFileIcon(extension: string): string {
    const iconMap: Record<string, string> = {
      md: 'file-text',
      txt: 'file-text',
      json: 'file-code',
      js: 'file-code',
      ts: 'file-code',
      css: 'file-code',
      html: 'file-code',
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
    return iconMap[extension.toLowerCase()] || 'file';
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  private updateSelectionInfo(): void {
    if (!this.selectionInfo) return;
    this.selectionInfo.empty();

    const fileCount = this.selectedFiles.size;
    const folderCount = this.selectedFolders.size;

    if (fileCount === 0 && folderCount === 0) {
      this.selectionInfo.setText('No items selected');
      return;
    }

    const parts: string[] = [];
    if (fileCount > 0) parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
    if (folderCount > 0) parts.push(`${folderCount} folder${folderCount > 1 ? 's' : ''}`);

    // Calculate total size including files in selected folders
    let totalSize = Array.from(this.selectedFiles).reduce((sum, f) => sum + f.stat.size, 0);
    for (const folder of this.selectedFolders) {
      totalSize += this.getFolderSize(folder);
    }

    this.selectionInfo.setText(`${parts.join(', ')} selected (${this.formatSize(totalSize)})`);
  }

  private getFolderSize(folder: TFolder): number {
    let size = 0;
    for (const child of folder.children) {
      if (child instanceof TFile) {
        size += child.stat.size;
      } else if (child instanceof TFolder) {
        size += this.getFolderSize(child);
      }
    }
    return size;
  }

  private selectAll(): void {
    const folder =
      this.currentPath === '/'
        ? this.app.vault.getRoot()
        : (this.app.vault.getAbstractFileByPath(this.currentPath.slice(1)) as TFolder);

    if (!folder) return;

    for (const child of folder.children) {
      if (child instanceof TFile) {
        this.selectedFiles.add(child);
      } else if (child instanceof TFolder) {
        this.selectedFolders.add(child);
      }
    }

    this.renderFileList();
    this.updateSelectionInfo();
  }

  private clearSelection(): void {
    this.selectedFiles.clear();
    this.selectedFolders.clear();
    this.renderFileList();
    this.updateSelectionInfo();
  }

  private confirm(): void {
    if (this.selectedFiles.size === 0 && this.selectedFolders.size === 0) {
      return;
    }
    this.onConfirm(Array.from(this.selectedFiles), Array.from(this.selectedFolders));
    this.close();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
