import { App, PluginSettingTab, Setting } from 'obsidian';
import type PeerDropPlugin from './main';
import type { PeerDropSettings } from './types';

export class PeerDropSettingTab extends PluginSettingTab {
  plugin: PeerDropPlugin;

  constructor(app: App, plugin: PeerDropPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'PeerDrop Settings' });

    // Server Configuration
    containerEl.createEl('h3', { text: 'Server Configuration' });

    // Server requirement notice
    const noticeEl = containerEl.createDiv({ cls: 'peerdrop-server-notice' });
    noticeEl.createEl('p', {
      text: 'PeerDrop requires a self-hosted PairDrop server. The public pairdrop.net does not accept external WebSocket connections.',
      cls: 'peerdrop-notice-text'
    });
    const linkEl = noticeEl.createEl('p');
    linkEl.createEl('a', {
      text: 'Learn how to host your own PairDrop server',
      href: 'https://github.com/schlagmichdoch/PairDrop/blob/master/docs/host-your-own.md'
    });

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
      .addText((text) =>
        text
          .setPlaceholder('PeerDrop')
          .setValue(this.plugin.settings.saveLocation)
          .onChange(async (value) => {
            this.plugin.settings.saveLocation = value;
            await this.plugin.saveSettings();
          })
      );

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

    // Connection Status
    containerEl.createEl('h3', { text: 'Connection Status' });

    const statusContainer = containerEl.createDiv({ cls: 'peerdrop-status' });
    const statusText = statusContainer.createSpan({
      text: this.plugin.isConnected() ? 'Connected' : 'Disconnected',
      cls: this.plugin.isConnected() ? 'peerdrop-status-connected' : 'peerdrop-status-disconnected'
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
              ? 'peerdrop-status-connected'
              : 'peerdrop-status-disconnected';
          })
      );
  }
}
