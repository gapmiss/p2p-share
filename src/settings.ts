import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import type P2PSharePlugin from './main';
import type { PairedDevice } from './types';
import type { LogLevel } from './logger';
import { ConfirmModal } from './modals';
import { FolderSuggest } from './folder-suggest';

export class P2PShareSettingTab extends PluginSettingTab {
  plugin: P2PSharePlugin;

  constructor(app: App, plugin: P2PSharePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'P2P Share Settings' });

    // Server Configuration
    containerEl.createEl('h3', { text: 'Server Configuration' });

    new Setting(containerEl)
      .setName('Signaling server URL')
      .setDesc('WebSocket URL for your self-hosted PairDrop server (e.g., wss://your-server.com or ws://localhost:3000)')
      .addText((text) =>
        text
          .setPlaceholder('wss://your-pairdrop-server.com')
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (value) => {
            this.plugin.settings.serverUrl = value;
            await this.plugin.saveSettings();
          })
      );

    // File Settings
    containerEl.createEl('h3', { text: 'File Settings' });

    new Setting(containerEl)
      .setName('Save location')
      .setDesc('Folder in your vault where received files will be saved')
      .addText((text) => {
        text
          .setPlaceholder('P2P Share')
          .setValue(this.plugin.settings.saveLocation)
          .onChange(async (value) => {
            this.plugin.settings.saveLocation = value;
            await this.plugin.saveSettings();
          });

        // Add folder suggest
        new FolderSuggest(this.app, text.inputEl);
      });

    // Discovery Settings
    containerEl.createEl('h3', { text: 'Discovery Settings' });

    new Setting(containerEl)
      .setName('Discovery mode')
      .setDesc('How to discover other peers')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', 'Auto-discover on network')
          .addOption('paired-only', 'Paired devices only')
          .setValue(this.plugin.settings.discoveryMode)
          .onChange(async (value: 'auto' | 'paired-only') => {
            this.plugin.settings.discoveryMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Device name')
      .setDesc('Custom name for this device (leave empty for auto-generated)')
      .addText((text) =>
        text
          .setPlaceholder('Auto-generated')
          .setValue(this.plugin.settings.deviceName)
          .onChange(async (value) => {
            this.plugin.settings.deviceName = value;
            await this.plugin.saveSettings();
          })
      );

    // Behavior Settings
    containerEl.createEl('h3', { text: 'Behavior' });

    new Setting(containerEl)
      .setName('Auto-accept from paired devices')
      .setDesc('Automatically accept incoming files from paired devices')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoAcceptFromPaired)
          .onChange(async (value) => {
            this.plugin.settings.autoAcceptFromPaired = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show notifications')
      .setDesc('Show notifications for incoming transfers')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNotifications)
          .onChange(async (value) => {
            this.plugin.settings.showNotifications = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Log level')
      .setDesc('Console log verbosity for debugging')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('none', 'None')
          .addOption('error', 'Errors only')
          .addOption('warn', 'Warnings & errors')
          .addOption('info', 'Info')
          .addOption('debug', 'Debug (verbose)')
          .setValue(this.plugin.settings.logLevel)
          .onChange(async (value: LogLevel) => {
            this.plugin.settings.logLevel = value;
            await this.plugin.saveSettings();
          })
      );

    // Connection Status
    containerEl.createEl('h3', { text: 'Connection Status' });

    const statusContainer = containerEl.createDiv({ cls: 'p2p-share-status' });
    const statusText = statusContainer.createSpan({
      text: this.plugin.isConnected() ? 'Connected' : 'Disconnected',
      cls: this.plugin.isConnected() ? 'p2p-share-status-connected' : 'p2p-share-status-disconnected'
    });

    new Setting(containerEl)
      .setName('Reconnect')
      .setDesc('Manually reconnect to the signaling server')
      .addButton((button) =>
        button
          .setButtonText('Reconnect')
          .onClick(async () => {
            await this.plugin.reconnect();
            statusText.setText(this.plugin.isConnected() ? 'Connected' : 'Disconnected');
            statusText.className = this.plugin.isConnected()
              ? 'p2p-share-status-connected'
              : 'p2p-share-status-disconnected';
          })
      );

    // Paired Devices Section
    containerEl.createEl('h3', { text: 'Paired Devices' });

    const pairedDevices = this.plugin.settings.pairedDevices;

    if (pairedDevices.length === 0) {
      const emptyState = containerEl.createDiv({ cls: 'p2p-share-paired-empty' });
      emptyState.createEl('p', {
        text: 'No paired devices. Use "Pair with device" command to pair across networks.',
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
          .setName('Remove all paired devices')
          .setDesc('This will unpair all devices')
          .addButton((button) =>
            button
              .setButtonText('Remove All')
              .setWarning()
              .onClick(() => {
                new ConfirmModal(
                  this.app,
                  'Remove All Paired Devices',
                  `Are you sure you want to remove all ${pairedDevices.length} paired devices? You will need to pair again with each device.`,
                  async () => {
                    for (const device of [...this.plugin.settings.pairedDevices]) {
                      await this.plugin.removePairedDevice(device.roomSecret);
                    }
                    this.display(); // Refresh
                  }
                ).open();
              })
          );
      }
    }
  }

  private renderPairedDevice(container: HTMLElement, device: PairedDevice): void {
    const item = container.createDiv({ cls: 'p2p-share-paired-item' });

    const info = item.createDiv({ cls: 'p2p-share-paired-info' });
    const iconEl = info.createDiv({ cls: 'p2p-share-paired-icon' });
    setIcon(iconEl, 'smartphone');

    const details = info.createDiv({ cls: 'p2p-share-paired-details' });
    details.createDiv({ cls: 'p2p-share-paired-name', text: device.displayName });
    details.createDiv({
      cls: 'p2p-share-paired-date',
      text: `Paired ${this.formatDate(device.pairedAt)}`,
    });

    const removeBtn = item.createEl('button', {
      cls: 'p2p-share-paired-remove',
      attr: { 'aria-label': 'Remove pairing' },
    });
    setIcon(removeBtn, 'x');
    removeBtn.onclick = () => {
      new ConfirmModal(
        this.app,
        'Remove Paired Device',
        `Are you sure you want to remove "${device.displayName}"? You will need to pair again to share files with this device.`,
        async () => {
          await this.plugin.removePairedDevice(device.roomSecret);
          this.display(); // Refresh
        }
      ).open();
    };
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
