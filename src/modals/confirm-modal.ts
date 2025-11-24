import { App, Modal } from 'obsidian';

export class ConfirmModal extends Modal {
  private title: string;
  private message: string;
  private confirmText: string;
  private onConfirm: () => void;

  constructor(
    app: App,
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Remove'
  ) {
    super(app);
    this.title = title;
    this.message = message;
    this.onConfirm = onConfirm;
    this.confirmText = confirmText;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-confirm-modal');

    contentEl.createEl('h3', { text: this.title });
    contentEl.createEl('p', { text: this.message });

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });

    const cancelBtn = footer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => this.close();

    const confirmBtn = footer.createEl('button', { text: this.confirmText, cls: 'mod-warning' });
    confirmBtn.onclick = () => {
      this.onConfirm();
      this.close();
    };
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
