import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import type P2PSharePlugin from './main';
import type { PairedDevice } from './types';
import type { LogLevel } from './logger';
import { ConfirmModal } from './modals';
import { FolderSuggest } from './folder-suggest';
import { t } from './i18n';

export class P2PShareSettingTab extends PluginSettingTab {
  plugin: P2PSharePlugin;

  constructor(app: App, plugin: P2PSharePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: t('settings.title') });

    // Server Configuration
    containerEl.createEl('h3', { text: t('settings.server.title') });

    new Setting(containerEl)
      .setName(t('settings.server.url.name'))
      .setDesc(t('settings.server.url.desc'))
      .addText((text) =>
        text
          .setPlaceholder(t('settings.server.url.placeholder'))
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (value) => {
            this.plugin.settings.serverUrl = value;
            await this.plugin.saveSettings();
          })
      );

    // File Settings
    containerEl.createEl('h3', { text: t('settings.files.title') });

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

    // Discovery Settings
    containerEl.createEl('h3', { text: t('settings.discovery.title') });

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

    // Behavior Settings
    containerEl.createEl('h3', { text: t('settings.behavior.title') });

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

    // Connection Status
    containerEl.createEl('h3', { text: t('settings.connection.title') });

    const statusContainer = containerEl.createDiv({ cls: 'p2p-share-status' });
    const statusText = statusContainer.createSpan({
      text: this.plugin.isConnected() ? t('common.connected') : t('common.disconnected'),
      cls: this.plugin.isConnected() ? 'p2p-share-status-connected' : 'p2p-share-status-disconnected'
    });

    new Setting(containerEl)
      .setName(t('settings.connection.reconnect.name'))
      .setDesc(t('settings.connection.reconnect.desc'))
      .addButton((button) =>
        button
          .setButtonText(t('settings.connection.reconnect.button'))
          .onClick(async () => {
            await this.plugin.reconnect();
            statusText.setText(this.plugin.isConnected() ? t('common.connected') : t('common.disconnected'));
            statusText.className = this.plugin.isConnected()
              ? 'p2p-share-status-connected'
              : 'p2p-share-status-disconnected';
          })
      );

    // Paired Devices Section
    containerEl.createEl('h3', { text: t('settings.paired-devices.title') });

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
      text: t('settings.paired-devices.paired-at', this.formatDate(device.pairedAt)),
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
}
