import { App, Modal, setIcon } from 'obsidian';

type PairingState = 'choose' | 'show-code' | 'enter-code' | 'success' | 'error';

export class PairingModal extends Modal {
  private state: PairingState = 'choose';
  private pairKey: string | null = null;
  private roomSecret: string | null = null;
  private errorMessage: string | null = null;
  private inputEl: HTMLInputElement | null = null;

  private onInitiate: () => void;
  private onJoin: (pairKey: string) => void;
  private onCancel: () => void;
  private onSuccess: (roomSecret: string, peerDisplayName: string) => void;

  private peerDisplayName = 'Unknown Device';

  constructor(
    app: App,
    callbacks: {
      onInitiate: () => void;
      onJoin: (pairKey: string) => void;
      onCancel: () => void;
      onSuccess: (roomSecret: string, peerDisplayName: string) => void;
    }
  ) {
    super(app);
    this.onInitiate = callbacks.onInitiate;
    this.onJoin = callbacks.onJoin;
    this.onCancel = callbacks.onCancel;
    this.onSuccess = callbacks.onSuccess;
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    if (this.state === 'show-code' || this.state === 'enter-code') {
      this.onCancel();
    }
    this.contentEl.empty();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-pairing-modal');

    switch (this.state) {
      case 'choose':
        this.renderChoose();
        break;
      case 'show-code':
        this.renderShowCode();
        break;
      case 'enter-code':
        this.renderEnterCode();
        break;
      case 'success':
        this.renderSuccess();
        break;
      case 'error':
        this.renderError();
        break;
    }
  }

  private renderChoose(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon' });
    setIcon(iconContainer, 'link');
    header.createEl('h2', { text: 'Pair Devices' });

    const description = contentEl.createDiv({ cls: 'p2p-share-pairing-description' });
    description.createEl('p', {
      text: 'Pair with another device to share files across different networks.',
    });

    const buttons = contentEl.createDiv({ cls: 'p2p-share-pairing-buttons' });

    const initiateBtn = buttons.createEl('button', {
      text: 'Show pairing code',
      cls: 'mod-cta',
    });
    initiateBtn.onclick = () => {
      this.state = 'show-code';
      this.render();
      this.onInitiate();
    };

    const joinBtn = buttons.createEl('button', {
      text: 'Enter pairing code',
    });
    joinBtn.onclick = () => {
      this.state = 'enter-code';
      this.render();
    };

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => this.close();
  }

  private renderShowCode(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon' });
    setIcon(iconContainer, 'link');
    header.createEl('h2', { text: 'Pairing Code' });

    if (this.pairKey) {
      const codeContainer = contentEl.createDiv({ cls: 'p2p-share-pairing-code-container' });
      const codeEl = codeContainer.createDiv({ cls: 'p2p-share-pairing-code' });
      codeEl.setText(this.formatPairKey(this.pairKey));

      const instruction = contentEl.createDiv({ cls: 'p2p-share-pairing-instruction' });
      instruction.createEl('p', {
        text: 'Enter this code on the other device to pair.',
      });
      instruction.createEl('p', {
        text: 'The code expires in 60 seconds.',
        cls: 'p2p-share-pairing-warning',
      });
    } else {
      const loading = contentEl.createDiv({ cls: 'p2p-share-pairing-loading' });
      loading.createEl('p', { text: 'Generating pairing code...' });
    }

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => {
      this.onCancel();
      this.close();
    };
  }

  private renderEnterCode(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon' });
    setIcon(iconContainer, 'link');
    header.createEl('h2', { text: 'Enter Pairing Code' });

    const instruction = contentEl.createDiv({ cls: 'p2p-share-pairing-instruction' });
    instruction.createEl('p', {
      text: 'Enter the 6-digit code shown on the other device.',
    });

    const inputContainer = contentEl.createDiv({ cls: 'p2p-share-pairing-input-container' });
    this.inputEl = inputContainer.createEl('input', {
      type: 'text',
      placeholder: '000000',
      cls: 'p2p-share-pairing-input',
    });
    this.inputEl.maxLength = 6;
    this.inputEl.pattern = '[0-9]*';
    this.inputEl.inputMode = 'numeric';

    // Auto-submit when 6 digits entered
    this.inputEl.oninput = () => {
      const value = this.inputEl!.value.replace(/\D/g, '');
      this.inputEl!.value = value;
      if (value.length === 6) {
        this.submitPairKey(value);
      }
    };

    // Handle Enter key
    this.inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && this.inputEl!.value.length === 6) {
        this.submitPairKey(this.inputEl!.value);
      }
    };

    // Focus input
    setTimeout(() => this.inputEl?.focus(), 50);

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });

    const backBtn = footer.createEl('button', { text: 'Back' });
    backBtn.onclick = () => {
      this.state = 'choose';
      this.render();
    };

    const joinBtn = footer.createEl('button', { text: 'Join', cls: 'mod-cta' });
    joinBtn.onclick = () => {
      if (this.inputEl && this.inputEl.value.length === 6) {
        this.submitPairKey(this.inputEl.value);
      }
    };
  }

  private submitPairKey(pairKey: string): void {
    if (this.inputEl) {
      this.inputEl.disabled = true;
    }
    this.onJoin(pairKey);
  }

  private renderSuccess(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon peerdrop-success' });
    setIcon(iconContainer, 'check');
    header.createEl('h2', { text: 'Paired Successfully!' });

    const message = contentEl.createDiv({ cls: 'p2p-share-pairing-success-message' });
    message.createEl('p', {
      text: `You are now paired with "${this.peerDisplayName}".`,
    });
    message.createEl('p', {
      text: 'You can now share files with this device from anywhere.',
    });

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const doneBtn = footer.createEl('button', { text: 'Done', cls: 'mod-cta' });
    doneBtn.onclick = () => this.close();
  }

  private renderError(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon peerdrop-error' });
    setIcon(iconContainer, 'x');
    header.createEl('h2', { text: 'Pairing Failed' });

    const message = contentEl.createDiv({ cls: 'p2p-share-pairing-error-message' });
    message.createEl('p', {
      text: this.errorMessage || 'An unknown error occurred.',
    });

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });

    const retryBtn = footer.createEl('button', { text: 'Try Again' });
    retryBtn.onclick = () => {
      this.state = 'choose';
      this.errorMessage = null;
      this.render();
    };

    const closeBtn = footer.createEl('button', { text: 'Close' });
    closeBtn.onclick = () => this.close();
  }

  private formatPairKey(key: string): string {
    // Format as "XXX XXX" for readability
    return key.slice(0, 3) + ' ' + key.slice(3);
  }

  // ============================================================================
  // Public methods to update state from external events
  // ============================================================================

  setPairKey(pairKey: string, roomSecret: string): void {
    this.pairKey = pairKey;
    this.roomSecret = roomSecret;
    if (this.state === 'show-code') {
      this.render();
    }
  }

  setPairingSuccess(roomSecret: string, peerDisplayName: string): void {
    this.roomSecret = roomSecret;
    this.peerDisplayName = peerDisplayName || 'Unknown Device';
    this.state = 'success';
    this.render();
    this.onSuccess(roomSecret, this.peerDisplayName);
  }

  setPairingError(message: string): void {
    this.errorMessage = message;
    this.state = 'error';
    this.render();
  }

  setPairingCanceled(): void {
    this.errorMessage = 'Pairing was canceled.';
    this.state = 'error';
    this.render();
  }
}
