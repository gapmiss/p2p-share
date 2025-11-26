export const en = {
	// Common
	'common.cancel': 'Cancel',
	'common.close': 'Close',
	'common.done': 'Done',
	'common.back': 'Back',
	'common.connect': 'Connect',
	'common.disconnect': 'Disconnect',
	'common.connected': 'Connected',
	'common.disconnected': 'Disconnected',
	'common.offline': 'Offline',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': 'Show available peers',
	'command.share-current-file': 'Share current file',
	'command.share-files': 'Share files...',
	'command.reconnect': 'Reconnect to server',
	'command.pair-device': 'Pair with device',
	'command.toggle-connection': 'Toggle connection',

	// Context menu
	'context-menu.share-file': 'Share via P2P Share',
	'context-menu.share-folder': 'Share folder via P2P Share',

	// Status bar
	'status-bar.peers': '{0} peer{1}',
	'status-bar.offline': 'Offline',
	'status-bar.menu.show-peers': 'Show peers',
	'status-bar.menu.pair-device': 'Pair with device',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: Connected',
	'notice.disconnected': 'P2P Share: Disconnected',
	'notice.configure-server': 'P2P Share: Please configure a server URL in settings',
	'notice.failed-to-connect': 'P2P Share: Failed to connect to server. Check the URL and ensure the server accepts external connections.',
	'notice.transfer-rejected': 'P2P Share: Transfer rejected',
	'notice.transfer-cancelled': 'P2P Share: Transfer cancelled',
	'notice.no-files': 'P2P Share: No files to send',
	'notice.error-sending': 'P2P Share: Error sending files - {0}',
	'notice.device-paired': 'P2P Share: Device paired successfully!',
	'notice.device-removed': 'P2P Share: A paired device was removed',
	'notice.not-connected': 'P2P Share: Not connected to server. Please reconnect first.',
	'notice.transfer-declined': 'P2P Share: Transfer declined',
	'notice.auto-accepting': 'P2P Share: Auto-accepting transfer from {0}',

	// Peer Modal
	'peer-modal.title': 'Select peer',
	'peer-modal.you-appear-as': 'You appear as: {0}',
	'peer-modal.disconnected.title': 'Disconnected',
	'peer-modal.disconnected.hint': 'Connect to discover peers on your network.',
	'peer-modal.empty.title': 'No peers found on your network.',
	'peer-modal.empty.hint': 'Make sure other devices are connected to the same PairDrop server.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'Direct peer-to-peer connection supported',
	'peer-modal.paired-tooltip': 'Paired device',
	'peer-modal.share-with': 'Share with {0}',

	// File Picker Modal
	'file-picker.title': 'Select files to share',
	'file-picker.vault': 'Vault',
	'file-picker.empty-folder': 'Empty folder',
	'file-picker.select-all': 'Select all',
	'file-picker.clear-selection': 'Clear selection',
	'file-picker.share-selected': 'Share selected',
	'file-picker.no-items-selected': 'No items selected',
	'file-picker.selected': '{0} selected ({1})',
	'file-picker.files': '{0} file{1}',
	'file-picker.folders': '{0} folder{1}',

	// Transfer Modal
	'transfer-modal.sending': 'Sending files',
	'transfer-modal.receiving': 'Receiving files',
	'transfer-modal.to': 'To: ',
	'transfer-modal.from': 'From: ',
	'transfer-modal.files-summary': '{0} file{1} ({2})',
	'transfer-modal.status.connecting': 'Connecting...',
	'transfer-modal.status.waiting': 'Waiting for files...',
	'transfer-modal.status.sending': 'Sending: {0}/{1} files',
	'transfer-modal.status.receiving': 'Receiving: {0}/{1} files',
	'transfer-modal.status.complete': 'Complete: {0}/{1} files',
	'transfer-modal.status.transfer-complete': 'Transfer complete!',
	'transfer-modal.status.error': 'Error: {0}',
	'transfer-modal.file.pending': 'Pending',
	'transfer-modal.file.complete': 'Complete',

	// Incoming Transfer Modal
	'incoming-modal.title': 'Incoming transfer',
	'incoming-modal.from': 'From: ',
	'incoming-modal.files-summary': '{0} file{1} ({2})',
	'incoming-modal.more-files': '...and {0} more',
	'incoming-modal.auto-accept': ' Always auto-accept from {0}',
	'incoming-modal.decline': 'Decline',
	'incoming-modal.accept': 'Accept',

	// Pairing Modal
	'pairing-modal.title': 'Pair devices',
	'pairing-modal.description': 'Pair with another device to share files across different networks.',
	'pairing-modal.show-code': 'Show pairing code',
	'pairing-modal.enter-code': 'Enter pairing code',
	'pairing-modal.code-title': 'Pairing code',
	'pairing-modal.code-instruction': 'Enter this code on the other device to pair.',
	'pairing-modal.code-expires': 'The code expires in {0} second{1}.',
	'pairing-modal.code-generating': 'Generating pairing code...',
	'pairing-modal.code-copied': '✓ Copied!',
	'pairing-modal.code-click-to-copy': 'Click to copy pairing code',
	'pairing-modal.enter-instruction': 'Enter the 6-digit code shown on the other device.',
	'pairing-modal.join': 'Join',
	'pairing-modal.success.title': 'Paired successfully!',
	'pairing-modal.success.message': 'You are now paired with "{0}".',
	'pairing-modal.success.hint': 'You can now share files with this device from anywhere.',
	'pairing-modal.error.title': 'Pairing failed',
	'pairing-modal.error.unknown': 'An unknown error occurred.',
	'pairing-modal.error.invalid-code': 'Invalid or expired pairing code.',
	'pairing-modal.error.canceled': 'Pairing was canceled.',
	'pairing-modal.error.expired': 'Pairing code expired. Please try again.',
	'pairing-modal.try-again': 'Try Again',

	// Confirm Modal
	'confirm-modal.remove': 'Remove',

	// Settings
	'settings.title': 'P2P Share settings',
	'settings.server.title': 'Server configuration',
	'settings.server.url.name': 'Signaling server URL',
	'settings.server.url.desc': 'WebSocket URL for your self-hosted PairDrop server (e.g., wss://your-server.com or ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://your-pairdrop-server.com',

	'settings.files.title': 'File settings',
	'settings.files.location.name': 'Save location',
	'settings.files.location.desc': 'Folder in your vault where received files will be saved',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': 'Discovery settings',
	'settings.discovery.mode.name': 'Discovery mode',
	'settings.discovery.mode.desc': 'How to discover other peers',
	'settings.discovery.mode.auto': 'Auto-discover on network',
	'settings.discovery.mode.paired-only': 'Paired devices only',

	'settings.behavior.title': 'Behavior',
	'settings.behavior.log-level.name': 'Log level',
	'settings.behavior.log-level.desc': 'Console log verbosity for debugging',
	'settings.behavior.log-level.none': 'Silent (No logging)',
	'settings.behavior.log-level.error': 'Error (Critical only)',
	'settings.behavior.log-level.warn': 'Warning (+ Errors)',
	'settings.behavior.log-level.info': 'Info (+ Status messages)',
	'settings.behavior.log-level.debug': 'Debug (Maximum verbosity)',
	'settings.behavior.auto-connect.name': 'Auto-connect on startup',
	'settings.behavior.auto-connect.desc': 'Automatically connect to server when Obsidian starts',
	'settings.behavior.system-notifications.name': 'System notifications',
	'settings.behavior.system-notifications.desc': 'Show OS-level notifications for incoming transfers (desktop only)',

	'settings.connection.title': 'Connection status',
	'settings.connection.reconnect.name': 'Reconnect',
	'settings.connection.reconnect.desc': 'Manually reconnect to the signaling server',
	'settings.connection.reconnect.button': 'Reconnect',

	'settings.paired-devices.title': 'Paired devices',
	'settings.paired-devices.empty': 'No paired devices.',
	'settings.paired-devices.paired-at': 'Paired {0}',
	'settings.paired-devices.auto-accept.name': 'Auto-accept',
	'settings.paired-devices.auto-accept.desc': 'Automatically accept transfers from this device',
	'settings.paired-devices.remove.label': 'Remove pairing',
	'settings.paired-devices.remove-all.name': 'Remove all paired devices',
	'settings.paired-devices.remove-all.desc': 'This will unpair all devices',
	'settings.paired-devices.remove-all.button': 'Remove all',
	'settings.paired-devices.remove-confirm.title': 'Remove paired device',
	'settings.paired-devices.remove-confirm.message': 'Are you sure you want to remove "{0}"? You will need to pair again to share files with this device.',
	'settings.paired-devices.remove-all-confirm.title': 'Remove all paired devices',
	'settings.paired-devices.remove-all-confirm.message': 'Are you sure you want to remove all {0} paired devices? You will need to pair again with each device.',

	// Date formatting
	'date.today': 'today',
	'date.yesterday': 'yesterday',
	'date.days-ago': '{0} days ago',
} as const;
