import { ItemView, WorkspaceLeaf, Menu, Notice, TFile, setIcon } from 'obsidian';
import type { ShareHistoryEntry, ShareHistoryDirection, ShareHistoryStatus } from '../types';
import type { ShareHistory } from '../share-history';
import type P2PSharePlugin from '../main';
import { t } from '../i18n';
import { ConfirmModal } from '../modals/confirm-modal';
import { StatisticsModal } from '../modals/statistics-modal';

export const SHARE_HISTORY_VIEW_TYPE = 'p2p-share-history';

/**
 * Time period for grouping history entries
 */
type TimePeriod = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older';

/**
 * Grouped history entries by time period
 */
interface GroupedEntries {
  period: TimePeriod;
  label: string;
  entries: ShareHistoryEntry[];
}

/**
 * Share history sidebar view
 */
export class ShareHistoryView extends ItemView {
  private plugin: P2PSharePlugin;
  private history: ShareHistory;
  private searchTerm: string = '';
  private filterDirection: ShareHistoryDirection | 'all' = 'all';
  private filterStatus: ShareHistoryStatus | 'all' = 'all';
  private expandedEntries: Set<string> = new Set();
  private expandedGroups: Set<TimePeriod> = new Set(['today', 'yesterday']);

  // DOM element references
  private headerContainer: HTMLElement | null = null;
  private entriesContainer: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: P2PSharePlugin, history: ShareHistory) {
    super(leaf);
    this.plugin = plugin;
    this.history = history;

    // Listen for history updates
    this.registerEvent(
      this.history.on('history-updated', () => {
        this.render();
      })
    );
  }

  getViewType(): string {
    return SHARE_HISTORY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Share History';
  }

  getIcon(): string {
    return 'clock';
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Render the entire view
   */
  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('p2p-share-history-view');

    // Header
    this.headerContainer = container.createDiv();
    this.renderHeader(this.headerContainer);

    // Search and filters
    this.renderSearchAndFilters(container);

    // History entries container
    this.entriesContainer = container.createDiv();
    this.renderEntriesContent();
  }

  /**
   * Re-render only the header (for filter indicators)
   */
  private updateHeader(): void {
    if (!this.headerContainer) return;
    this.headerContainer.empty();
    this.renderHeader(this.headerContainer);
  }

  /**
   * Re-render only the entries (for search/filter changes)
   */
  private updateEntries(): void {
    if (!this.entriesContainer) return;
    this.entriesContainer.empty();
    this.renderEntriesContent();
  }

  /**
   * Render the header with title and action buttons
   */
  private renderHeader(container: HTMLElement): void {
    const header = container.createDiv({ cls: 'p2p-share-history-header' });

    const titleContainer = header.createDiv({ cls: 'p2p-share-history-title-container' });
    titleContainer.createEl('h4', { text: 'Share History', cls: 'p2p-share-history-title' });

    // Show active filters
    if (this.filterDirection !== 'all' || this.filterStatus !== 'all') {
      const filtersText: string[] = [];
      if (this.filterDirection !== 'all') {
        filtersText.push(this.filterDirection.charAt(0).toUpperCase() + this.filterDirection.slice(1));
      }
      if (this.filterStatus !== 'all') {
        filtersText.push(this.filterStatus.charAt(0).toUpperCase() + this.filterStatus.slice(1));
      }
      titleContainer.createSpan({
        text: ` (${filtersText.join(', ')})`,
        cls: 'p2p-share-history-filter-indicator'
      });
    }

    const actions = header.createDiv({ cls: 'p2p-share-history-actions' });

    // Refresh button
    const refreshBtn = actions.createDiv({
      cls: 'clickable-icon p2p-share-history-action-btn',
      attr: { 'aria-label': 'Refresh', title: 'Refresh' }
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.onclick = () => this.render();

    // Menu button (settings, clear, export/import)
    const menuBtn = actions.createDiv({
      cls: 'clickable-icon p2p-share-history-action-btn',
      attr: { 'aria-label': 'Options', title: 'Options' }
    });
    setIcon(menuBtn, 'more-vertical');
    menuBtn.onclick = (e) => this.showOptionsMenu(e);
  }

  /**
   * Render search and filter controls
   */
  private renderSearchAndFilters(container: HTMLElement): void {
    const filtersContainer = container.createDiv({ cls: 'p2p-share-history-filters' });

    // Search input
    const searchContainer = filtersContainer.createDiv({ cls: 'p2p-share-history-search' });
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Search files, peers...',
      value: this.searchTerm,
      cls: 'p2p-share-history-search-input'
    });
    searchInput.oninput = (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.updateEntries(); // Only update entries, not the whole view
    };
  }

  /**
   * Render history entries grouped by time period
   */
  private renderEntriesContent(): void {
    if (!this.entriesContainer) return;
    const entriesContainer = this.entriesContainer.createDiv({ cls: 'p2p-share-history-entries' });

    // Get filtered entries
    let entries = this.history.filterEntries({
      direction: this.filterDirection === 'all' ? undefined : this.filterDirection,
      status: this.filterStatus === 'all' ? undefined : this.filterStatus,
      searchTerm: this.searchTerm || undefined
    });

    if (entries.length === 0) {
      this.renderEmptyState(entriesContainer);
      return;
    }

    // Group entries by time period
    const grouped = this.groupEntriesByTime(entries);

    // Render each group
    for (const group of grouped) {
      if (group.entries.length === 0) continue;
      this.renderGroup(entriesContainer, group);
    }
  }

  /**
   * Render empty state when no entries match filters
   */
  private renderEmptyState(container: HTMLElement): void {
    const empty = container.createDiv({ cls: 'p2p-share-history-empty' });
    empty.createDiv({ text: 'No transfer history', cls: 'p2p-share-history-empty-title' });
    empty.createDiv({
      text: this.searchTerm || this.filterDirection !== 'all' || this.filterStatus !== 'all'
        ? 'Try adjusting your filters'
        : 'Transfers will appear here once you start sharing',
      cls: 'p2p-share-history-empty-hint'
    });
  }

  /**
   * Render a time period group
   */
  private renderGroup(container: HTMLElement, group: GroupedEntries): void {
    const groupContainer = container.createDiv({ cls: 'p2p-share-history-group' });

    // Group header (collapsible)
    const groupHeader = groupContainer.createDiv({ cls: 'p2p-share-history-group-header' });
    const isExpanded = this.expandedGroups.has(group.period);

    const toggleIcon = groupHeader.createDiv({ cls: 'p2p-share-history-group-toggle' });
    setIcon(toggleIcon, isExpanded ? 'chevron-down' : 'chevron-right');

    groupHeader.createSpan({
      text: group.label,
      cls: 'p2p-share-history-group-label'
    });

    groupHeader.createSpan({
      text: `(${group.entries.length})`,
      cls: 'p2p-share-history-group-count'
    });

    groupHeader.onclick = () => {
      if (this.expandedGroups.has(group.period)) {
        this.expandedGroups.delete(group.period);
      } else {
        this.expandedGroups.add(group.period);
      }
      this.updateEntries();
    };

    // Group entries (if expanded)
    if (isExpanded) {
      const groupEntries = groupContainer.createDiv({ cls: 'p2p-share-history-group-entries' });
      for (const entry of group.entries) {
        this.renderEntry(groupEntries, entry);
      }
    }
  }

  /**
   * Render a single history entry
   */
  private renderEntry(container: HTMLElement, entry: ShareHistoryEntry): void {
    const entryEl = container.createDiv({ cls: 'p2p-share-history-entry' });
    entryEl.dataset.entryId = entry.id;

    // Add status class
    entryEl.addClass(`status-${entry.status}`);

    // Direction icon
    const iconContainer = entryEl.createDiv({ cls: 'p2p-share-history-entry-icon' });
    const icon = entry.direction === 'sent' ? 'arrow-up-right' : 'arrow-down-left';
    setIcon(iconContainer, icon);

    // Entry content
    const content = entryEl.createDiv({ cls: 'p2p-share-history-entry-content' });

    // First line: peer name and status
    const firstLine = content.createDiv({ cls: 'p2p-share-history-entry-first-line' });
    firstLine.createSpan({
      text: `${entry.direction === 'sent' ? 'Sent to' : 'Received from'} `,
      cls: 'p2p-share-history-entry-direction-text'
    });
    firstLine.createSpan({
      text: entry.peerName,
      cls: 'p2p-share-history-entry-peer-name'
    });

    // Peer OS/App info
    if (entry.peerOs || entry.peerApp) {
      const peerInfo = firstLine.createSpan({ cls: 'p2p-share-history-entry-peer-info' });
      const parts = [entry.peerOs, entry.peerApp].filter(Boolean);
      peerInfo.setText(` (${parts.join(' • ')})`);
    }

    // Status indicator
    if (entry.status !== 'completed') {
      const statusIcon = firstLine.createSpan({ cls: `p2p-share-history-entry-status ${entry.status}` });
      if (entry.status === 'failed') {
        setIcon(statusIcon, 'x-circle');
        statusIcon.title = entry.error || 'Transfer failed';
      } else if (entry.status === 'cancelled') {
        setIcon(statusIcon, 'alert-circle');
        statusIcon.title = 'Transfer cancelled';
      }
    }

    // Second line: file info
    const secondLine = content.createDiv({ cls: 'p2p-share-history-entry-second-line' });
    const isExpanded = this.expandedEntries.has(entry.id);

    if (entry.files.length === 1) {
      // Single file - show name and size
      secondLine.createSpan({
        text: entry.files[0].name,
        cls: 'p2p-share-history-entry-file-name'
      });
      secondLine.createSpan({
        text: ` (${this.formatFileSize(entry.files[0].size)})`,
        cls: 'p2p-share-history-entry-file-size'
      });
    } else {
      // Multiple files - show count and total size
      const filesText = secondLine.createSpan({
        text: `${entry.files.length} files (${this.formatFileSize(entry.totalSize)})`,
        cls: 'p2p-share-history-entry-files-summary clickable'
      });
      filesText.onclick = (e) => {
        e.stopPropagation();
        if (this.expandedEntries.has(entry.id)) {
          this.expandedEntries.delete(entry.id);
        } else {
          this.expandedEntries.add(entry.id);
        }
        this.updateEntries();
      };

      // Show file list if expanded
      if (isExpanded) {
        const filesList = content.createDiv({ cls: 'p2p-share-history-entry-files-list' });
        for (const file of entry.files) {
          const fileItem = filesList.createDiv({ cls: 'p2p-share-history-entry-file-item' });
          fileItem.createSpan({ text: file.name, cls: 'p2p-share-history-entry-file-name' });
          fileItem.createSpan({
            text: ` (${this.formatFileSize(file.size)})`,
            cls: 'p2p-share-history-entry-file-size'
          });
        }
      }
    }

    // Third line: timestamp and duration
    const thirdLine = content.createDiv({ cls: 'p2p-share-history-entry-third-line' });
    thirdLine.createSpan({
      text: this.formatTime(entry.timestamp),
      cls: 'p2p-share-history-entry-time'
    });
    if (entry.duration !== undefined) {
      thirdLine.createSpan({
        text: ` • ${this.formatDuration(entry.duration)}`,
        cls: 'p2p-share-history-entry-duration'
      });
    }

    // Context menu on right-click
    entryEl.oncontextmenu = (e) => {
      e.preventDefault();
      this.showEntryContextMenu(e, entry);
    };
  }

  /**
   * Show options menu (top-right)
   */
  private showOptionsMenu(e: MouseEvent): void {
    const menu = new Menu();

    // Direction filter section
    menu.addItem((item) => {
      item
        .setTitle('All directions')
        .setIcon(this.filterDirection === 'all' ? 'check' : 'empty')
        .onClick(() => {
          this.filterDirection = 'all';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterDirection === 'all') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });
    menu.addItem((item) => {
      item
        .setTitle('Sent')
        .setIcon(this.filterDirection === 'sent' ? 'check' : 'empty')
        .onClick(() => {
          this.filterDirection = 'sent';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterDirection === 'sent') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });
    menu.addItem((item) => {
      item
        .setTitle('Received')
        .setIcon(this.filterDirection === 'received' ? 'check' : 'empty')
        .onClick(() => {
          this.filterDirection = 'received';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterDirection === 'received') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });

    menu.addSeparator();

    // Status filter section
    menu.addItem((item) => {
      item
        .setTitle('All statuses')
        .setIcon(this.filterStatus === 'all' ? 'check' : 'empty')
        .onClick(() => {
          this.filterStatus = 'all';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterStatus === 'all') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });
    menu.addItem((item) => {
      item
        .setTitle('Completed')
        .setIcon(this.filterStatus === 'completed' ? 'check' : 'empty')
        .onClick(() => {
          this.filterStatus = 'completed';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterStatus === 'completed') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });
    menu.addItem((item) => {
      item
        .setTitle('Failed')
        .setIcon(this.filterStatus === 'failed' ? 'check' : 'empty')
        .onClick(() => {
          this.filterStatus = 'failed';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterStatus === 'failed') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });
    menu.addItem((item) => {
      item
        .setTitle('Cancelled')
        .setIcon(this.filterStatus === 'cancelled' ? 'check' : 'empty')
        .onClick(() => {
          this.filterStatus = 'cancelled';
          this.updateHeader();
          this.updateEntries();
        });
      if (this.filterStatus === 'cancelled') {
        item.dom.addClass('p2p-share-menu-checked');
      }
    });

    menu.addSeparator();

    // Statistics
    menu.addItem((item) =>
      item
        .setTitle('View Statistics')
        .setIcon('bar-chart-2')
        .onClick(() => this.showStatistics())
    );

    menu.addSeparator();

    // Export
    menu.addItem((item) =>
      item
        .setTitle('Export History')
        .setIcon('download')
        .onClick(() => this.exportHistory())
    );

    // Import
    menu.addItem((item) =>
      item
        .setTitle('Import History')
        .setIcon('upload')
        .onClick(() => this.importHistory())
    );

    menu.addSeparator();

    // Clear all
    menu.addItem((item) =>
      item
        .setTitle('Clear All History')
        .setIcon('trash-2')
        .onClick(() => this.clearAllHistory())
    );

    menu.showAtMouseEvent(e);
  }

  /**
   * Show context menu for a history entry
   */
  private showEntryContextMenu(e: MouseEvent, entry: ShareHistoryEntry): void {
    const menu = new Menu();

    // Share again (for sent files)
    if (entry.direction === 'sent' && entry.status === 'completed') {
      menu.addItem((item) =>
        item
          .setTitle('Share Again')
          .setIcon('repeat')
          .onClick(() => this.shareAgain(entry))
      );
    }

    // Reveal in vault (for received files with paths)
    if (entry.direction === 'received' && entry.files.some(f => f.path)) {
      menu.addItem((item) =>
        item
          .setTitle('Reveal in Vault')
          .setIcon('folder-open')
          .onClick(() => this.revealInVault(entry))
      );
    }

    menu.addSeparator();

    // Delete entry
    menu.addItem((item) =>
      item
        .setTitle('Delete from History')
        .setIcon('trash')
        .onClick(() => this.deleteEntry(entry))
    );

    menu.showAtMouseEvent(e);
  }

  /**
   * Group entries by time period
   */
  private groupEntriesByTime(entries: ShareHistoryEntry[]): GroupedEntries[] {
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const yesterday = new Date(todayStart - 24 * 60 * 60 * 1000);
    const yesterdayStart = yesterday.getTime();

    const thisWeekStart = todayStart - (today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    const groups: GroupedEntries[] = [
      { period: 'today', label: 'Today', entries: [] },
      { period: 'yesterday', label: 'Yesterday', entries: [] },
      { period: 'thisWeek', label: 'This Week', entries: [] },
      { period: 'thisMonth', label: 'This Month', entries: [] },
      { period: 'older', label: 'Older', entries: [] },
    ];

    for (const entry of entries) {
      if (entry.timestamp >= todayStart) {
        groups[0].entries.push(entry);
      } else if (entry.timestamp >= yesterdayStart) {
        groups[1].entries.push(entry);
      } else if (entry.timestamp >= thisWeekStart) {
        groups[2].entries.push(entry);
      } else if (entry.timestamp >= thisMonthStart) {
        groups[3].entries.push(entry);
      } else {
        groups[4].entries.push(entry);
      }
    }

    return groups;
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Format duration in seconds
   */
  private formatDuration(ms: number): string {
    const seconds = ms / 1000;
    if (seconds < 1) return `${ms}ms`;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  }

  /**
   * Show statistics modal
   */
  private showStatistics(): void {
    const stats = this.history.getStatistics();
    new StatisticsModal(this.app, stats, (bytes) => this.formatFileSize(bytes)).open();
  }

  /**
   * Export history to JSON file
   */
  private async exportHistory(): Promise<void> {
    try {
      const json = this.history.exportAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `p2p-share-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      new Notice('History exported successfully');
    } catch (error) {
      new Notice('Failed to export history');
    }
  }

  /**
   * Import history from JSON file
   */
  private async importHistory(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = await this.history.importFromJson(text);
        if (result.success) {
          new Notice(`Imported ${result.imported} entries${result.errors > 0 ? `, ${result.errors} errors` : ''}`);
        } else {
          new Notice('Failed to import history');
        }
      } catch (error) {
        new Notice('Failed to read history file');
      }
    };
    input.click();
  }

  /**
   * Clear all history with confirmation
   */
  private async clearAllHistory(): Promise<void> {
    new ConfirmModal(
      this.app,
      'Clear All History?',
      'This will permanently delete all transfer history. This cannot be undone.',
      async () => {
        await this.history.clearAll();
        new Notice('History cleared');
      },
      'Clear'
    ).open();
  }

  /**
   * Share files again from a history entry
   */
  private async shareAgain(entry: ShareHistoryEntry): Promise<void> {
    // TODO: Implement share again functionality
    // This will require access to the vault and file picker
    new Notice('Share again feature coming soon');
  }

  /**
   * Reveal received files in vault
   */
  private async revealInVault(entry: ShareHistoryEntry): Promise<void> {
    const filesWithPaths = entry.files.filter(f => f.path);
    if (filesWithPaths.length === 0) {
      new Notice('No file paths available');
      return;
    }

    // Reveal first file
    const file = this.app.vault.getAbstractFileByPath(filesWithPaths[0].path!);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf(false).openFile(file);
    } else {
      new Notice('File not found in vault');
    }
  }

  /**
   * Delete a history entry
   */
  private async deleteEntry(entry: ShareHistoryEntry): Promise<void> {
    await this.history.deleteEntry(entry.id);
    new Notice('Entry deleted');
  }
}
