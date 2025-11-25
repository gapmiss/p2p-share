import { App, Modal, setIcon } from 'obsidian';
import { t } from '../i18n';

type PairingState = 'choose' | 'show-code' | 'enter-code' | 'success' | 'error';

export class PairingModal extends Modal {
  private state: PairingState = 'choose';
  private pairKey: string | null = null;
  private roomSecret: string | null = null;
  private errorMessage: string | null = null;
  private inputEl: HTMLInputElement | null = null;
  private countdownInterval: number | null = null;
  private countdownEl: HTMLElement | null = null;
  private timeRemaining = 60;

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
    this.stopCountdown();
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
    header.createEl('h2', { text: t('pairing-modal.title') });

    const description = contentEl.createDiv({ cls: 'p2p-share-pairing-description' });
    description.createEl('p', {
      text: t('pairing-modal.description'),
    });

    const buttons = contentEl.createDiv({ cls: 'p2p-share-pairing-buttons' });

    const initiateBtn = buttons.createEl('button', {
      text: t('pairing-modal.show-code'),
      cls: 'mod-cta',
    });
    initiateBtn.onclick = () => {
      this.state = 'show-code';
      this.render();
      this.onInitiate();
    };

    const joinBtn = buttons.createEl('button', {
      text: t('pairing-modal.enter-code'),
    });
    joinBtn.onclick = () => {
      this.state = 'enter-code';
      this.render();
    };

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: t('common.cancel') });
    cancelBtn.onclick = () => this.close();
  }

  private renderShowCode(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon' });
    setIcon(iconContainer, 'link');
    header.createEl('h2', { text: t('pairing-modal.code-title') });

    if (this.pairKey) {
      const codeContainer = contentEl.createDiv({ cls: 'p2p-share-pairing-code-container' });
      const codeEl = codeContainer.createDiv({
        cls: 'p2p-share-pairing-code',
        attr: { tabindex: '0', role: 'button', 'aria-label': t('pairing-modal.code-click-to-copy') }
      });
      codeEl.setText(this.formatPairKey(this.pairKey));

      // Make code copyable on click
      codeEl.onclick = () => this.copyPairKey();
      codeEl.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.copyPairKey();
        }
      };

      const instruction = contentEl.createDiv({ cls: 'p2p-share-pairing-instruction' });
      instruction.createEl('p', {
        text: t('pairing-modal.code-instruction'),
      });

      this.countdownEl = instruction.createEl('p', {
        cls: 'p2p-share-pairing-warning',
      });
      this.startCountdown();
    } else {
      const loading = contentEl.createDiv({ cls: 'p2p-share-pairing-loading' });
      loading.createEl('p', { text: t('pairing-modal.code-generating') });
    }

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: t('common.cancel') });
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
    header.createEl('h2', { text: t('pairing-modal.enter-code') });

    const instruction = contentEl.createDiv({ cls: 'p2p-share-pairing-instruction' });
    instruction.createEl('p', {
      text: t('pairing-modal.enter-instruction'),
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

    const backBtn = footer.createEl('button', { text: t('common.back') });
    backBtn.onclick = () => {
      this.state = 'choose';
      this.render();
    };

    const joinBtn = footer.createEl('button', { text: t('pairing-modal.join'), cls: 'mod-cta' });
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
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon p2p-share-success' });
    setIcon(iconContainer, 'check');
    header.createEl('h2', { text: t('pairing-modal.success.title') });

    const message = contentEl.createDiv({ cls: 'p2p-share-pairing-success-message' });
    message.createEl('p', {
      text: t('pairing-modal.success.message', this.peerDisplayName),
    });
    message.createEl('p', {
      text: t('pairing-modal.success.hint'),
    });

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });
    const doneBtn = footer.createEl('button', { text: t('common.done'), cls: 'mod-cta' });
    doneBtn.onclick = () => this.close();
  }

  private renderError(): void {
    const { contentEl } = this;

    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    const iconContainer = header.createDiv({ cls: 'p2p-share-pairing-icon p2p-share-error' });
    setIcon(iconContainer, 'x');
    header.createEl('h2', { text: t('pairing-modal.error.title') });

    const message = contentEl.createDiv({ cls: 'p2p-share-pairing-error-message' });
    message.createEl('p', {
      text: this.errorMessage || t('pairing-modal.error.unknown'),
    });

    const footer = contentEl.createDiv({ cls: 'p2p-share-modal-footer' });

    const retryBtn = footer.createEl('button', { text: t('pairing-modal.try-again') });
    retryBtn.onclick = () => {
      this.state = 'choose';
      this.errorMessage = null;
      this.render();
    };

    const closeBtn = footer.createEl('button', { text: t('common.close') });
    closeBtn.onclick = () => this.close();
  }

  private formatPairKey(key: string): string {
    // Format as "XXX XXX" for readability
    return key.slice(0, 3) + ' ' + key.slice(3);
  }

  private async copyPairKey(): Promise<void> {
    if (!this.pairKey) return;

    try {
      await navigator.clipboard.writeText(this.pairKey);
      // Show brief feedback
      const codeEl = this.contentEl.querySelector('.p2p-share-pairing-code') as HTMLElement;
      if (codeEl) {
        const originalText = codeEl.textContent;
        codeEl.textContent = t('pairing-modal.code-copied');
        setTimeout(() => {
          codeEl.textContent = originalText;
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to copy pairing code:', error);
    }
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.timeRemaining = 60;
    this.updateCountdownDisplay();

    this.countdownInterval = window.setInterval(() => {
      this.timeRemaining--;
      this.updateCountdownDisplay();

      if (this.timeRemaining <= 0) {
        this.stopCountdown();
        this.setPairingError(t('pairing-modal.error.expired'));
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval !== null) {
      window.clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdownDisplay(): void {
    if (this.countdownEl) {
      const plural = this.timeRemaining !== 1 ? 's' : '';
      this.countdownEl.textContent = t('pairing-modal.code-expires', this.timeRemaining, plural);
    }
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
    this.errorMessage = t('pairing-modal.error.canceled');
    this.state = 'error';
    this.render();
  }

  updatePeerDisplayName(displayName: string): void {
    this.peerDisplayName = displayName;
    // Re-render if we're still showing the success state
    if (this.state === 'success') {
      this.render();
    }
  }
}
