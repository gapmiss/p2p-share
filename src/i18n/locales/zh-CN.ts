export const zhCN = {
	// Common
	'common.cancel': '取消',
	'common.close': '关闭',
	'common.done': '完成',
	'common.back': '返回',
	'common.connect': '连接',
	'common.disconnect': '断开连接',
	'common.connected': '已连接',
	'common.disconnected': '已断开',
	'common.offline': '离线',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': '显示可用设备',
	'command.share-current-file': '分享当前文件',
	'command.share-files': '分享文件...',
	'command.reconnect': '重新连接到服务器',
	'command.pair-device': '配对设备',
	'command.toggle-connection': '切换连接状态',

	// Context menu
	'context-menu.share-file': '通过 P2P Share 分享',
	'context-menu.share-folder': '通过 P2P Share 分享文件夹',

	// Status bar
	'status-bar.peers': '{0} 个设备{1}',
	'status-bar.offline': 'P2P Share: 离线',
	'status-bar.menu.show-peers': '显示设备',
	'status-bar.menu.pair-device': '配对设备',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: 已连接',
	'notice.disconnected': 'P2P Share: 已断开连接',
	'notice.configure-server': 'P2P Share: 请在设置中配置服务器 URL',
	'notice.failed-to-connect': 'P2P Share: 无法连接到服务器。请检查 URL 并确保服务器接受外部连接。',
	'notice.transfer-rejected': 'P2P Share: 传输被拒绝',
	'notice.transfer-cancelled': 'P2P Share: 传输已取消',
	'notice.no-files': 'P2P Share: 没有要发送的文件',
	'notice.error-sending': 'P2P Share: 发送文件时出错 - {0}',
	'notice.device-paired': 'P2P Share: 设备配对成功！',
	'notice.device-removed': 'P2P Share: 已移除一个已配对的设备',
	'notice.not-connected': 'P2P Share: 未连接到服务器。请先重新连接。',
	'notice.transfer-declined': 'P2P Share: 传输被拒绝',
	'notice.auto-accepting': 'P2P Share: 自动接受来自 {0} 的传输',
	'notice.display-name-changed': 'P2P Share: 显示名称已更改为 {0}',

	// Peer Modal
	'peer-modal.title': '选择设备',
	'peer-modal.you-appear-as': '您显示为: {0}',
	'peer-modal.empty.title': '在您的网络中未发现设备。',
	'peer-modal.empty.hint': '请确保其他设备已连接到相同的 PairDrop 服务器。',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': '支持点对点直连',
	'peer-modal.paired-tooltip': '已配对设备',
	'peer-modal.share-with': '分享给 {0}',

	// File Picker Modal
	'file-picker.title': '选择要分享的文件',
	'file-picker.vault': '仓库',
	'file-picker.empty-folder': '空文件夹',
	'file-picker.select-all': '全选',
	'file-picker.clear-selection': '清除选择',
	'file-picker.share-selected': '分享已选',
	'file-picker.no-items-selected': '未选择任何项目',
	'file-picker.selected': '已选 {0} ({1})',
	'file-picker.files': '{0} 个文件{1}',
	'file-picker.folders': '{0} 个文件夹{1}',

	// Transfer Modal
	'transfer-modal.sending': '正在发送文件',
	'transfer-modal.receiving': '正在接收文件',
	'transfer-modal.to': '发送至: ',
	'transfer-modal.from': '来自: ',
	'transfer-modal.files-summary': '{0} 个文件{1} ({2})',
	'transfer-modal.status.connecting': '正在连接...',
	'transfer-modal.status.waiting': '等待文件...',
	'transfer-modal.status.sending': '正在发送: {0}/{1} 个文件',
	'transfer-modal.status.receiving': '正在接收: {0}/{1} 个文件',
	'transfer-modal.status.complete': '已完成: {0}/{1} 个文件',
	'transfer-modal.status.transfer-complete': '传输完成！',
	'transfer-modal.status.error': '错误: {0}',
	'transfer-modal.file.pending': '等待中',
	'transfer-modal.file.complete': '已完成',

	// Incoming Transfer Modal
	'incoming-modal.title': '收到传输请求',
	'incoming-modal.from': '来自: ',
	'incoming-modal.files-summary': '{0} 个文件{1} ({2})',
	'incoming-modal.more-files': '...以及另外 {0} 个',
	'incoming-modal.auto-accept': ' 始终自动接受来自 {0} 的传输',
	'incoming-modal.decline': '拒绝',
	'incoming-modal.accept': '接受',

	// Pairing Modal
	'pairing-modal.title': '配对设备',
	'pairing-modal.description': '与其他设备配对以跨越不同网络分享文件。',
	'pairing-modal.show-code': '显示配对码',
	'pairing-modal.enter-code': '输入配对码',
	'pairing-modal.code-title': '配对码',
	'pairing-modal.code-instruction': '在另一台设备上输入此代码以完成配对。',
	'pairing-modal.code-expires': '配对码将在 {0} 秒{1}后过期。',
	'pairing-modal.code-generating': '正在生成配对码...',
	'pairing-modal.code-copied': '✓ 已复制！',
	'pairing-modal.code-click-to-copy': '点击复制配对码',
	'pairing-modal.enter-instruction': '输入另一台设备上显示的 6 位数字代码。',
	'pairing-modal.join': '加入',
	'pairing-modal.success.title': '配对成功！',
	'pairing-modal.success.message': '您已成功与 "{0}" 配对。',
	'pairing-modal.success.hint': '现在您可以随时随地与此设备分享文件。',
	'pairing-modal.error.title': '配对失败',
	'pairing-modal.error.unknown': '发生未知错误。',
	'pairing-modal.error.invalid-code': '配对码无效或已过期。',
	'pairing-modal.error.canceled': '配对已取消。',
	'pairing-modal.error.expired': '配对码已过期。请重试。',
	'pairing-modal.try-again': '重试',

	// Confirm Modal
	'confirm-modal.remove': '移除',

	// Settings
	'settings.title': 'P2P Share 设置',
	'settings.server.title': '服务器配置',
	'settings.server.url.name': '信令服务器 URL',
	'settings.server.url.desc': '自托管 PairDrop 服务器的 WebSocket URL (例如: wss://your-server.com 或 ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://your-pairdrop-server.com',

	'settings.files.title': '文件设置',
	'settings.files.location.name': '保存位置',
	'settings.files.location.desc': '接收到的文件将保存到仓库中的此文件夹',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': '发现设置',
	'settings.discovery.mode.name': '发现模式',
	'settings.discovery.mode.desc': '如何发现其他设备',
	'settings.discovery.mode.auto': '自动发现网络设备',
	'settings.discovery.mode.paired-only': '仅已配对设备',

	'settings.behavior.title': '行为',
	'settings.behavior.log-level.name': '日志级别',
	'settings.behavior.log-level.desc': '用于调试的控制台日志详细程度',
	'settings.behavior.log-level.none': '无',
	'settings.behavior.log-level.error': '仅错误',
	'settings.behavior.log-level.warn': '警告和错误',
	'settings.behavior.log-level.info': '信息',
	'settings.behavior.log-level.debug': '调试 (详细)',

	'settings.connection.title': '连接状态',
	'settings.connection.display-name.name': '显示名称',
	'settings.connection.display-name.desc': '您在其他设备中显示的名称',
	'settings.connection.display-name.placeholder': '输入自定义名称',
	'settings.connection.reconnect.name': '重新连接',
	'settings.connection.reconnect.desc': '手动重新连接到信令服务器',
	'settings.connection.reconnect.button': '重新连接',

	'settings.paired-devices.title': '已配对设备',
	'settings.paired-devices.empty': '没有已配对的设备。使用"配对设备"命令以跨网络配对。',
	'settings.paired-devices.paired-at': '{0}配对',
	'settings.paired-devices.auto-accept.name': '自动接受',
	'settings.paired-devices.auto-accept.desc': '自动接受来自此设备的传输',
	'settings.paired-devices.remove.label': '移除配对',
	'settings.paired-devices.remove-all.name': '移除所有已配对设备',
	'settings.paired-devices.remove-all.desc': '这将取消所有设备的配对',
	'settings.paired-devices.remove-all.button': '全部移除',
	'settings.paired-devices.remove-confirm.title': '移除已配对设备',
	'settings.paired-devices.remove-confirm.message': '确定要移除 "{0}" 吗？您需要重新配对才能与此设备分享文件。',
	'settings.paired-devices.remove-all-confirm.title': '移除所有已配对设备',
	'settings.paired-devices.remove-all-confirm.message': '确定要移除所有 {0} 个已配对的设备吗？您需要与每个设备重新配对。',

	// Date formatting
	'date.today': '今天',
	'date.yesterday': '昨天',
	'date.days-ago': '{0} 天前',
} as const;
