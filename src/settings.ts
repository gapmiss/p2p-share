import { App, Notice, PluginSettingTab, Setting, setIcon } from 'obsidian';
import type P2PSharePlugin from './main';
import type { PairedDevice } from './types';
import type { LogLevel } from './logger';
import { ConfirmModal } from './modals';
import { FolderSuggest } from './folder-suggest';
import { t } from './i18n';

export class P2PShareSettingTab extends PluginSettingTab {
  plugin: P2PSharePlugin;
  private boundRefreshHandler = this.refreshDisplay.bind(this);
  private boundUpdateConnectionStatus = this.updateConnectionStatus.bind(this);
  private statusIconEl: HTMLElement | null = null;
  private statusTextEl: HTMLElement | null = null;
  private connectionButton: HTMLButtonElement | null = null;

  constructor(app: App, plugin: P2PSharePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private refreshDisplay(): void {
    this.display();
  }

  private updateConnectionStatus(): void {
    const isConnected = this.plugin.isConnected();

    // Update status icon
    if (this.statusIconEl) {
      this.statusIconEl.empty();
      setIcon(this.statusIconEl, isConnected ? 'link' : 'unlink');
      this.statusIconEl.style.color = isConnected ? 'var(--text-success)' : 'var(--text-error)';
    }

    // Update status text
    if (this.statusTextEl) {
      this.statusTextEl.setText(isConnected ? t('common.connected') : t('common.disconnected'));
      this.statusTextEl.className = isConnected
        ? 'p2p-share-status-connected'
        : 'p2p-share-status-disconnected';
    }

    // Update button text
    if (this.connectionButton) {
      this.connectionButton.setText(isConnected ? t('common.disconnect') : t('common.connect'));
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Listen for paired device changes and refresh the display
    if (this.plugin.peerManager) {
      // Remove previous listeners first to avoid duplicates
      this.plugin.peerManager.off('secret-room-deleted', this.boundRefreshHandler);
      this.plugin.peerManager.off('paired-device-identified', this.boundRefreshHandler);
      this.plugin.peerManager.off('server-connected', this.boundUpdateConnectionStatus);
      this.plugin.peerManager.off('server-disconnected', this.boundUpdateConnectionStatus);

      // Add new listeners
      this.plugin.peerManager.on('secret-room-deleted', this.boundRefreshHandler);
      this.plugin.peerManager.on('paired-device-identified', this.boundRefreshHandler);
      this.plugin.peerManager.on('server-connected', this.boundUpdateConnectionStatus);
      this.plugin.peerManager.on('server-disconnected', this.boundUpdateConnectionStatus);
    }

    // Connection & Server
    new Setting(containerEl)
      .setHeading()
      .setName(t('settings.server.title'));

    new Setting(containerEl)
      .setName(t('settings.server.url.name'))
      .setDesc(t('settings.server.url.desc'))
      .addText((text) =>
        text
          .setPlaceholder(t('settings.server.url.placeholder'))
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (value) => {
            // Validate WebSocket URL format
            const trimmed = value.trim();
            if (trimmed && !this.isValidWebSocketUrl(trimmed)) {
              new Notice('Invalid server URL. Must start with ws:// or wss://');
              return;
            }
            this.plugin.settings.serverUrl = trimmed;
            await this.plugin.saveSettings();
          })
      );

    const statusContainer = containerEl.createDiv({ cls: 'p2p-share-status' });

    // Status icon (link/unlink)
    this.statusIconEl = statusContainer.createDiv({ cls: 'p2p-share-status-icon' });
    const isConnected = this.plugin.isConnected();
    setIcon(this.statusIconEl, isConnected ? 'link' : 'unlink');
    this.statusIconEl.style.color = isConnected ? 'var(--text-success)' : 'var(--text-error)';

    // Status text
    this.statusTextEl = statusContainer.createSpan({
      text: isConnected ? t('common.connected') : t('common.disconnected'),
      cls: isConnected ? 'p2p-share-status-connected' : 'p2p-share-status-disconnected'
    });

    new Setting(containerEl)
      .setName(t('settings.connection.reconnect.name'))
      .setDesc(t('settings.connection.reconnect.desc'))
      .addButton((button) => {
        this.connectionButton = button.buttonEl;
        button
          .setButtonText(isConnected ? t('common.disconnect') : t('common.connect'))
          .onClick(async () => {
            await this.plugin.toggleConnection();
            // Status will update automatically via event listener
          });
      });

    new Setting(containerEl)
      .setName(t('settings.behavior.auto-connect.name'))
      .setDesc(t('settings.behavior.auto-connect.desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoConnect)
          .onChange(async (value) => {
            this.plugin.settings.autoConnect = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('settings.discovery.mode.name'))
      .setDesc(t('settings.discovery.mode.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', t('settings.discovery.mode.auto'))
          .addOption('paired-only', t('settings.discovery.mode.paired-only'))
          .setValue(this.plugin.settings.discoveryMode)
          .onChange(async (value: 'auto' | 'paired-only') => {
            this.plugin.settings.discoveryMode = value;
            await this.plugin.saveSettings();
            // Switch rooms by reconnecting if currently connected
            if (this.plugin.isConnected()) {
              await this.plugin.peerManager?.switchDiscoveryMode(value);
            }
          })
      );

    // Paired Devices
    new Setting(containerEl)
      .setHeading()
      .setName(t('settings.paired-devices.title'));

    // Add "Pair with device" button
    new Setting(containerEl)
      .setName(t('command.pair-device'))
      .setDesc(t('pairing-modal.description'))
      .addButton((button) =>
        button
          .setButtonText(t('command.pair-device'))
          .setIcon('link')
          .onClick(() => {
            // Open pairing modal
            this.plugin.showPairingModal();
          })
      );

    const pairedDevices = this.plugin.settings.pairedDevices;

    if (pairedDevices.length === 0) {
      const emptyState = containerEl.createDiv({ cls: 'p2p-share-paired-empty' });
      emptyState.createEl('p', {
        text: t('settings.paired-devices.empty'),
        cls: 'p2p-share-paired-empty-text',
      });
    } else {
      const pairedList = containerEl.createDiv({ cls: 'p2p-share-paired-list' });

      for (const device of pairedDevices) {
        this.renderPairedDevice(pairedList, device);
      }

      // Add "Remove all" button if there are multiple devices
      if (pairedDevices.length > 1) {
        new Setting(containerEl)
          .setName(t('settings.paired-devices.remove-all.name'))
          .setDesc(t('settings.paired-devices.remove-all.desc'))
          .addButton((button) =>
            button
              .setButtonText(t('settings.paired-devices.remove-all.button'))
              .setWarning()
              .onClick(() => {
                new ConfirmModal(
                  this.app,
                  t('settings.paired-devices.remove-all-confirm.title'),
                  t('settings.paired-devices.remove-all-confirm.message', pairedDevices.length),
                  async () => {
                    for (const device of [...this.plugin.settings.pairedDevices]) {
                      await this.plugin.removePairedDevice(device.roomSecret);
                    }
                    this.display(); // Refresh
                  },
                  t('confirm-modal.remove')
                ).open();
              })
          );
      }
    }

    // Files & Behavior
    new Setting(containerEl)
      .setHeading()
      .setName(t('settings.files.title'));

    new Setting(containerEl)
      .setName(t('settings.files.location.name'))
      .setDesc(t('settings.files.location.desc'))
      .addSearch((search) => {
        search
          .setPlaceholder(t('settings.files.location.placeholder'))
          .setValue(this.plugin.settings.saveLocation)
          .onChange(async (value) => {
            this.plugin.settings.saveLocation = value;
            await this.plugin.saveSettings();
          });

        // Add folder suggest
        new FolderSuggest(this.app, search.inputEl);
      });

    new Setting(containerEl)
      .setName(t('settings.behavior.system-notifications.name'))
      .setDesc(t('settings.behavior.system-notifications.desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useSystemNotifications)
          .onChange(async (value) => {
            this.plugin.settings.useSystemNotifications = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('settings.behavior.log-level.name'))
      .setDesc(t('settings.behavior.log-level.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('none', t('settings.behavior.log-level.none'))
          .addOption('error', t('settings.behavior.log-level.error'))
          .addOption('warn', t('settings.behavior.log-level.warn'))
          .addOption('info', t('settings.behavior.log-level.info'))
          .addOption('debug', t('settings.behavior.log-level.debug'))
          .setValue(this.plugin.settings.logLevel)
          .onChange(async (value: LogLevel) => {
            this.plugin.settings.logLevel = value;
            await this.plugin.saveSettings();
          })
      );

    // Share History
    new Setting(containerEl)
      .setHeading()
      .setName('Share history');

    new Setting(containerEl)
      .setName('Enable history tracking')
      .setDesc('Track sent and received file transfers in the history sidebar')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.history.enabled)
          .onChange(async (value) => {
            this.plugin.settings.history.enabled = value;
            await this.plugin.saveSettings();
            if (this.plugin.shareHistory) {
              await this.plugin.shareHistory.updateSettings(this.plugin.settings.history);
            }
          })
      );

    new Setting(containerEl)
      .setName('History retention')
      .setDesc('How long to keep transfer history (0 = keep forever)')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('0', 'Forever')
          .addOption('7', '7 days')
          .addOption('30', '30 days')
          .addOption('90', '90 days')
          .addOption('180', '180 days')
          .addOption('365', '1 year')
          .setValue(this.plugin.settings.history.retentionDays.toString())
          .onChange(async (value) => {
            this.plugin.settings.history.retentionDays = parseInt(value);
            await this.plugin.saveSettings();
            if (this.plugin.shareHistory) {
              await this.plugin.shareHistory.updateSettings(this.plugin.settings.history);
            }
          })
      );

    new Setting(containerEl)
      .setName('Open history sidebar')
      .setDesc('View your transfer history')
      .addButton((button) =>
        button
          .setButtonText('Open history')
          .onClick(() => {
            this.app.workspace.getRightLeaf(false)?.setViewState({
              type: 'p2p-share-history',
              active: true,
            });
          })
      );

    new Setting(containerEl)
      .setName('Clear all history')
      .setDesc('Permanently delete all transfer history')
      .addButton((button) =>
        button
          .setButtonText('Clear history')
          .setWarning()
          .onClick(() => {
            new ConfirmModal(
              this.app,
              'Clear all history?',
              'This will permanently delete all transfer history. This cannot be undone.',
              async () => {
                if (this.plugin.shareHistory) {
                  await this.plugin.shareHistory.clearAll();
                  new Notice('History cleared');
                }
              },
              'Clear'
            ).open();
          })
      );
  }

  private renderPairedDevice(container: HTMLElement, device: PairedDevice): void {
    const item = container.createDiv({ cls: 'p2p-share-paired-item' });

    const info = item.createDiv({ cls: 'p2p-share-paired-info' });

    const details = info.createDiv({ cls: 'p2p-share-paired-details' });
    details.createDiv({ cls: 'p2p-share-paired-name', text: device.displayName });
    details.createDiv({
      cls: 'p2p-share-paired-date',
      text: t('settings.paired-devices.paired-at', new Date(device.pairedAt).toLocaleString()),
    });

    const controls = item.createDiv({ cls: 'p2p-share-paired-controls' });

    // Auto-accept toggle
    new Setting(controls)
      .setName(t('settings.paired-devices.auto-accept.name'))
      .setDesc(t('settings.paired-devices.auto-accept.desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(device.autoAccept)
          .onChange(async (value) => {
            await this.plugin.updatePairedDeviceAutoAccept(device.roomSecret, value);
            this.display(); // Refresh
          })
      );

    const removeBtn = item.createEl('button', {
      cls: 'p2p-share-paired-remove',
      attr: { 'aria-label': t('settings.paired-devices.remove.label') },
    });
    setIcon(removeBtn, 'x');
    removeBtn.onclick = () => {
      new ConfirmModal(
        this.app,
        t('settings.paired-devices.remove-confirm.title'),
        t('settings.paired-devices.remove-confirm.message', device.displayName),
        async () => {
          await this.plugin.removePairedDevice(device.roomSecret);
          this.display(); // Refresh
        },
        t('confirm-modal.remove')
      ).open();
    };
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('date.today');
    } else if (diffDays === 1) {
      return t('date.yesterday');
    } else if (diffDays < 7) {
      return t('date.days-ago', diffDays);
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Validate that a URL is a valid WebSocket URL
   */
  private isValidWebSocketUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    } catch {
      return false;
    }
  }

  hide(): void {
    // Clean up event listeners when settings tab is closed
    if (this.plugin.peerManager) {
      this.plugin.peerManager.off('secret-room-deleted', this.boundRefreshHandler);
      this.plugin.peerManager.off('paired-device-identified', this.boundRefreshHandler);
      this.plugin.peerManager.off('server-connected', this.boundUpdateConnectionStatus);
      this.plugin.peerManager.off('server-disconnected', this.boundUpdateConnectionStatus);
    }
    this.statusIconEl = null;
    this.statusTextEl = null;
    this.connectionButton = null;
  }
}
