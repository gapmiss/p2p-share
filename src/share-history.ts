import { Events, normalizePath } from 'obsidian';
import type { ShareHistoryEntry, ShareHistoryFile, ShareHistoryDirection, ShareHistoryStatus, ShareHistorySettings } from './types';
import { logger } from './logger';

/**
 * Manages share history tracking and persistence
 */
export class ShareHistory extends Events {
  private entries: ShareHistoryEntry[] = [];
  private settings: ShareHistorySettings;
  private dataFilePath: string;
  private app: any; // Obsidian App type

  constructor(app: any, dataFilePath: string, settings: ShareHistorySettings) {
    super();
    this.app = app;
    this.dataFilePath = dataFilePath;
    this.settings = settings;
  }

  /**
   * Load history from disk
   */
  async load(): Promise<void> {
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(this.dataFilePath)) {
        const data = await adapter.read(this.dataFilePath);
        const parsed = JSON.parse(data);
        this.entries = parsed.entries || [];
        logger.debug(`Loaded ${this.entries.length} history entries from ${this.dataFilePath}`);

        // Clean up old entries based on retention policy
        await this.cleanupOldEntries();
      } else {
        logger.debug('No history file found, starting fresh');
        this.entries = [];
      }
    } catch (error) {
      logger.error('Failed to load history:', error);
      this.entries = [];
    }
  }

  /**
   * Save history to disk
   */
  async save(): Promise<void> {
    try {
      const adapter = this.app.vault.adapter;
      const data = JSON.stringify({ entries: this.entries }, null, 2);

      // Ensure the parent directory exists
      const dir = this.dataFilePath.substring(0, this.dataFilePath.lastIndexOf('/'));
      if (!(await adapter.exists(dir))) {
        await adapter.mkdir(dir);
      }

      await adapter.write(this.dataFilePath, data);
      logger.debug(`Saved ${this.entries.length} history entries to ${this.dataFilePath}`);
    } catch (error) {
      logger.error('Failed to save history:', error);
    }
  }

  /**
   * Update settings and trigger cleanup if retention policy changed
   */
  async updateSettings(settings: ShareHistorySettings): Promise<void> {
    const oldRetention = this.settings.retentionDays;
    this.settings = settings;

    // If retention policy changed, clean up old entries
    if (oldRetention !== settings.retentionDays) {
      await this.cleanupOldEntries();
    }
  }

  /**
   * Add a new history entry
   */
  async addEntry(
    direction: ShareHistoryDirection,
    peerName: string,
    peerOs: string | undefined,
    peerApp: string | undefined,
    peerDeviceType: string | undefined,
    isPaired: boolean,
    files: ShareHistoryFile[],
    status: ShareHistoryStatus,
    error?: string,
    duration?: number
  ): Promise<void> {
    if (!this.settings.enabled) {
      return; // History tracking disabled
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const entry: ShareHistoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      direction,
      peerName,
      peerOs,
      peerApp,
      peerDeviceType,
      isPaired,
      files,
      totalSize,
      status,
      error,
      duration,
    };

    this.entries.unshift(entry); // Add to beginning (most recent first)
    await this.save();
    this.trigger('history-updated');

    logger.debug('Added history entry:', entry.id, direction, peerName, files.length, 'files');
  }

  /**
   * Get all history entries (most recent first)
   */
  getEntries(): ShareHistoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by direction, peer, or date range
   */
  filterEntries(filters: {
    direction?: ShareHistoryDirection;
    peerName?: string;
    status?: ShareHistoryStatus;
    startDate?: number;
    endDate?: number;
    searchTerm?: string;
  }): ShareHistoryEntry[] {
    let filtered = [...this.entries];

    if (filters.direction) {
      filtered = filtered.filter(e => e.direction === filters.direction);
    }

    if (filters.peerName) {
      filtered = filtered.filter(e =>
        e.peerName.toLowerCase().includes(filters.peerName!.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.peerName.toLowerCase().includes(term) ||
        e.files.some(f => f.name.toLowerCase().includes(term)) ||
        (e.peerOs && e.peerOs.toLowerCase().includes(term)) ||
        (e.peerApp && e.peerApp.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  /**
   * Delete a specific entry by ID
   */
  async deleteEntry(id: string): Promise<void> {
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entries.splice(index, 1);
      await this.save();
      this.trigger('history-updated');
      logger.debug('Deleted history entry:', id);
    }
  }

  /**
   * Clear all history
   */
  async clearAll(): Promise<void> {
    this.entries = [];
    await this.save();
    this.trigger('history-updated');
    logger.info('Cleared all history');
  }

  /**
   * Export history as JSON
   */
  exportAsJson(): string {
    return JSON.stringify({ entries: this.entries }, null, 2);
  }

  /**
   * Import history from JSON
   */
  async importFromJson(json: string): Promise<{ success: boolean; imported: number; errors: number }> {
    try {
      const data = JSON.parse(json);
      const entries = data.entries || [];

      let imported = 0;
      let errors = 0;

      for (const entry of entries) {
        // Validate entry has required fields
        if (entry.id && entry.timestamp && entry.direction && entry.peerName && entry.files) {
          // Check for duplicates by ID
          if (!this.entries.find(e => e.id === entry.id)) {
            this.entries.push(entry);
            imported++;
          }
        } else {
          errors++;
        }
      }

      // Sort by timestamp (most recent first)
      this.entries.sort((a, b) => b.timestamp - a.timestamp);

      await this.save();
      this.trigger('history-updated');

      logger.info(`Imported ${imported} entries, ${errors} errors`);
      return { success: true, imported, errors };
    } catch (error) {
      logger.error('Failed to import history:', error);
      return { success: false, imported: 0, errors: 0 };
    }
  }

  /**
   * Get statistics about transfer history
   */
  getStatistics(): {
    totalTransfers: number;
    totalSent: number;
    totalReceived: number;
    totalBytesSent: number;
    totalBytesReceived: number;
    successRate: number;
    topPeers: { name: string; count: number }[];
  } {
    const sent = this.entries.filter(e => e.direction === 'sent');
    const received = this.entries.filter(e => e.direction === 'received');
    const completed = this.entries.filter(e => e.status === 'completed');

    const totalBytesSent = sent.reduce((sum, e) => sum + e.totalSize, 0);
    const totalBytesReceived = received.reduce((sum, e) => sum + e.totalSize, 0);

    // Count transfers per peer
    const peerCounts = new Map<string, number>();
    for (const entry of this.entries) {
      peerCounts.set(entry.peerName, (peerCounts.get(entry.peerName) || 0) + 1);
    }

    const topPeers = Array.from(peerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTransfers: this.entries.length,
      totalSent: sent.length,
      totalReceived: received.length,
      totalBytesSent,
      totalBytesReceived,
      successRate: this.entries.length > 0 ? completed.length / this.entries.length : 0,
      topPeers,
    };
  }

  /**
   * Clean up entries older than retention period
   */
  private async cleanupOldEntries(): Promise<void> {
    if (this.settings.retentionDays === 0) {
      return; // Keep forever
    }

    const cutoffDate = Date.now() - (this.settings.retentionDays * 24 * 60 * 60 * 1000);
    const before = this.entries.length;
    this.entries = this.entries.filter(e => e.timestamp >= cutoffDate);
    const removed = before - this.entries.length;

    if (removed > 0) {
      await this.save();
      this.trigger('history-updated');
      logger.info(`Cleaned up ${removed} old history entries (retention: ${this.settings.retentionDays} days)`);
    }
  }

  /**
   * Generate a unique ID for history entries
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
