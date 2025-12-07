import { App, Menu, Modal, setIcon } from 'obsidian';
import type { PeerInfo, PairedDevice } from '../types';
import type { PeerManager } from '../peer-manager';
import { t } from '../i18n';

export class PeerModal extends Modal {
  private peerManager: PeerManager;
  private onSelect: (peerId: string) => void;
  private onToggleConnection: () => Promise<void>;
  private peersContainer: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private displayNameEl: HTMLElement | null = null;
  private connectBtn: HTMLButtonElement | null = null;
  private pairedDevices: PairedDevice[];

  constructor(
    app: App,
    peerManager: PeerManager,
    onSelect: (peerId: string) => void,
    onToggleConnection: () => Promise<void>,
    pairedDevices: PairedDevice[] = []
  ) {
    super(app);
    this.peerManager = peerManager;
    this.onSelect = onSelect;
    this.onToggleConnection = onToggleConnection;
    this.pairedDevices = pairedDevices;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('p2p-share-modal');

    // Header
    const header = contentEl.createDiv({ cls: 'p2p-share-modal-header' });
    header.createEl('h2', { text: t('peer-modal.title') });

    // Our display name - store reference for updates
    this.displayNameEl = header.createDiv({ cls: 'p2p-share-our-name' });
    this.updateDisplayName();

    // Connection status with menu button
    const statusContainer = header.createDiv({ cls: 'p2p-share-status-container' });
    this.statusEl = statusContainer.createDiv({ cls: 'p2p-share-connection-status' });
    this.updateConnectionStatus();

    // Menu button to the right of status
    const menuBtn = statusContainer.createDiv({
      cls: 'p2p-share-menu-btn clickable-icon',
      attr: { 'aria-label': 'Connection options', tabindex: '0' }
    });
    setIcon(menuBtn, 'ellipsis');
    menuBtn.onclick = (e) => this.showConnectionMenu(e);
    menuBtn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.showConnectionMenu(e);
      }
    };

    // Peers container
    this.peersContainer = contentEl.createDiv({ cls: 'p2p-share-peers-container' });
    this.renderPeers();

    // Listen for peer updates (server sends these automatically)
    this.peerManager.on('peers-updated', () => {
      this.renderPeers();
    });
    this.peerManager.on('server-connected', () => {
      this.updateConnectionStatus();
      this.updateDisplayName();
      this.renderPeers();
    });
    this.peerManager.on('server-disconnected', () => {
      this.updateConnectionStatus();
      this.updateDisplayName();
      this.renderPeers();
    });
    this.peerManager.on('display-name-updated', () => {
      this.updateDisplayName();
    });
  }

  private showConnectionMenu(e: MouseEvent | KeyboardEvent): void {
    const menu = new Menu();
    const isConnected = this.peerManager.isConnected();

    menu.addItem((item) =>
      item
        .setTitle(isConnected ? t('common.disconnect') : t('common.connect'))
        .setIcon(isConnected ? 'unlink' : 'link')
        .onClick(async () => {
          await this.onToggleConnection();
          this.updateConnectionStatus();
        })
    );

    if (e instanceof MouseEvent) {
      menu.showAtMouseEvent(e);
    } else {
      // For keyboard events, show at the target element
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }
  }

  private updateConnectionStatus(): void {
    if (!this.statusEl) return;
    this.statusEl.empty();
    const isConnected = this.peerManager.isConnected();
    this.statusEl.createSpan({ cls: `p2p-share-status-dot ${isConnected ? 'connected' : 'disconnected'}` });
    this.statusEl.createSpan({ text: isConnected ? t('common.connected') : t('common.disconnected') });
  }

  private updateDisplayName(): void {
    if (!this.displayNameEl) return;
    this.displayNameEl.empty();
    const displayName = this.peerManager.getDisplayName();
    if (displayName) {
      this.displayNameEl.setText(t('peer-modal.you-appear-as', displayName));
    }
  }

  private renderPeers(): void {
    if (!this.peersContainer) return;
    this.peersContainer.empty();

    const isConnected = this.peerManager.isConnected();
    const peers = this.peerManager.getPeers();

    // Don't show peers if not connected
    if (!isConnected) {
      const emptyState = this.peersContainer.createDiv({ cls: 'p2p-share-empty-state' });
      emptyState.createEl('p', { text: t('peer-modal.disconnected.title') });
      emptyState.createEl('p', {
        text: t('peer-modal.disconnected.hint'),
        cls: 'p2p-share-hint',
      });
      return;
    }

    if (peers.length === 0) {
      const emptyState = this.peersContainer.createDiv({ cls: 'p2p-share-empty-state' });
      emptyState.createEl('p', { text: t('peer-modal.empty.title') });
      emptyState.createEl('p', {
        text: t('peer-modal.empty.hint'),
        cls: 'p2p-share-hint',
      });
      return;
    }

    for (const peer of peers) {
      this.renderPeerItem(peer);
    }
  }

  private renderPeerItem(peer: PeerInfo): void {
    if (!this.peersContainer) return;

    // Check if this peer is paired (connected via secret room)
    const peerDisplayName = peer.name.displayName || peer.name.deviceName || 'Unknown';
    const roomSecret = this.peerManager.getRoomSecretForPeer(peer.id);
    const isPaired = roomSecret !== null; // Peer is paired if it has a roomSecret

    const item = this.peersContainer.createDiv({
      cls: 'p2p-share-peer-item',
      attr: {
        tabindex: '0',
        role: 'button',
        'aria-label': `Share with ${peerDisplayName}`
      }
    });

    const selectPeer = () => {
      this.onSelect(peer.id);
      this.close();
    };

    item.onclick = selectPeer;
    item.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPeer();
      }
    };

    // Icon
    const iconContainer = item.createDiv({ cls: 'p2p-share-peer-icon' });
    const iconName = this.getDeviceIcon(peer.name.type);
    setIcon(iconContainer, iconName);

    // Info
    const info = item.createDiv({ cls: 'p2p-share-peer-info' });
    info.createDiv({ cls: 'p2p-share-peer-name', text: peerDisplayName });
    const details = [peer.name.os, peer.name.browser].filter(Boolean).join(' • ') || 'Unknown device';
    info.createDiv({
      cls: 'p2p-share-peer-details',
      text: details,
    });

    // Badges container
    const badges = item.createDiv({ cls: 'p2p-share-peer-badges' });

    // Paired indicator
    if (isPaired) {
      const pairedBadge = badges.createDiv({ cls: 'p2p-share-paired-badge' });
      setIcon(pairedBadge, 'link');
      pairedBadge.title = t('peer-modal.paired-tooltip');
    }

    // RTC indicator
    if (peer.rtcSupported) {
      const rtcBadge = badges.createDiv({ cls: 'p2p-share-rtc-badge', text: t('peer-modal.p2p-badge') });
      rtcBadge.title = t('peer-modal.p2p-tooltip');
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
