import { App, Modal, setIcon } from 'obsidian';
import type { PeerInfo } from '../types';
import type { PeerManager } from '../peer-manager';

export class PeerModal extends Modal {
  private peerManager: PeerManager;
  private onSelect: (peerId: string) => void;
  private onToggleConnection: () => Promise<void>;
  private peersContainer: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private connectBtn: HTMLButtonElement | null = null;

  constructor(
    app: App,
    peerManager: PeerManager,
    onSelect: (peerId: string) => void,
    onToggleConnection: () => Promise<void>
  ) {
    super(app);
    this.peerManager = peerManager;
    this.onSelect = onSelect;
    this.onToggleConnection = onToggleConnection;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('peerdrop-modal');

    // Header
    const header = contentEl.createDiv({ cls: 'peerdrop-modal-header' });
    header.createEl('h2', { text: 'Select Peer' });

    // Our display name
    const displayName = this.peerManager.getDisplayName();
    if (displayName) {
      header.createDiv({
        cls: 'peerdrop-our-name',
        text: `You appear as: ${displayName}`,
      });
    }

    // Connection status
    this.statusEl = header.createDiv({ cls: 'peerdrop-connection-status' });
    this.updateConnectionStatus();

    // Peers container
    this.peersContainer = contentEl.createDiv({ cls: 'peerdrop-peers-container' });
    this.renderPeers();

    // Listen for peer updates
    this.peerManager.on('peers-updated', () => this.renderPeers());
    this.peerManager.on('server-connected', () => {
      this.updateConnectionStatus();
      this.renderPeers();
    });
    this.peerManager.on('server-disconnected', () => {
      this.updateConnectionStatus();
      this.renderPeers();
    });

    // Footer with connect/disconnect and refresh buttons
    const footer = contentEl.createDiv({ cls: 'peerdrop-modal-footer' });

    this.connectBtn = footer.createEl('button');
    this.updateConnectButton();
    this.connectBtn.onclick = async () => {
      if (this.connectBtn) {
        this.connectBtn.disabled = true;
        this.connectBtn.setText('...');
      }
      await this.onToggleConnection();
      this.updateConnectButton();
      this.updateConnectionStatus();
    };

    const refreshBtn = footer.createEl('button', { text: 'Refresh' });
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      refreshBtn.setText('Refreshing...');
      try {
        await this.peerManager.refresh();
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.setText('Refresh');
      }
    };
  }

  private updateConnectButton(): void {
    if (!this.connectBtn) return;
    const isConnected = this.peerManager.isConnected();
    this.connectBtn.setText(isConnected ? 'Disconnect' : 'Connect');
    this.connectBtn.disabled = false;
    this.connectBtn.toggleClass('mod-warning', isConnected);
  }

  private updateConnectionStatus(): void {
    if (!this.statusEl) return;
    this.statusEl.empty();
    const isConnected = this.peerManager.isConnected();
    this.statusEl.createSpan({ cls: `peerdrop-status-dot ${isConnected ? 'connected' : 'disconnected'}` });
    this.statusEl.createSpan({ text: isConnected ? 'Connected' : 'Disconnected' });
  }

  private renderPeers(): void {
    if (!this.peersContainer) return;
    this.peersContainer.empty();

    const peers = this.peerManager.getPeers();

    if (peers.length === 0) {
      const emptyState = this.peersContainer.createDiv({ cls: 'peerdrop-empty-state' });
      emptyState.createEl('p', { text: 'No peers found on your network.' });
      emptyState.createEl('p', {
        text: 'Make sure other devices are connected to the same PairDrop server.',
        cls: 'peerdrop-hint',
      });
      return;
    }

    for (const peer of peers) {
      this.renderPeerItem(peer);
    }
  }

  private renderPeerItem(peer: PeerInfo): void {
    if (!this.peersContainer) return;

    const item = this.peersContainer.createDiv({ cls: 'peerdrop-peer-item' });
    item.onclick = () => {
      this.onSelect(peer.id);
      this.close();
    };

    // Icon
    const iconContainer = item.createDiv({ cls: 'peerdrop-peer-icon' });
    const iconName = this.getDeviceIcon(peer.name.type);
    setIcon(iconContainer, iconName);

    // Info
    const info = item.createDiv({ cls: 'peerdrop-peer-info' });
    info.createDiv({ cls: 'peerdrop-peer-name', text: peer.name.displayName || peer.name.deviceName || 'Unknown' });
    const details = [peer.name.os, peer.name.browser].filter(Boolean).join(' • ') || 'Unknown device';
    info.createDiv({
      cls: 'peerdrop-peer-details',
      text: details,
    });

    // RTC indicator
    if (peer.rtcSupported) {
      const rtcBadge = item.createDiv({ cls: 'peerdrop-rtc-badge', text: 'P2P' });
      rtcBadge.title = 'Direct peer-to-peer connection supported';
    }
  }

  private getDeviceIcon(type: string | undefined): string {
    switch (type?.toLowerCase()) {
      case 'mobile':
      case 'phone':
        return 'smartphone';
      case 'tablet':
        return 'tablet';
      case 'desktop':
        return 'monitor';
      case 'laptop':
        return 'laptop';
      default:
        // Desktop browsers don't have a device type set
        return 'monitor';
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
