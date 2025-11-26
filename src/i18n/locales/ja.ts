export const ja = {
	// Common
	'common.cancel': 'キャンセル',
	'common.close': '閉じる',
	'common.done': '完了',
	'common.back': '戻る',
	'common.connect': '接続',
	'common.disconnect': '切断',
	'common.connected': '接続中',
	'common.disconnected': '切断済み',
	'common.offline': 'オフライン',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': '利用可能なデバイスを表示',
	'command.share-current-file': '現在のファイルを共有',
	'command.share-files': 'ファイルを共有...',
	'command.reconnect': 'サーバーに再接続',
	'command.pair-device': 'デバイスをペアリング',
	'command.toggle-connection': '接続を切り替え',

	// Context menu
	'context-menu.share-file': 'P2P Shareで共有',
	'context-menu.share-folder': 'P2P Shareでフォルダを共有',

	// Status bar
	'status-bar.peers': '{0}台のデバイス',
	'status-bar.offline': 'オフライン',
	'status-bar.menu.show-peers': 'デバイスを表示',
	'status-bar.menu.pair-device': 'デバイスをペアリング',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: 接続しました',
	'notice.disconnected': 'P2P Share: 切断しました',
	'notice.configure-server': 'P2P Share: 設定でサーバーURLを設定してください',
	'notice.failed-to-connect': 'P2P Share: サーバーへの接続に失敗しました。URLを確認し、サーバーが外部接続を受け付けることを確認してください。',
	'notice.transfer-rejected': 'P2P Share: 転送が拒否されました',
	'notice.transfer-cancelled': 'P2P Share: 転送がキャンセルされました',
	'notice.no-files': 'P2P Share: 送信するファイルがありません',
	'notice.error-sending': 'P2P Share: ファイル送信エラー - {0}',
	'notice.device-paired': 'P2P Share: デバイスのペアリングに成功しました！',
	'notice.device-removed': 'P2P Share: ペアリング済みデバイスが削除されました',
	'notice.not-connected': 'P2P Share: サーバーに接続されていません。まず再接続してください。',
	'notice.transfer-declined': 'P2P Share: 転送が拒否されました',
	'notice.auto-accepting': 'P2P Share: {0}からの転送を自動承認しています',

	// Peer Modal
	'peer-modal.title': 'デバイスを選択',
	'peer-modal.you-appear-as': 'あなたの表示名: {0}',
	'peer-modal.disconnected.title': '切断済み',
	'peer-modal.disconnected.hint': '接続してネットワーク上のデバイスを検出します。',
	'peer-modal.empty.title': 'ネットワーク上にデバイスが見つかりませんでした。',
	'peer-modal.empty.hint': '他のデバイスが同じPairDropサーバーに接続していることを確認してください。',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'ダイレクトP2P接続に対応',
	'peer-modal.paired-tooltip': 'ペアリング済みデバイス',
	'peer-modal.share-with': '{0}と共有',

	// File Picker Modal
	'file-picker.title': '共有するファイルを選択',
	'file-picker.vault': 'ボルト',
	'file-picker.empty-folder': '空のフォルダ',
	'file-picker.select-all': 'すべて選択',
	'file-picker.clear-selection': '選択を解除',
	'file-picker.share-selected': '選択したものを共有',
	'file-picker.no-items-selected': '選択された項目がありません',
	'file-picker.selected': '{0}を選択中 ({1})',
	'file-picker.files': '{0}個のファイル',
	'file-picker.folders': '{0}個のフォルダ',

	// Transfer Modal
	'transfer-modal.sending': 'ファイルを送信中',
	'transfer-modal.receiving': 'ファイルを受信中',
	'transfer-modal.to': '宛先: ',
	'transfer-modal.from': '送信元: ',
	'transfer-modal.files-summary': '{0}個のファイル ({2})',
	'transfer-modal.status.connecting': '接続中...',
	'transfer-modal.status.waiting': 'ファイルを待機中...',
	'transfer-modal.status.sending': '送信中: {0}/{1}ファイル',
	'transfer-modal.status.receiving': '受信中: {0}/{1}ファイル',
	'transfer-modal.status.complete': '完了: {0}/{1}ファイル',
	'transfer-modal.status.transfer-complete': '転送が完了しました！',
	'transfer-modal.status.error': 'エラー: {0}',
	'transfer-modal.file.pending': '保留中',
	'transfer-modal.file.complete': '完了',

	// Incoming Transfer Modal
	'incoming-modal.title': '着信転送',
	'incoming-modal.from': '送信元: ',
	'incoming-modal.files-summary': '{0}個のファイル ({2})',
	'incoming-modal.more-files': '...他{0}個',
	'incoming-modal.auto-accept': ' {0}からの転送を常に自動承認',
	'incoming-modal.decline': '拒否',
	'incoming-modal.accept': '承認',

	// Pairing Modal
	'pairing-modal.title': 'デバイスをペアリング',
	'pairing-modal.description': '異なるネットワーク間でファイルを共有するため、別のデバイスとペアリングします。',
	'pairing-modal.show-code': 'ペアリングコードを表示',
	'pairing-modal.enter-code': 'ペアリングコードを入力',
	'pairing-modal.code-title': 'ペアリングコード',
	'pairing-modal.code-instruction': 'このコードを他のデバイスに入力してペアリングしてください。',
	'pairing-modal.code-expires': 'コードは{0}秒後に期限切れになります。',
	'pairing-modal.code-generating': 'ペアリングコードを生成中...',
	'pairing-modal.code-copied': '✓ コピーしました！',
	'pairing-modal.code-click-to-copy': 'クリックしてペアリングコードをコピー',
	'pairing-modal.enter-instruction': '他のデバイスに表示されている6桁のコードを入力してください。',
	'pairing-modal.join': '参加',
	'pairing-modal.success.title': 'ペアリング成功！',
	'pairing-modal.success.message': '「{0}」とペアリングしました。',
	'pairing-modal.success.hint': 'このデバイスとどこからでもファイルを共有できるようになりました。',
	'pairing-modal.error.title': 'ペアリング失敗',
	'pairing-modal.error.unknown': '不明なエラーが発生しました。',
	'pairing-modal.error.invalid-code': '無効または期限切れのペアリングコードです。',
	'pairing-modal.error.canceled': 'ペアリングがキャンセルされました。',
	'pairing-modal.error.expired': 'ペアリングコードが期限切れです。もう一度お試しください。',
	'pairing-modal.try-again': '再試行',

	// Confirm Modal
	'confirm-modal.remove': '削除',

	// Settings
	'settings.title': 'P2P Share設定',
	'settings.server.title': 'サーバー設定',
	'settings.server.url.name': 'シグナリングサーバーURL',
	'settings.server.url.desc': '自己ホストしたPairDropサーバーのWebSocket URL（例: wss://your-server.com または ws://localhost:3000）',
	'settings.server.url.placeholder': 'wss://your-pairdrop-server.com',

	'settings.files.title': 'ファイル設定',
	'settings.files.location.name': '保存場所',
	'settings.files.location.desc': '受信したファイルを保存するボルト内のフォルダ',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': '検出設定',
	'settings.discovery.mode.name': '検出モード',
	'settings.discovery.mode.desc': '他のデバイスを検出する方法',
	'settings.discovery.mode.auto': 'ネットワーク上で自動検出',
	'settings.discovery.mode.paired-only': 'ペアリング済みデバイスのみ',

	'settings.behavior.title': '動作',
	'settings.behavior.log-level.name': 'ログレベル',
	'settings.behavior.log-level.desc': 'デバッグ用のコンソールログの詳細度',
	'settings.behavior.log-level.none': 'サイレント（ログなし）',
	'settings.behavior.log-level.error': 'エラー（重大なもののみ）',
	'settings.behavior.log-level.warn': '警告（+ エラー）',
	'settings.behavior.log-level.info': '情報（+ ステータスメッセージ）',
	'settings.behavior.log-level.debug': 'デバッグ（最大の詳細度）',
	'settings.behavior.auto-connect.name': '起動時に自動接続',
	'settings.behavior.auto-connect.desc': 'Obsidian起動時にサーバーに自動接続',
	'settings.behavior.system-notifications.name': 'システム通知',
	'settings.behavior.system-notifications.desc': '着信転送のOS レベル通知を表示（デスクトップのみ）',

	'settings.connection.title': '接続状態',
	'settings.connection.reconnect.name': '再接続',
	'settings.connection.reconnect.desc': 'シグナリングサーバーに手動で再接続',
	'settings.connection.reconnect.button': '再接続',

	'settings.paired-devices.title': 'ペアリング済みデバイス',
	'settings.paired-devices.empty': 'ペアリング済みデバイスがありません。「デバイスをペアリング」コマンドを使用してネットワーク間でペアリングしてください。',
	'settings.paired-devices.paired-at': '{0}にペアリング',
	'settings.paired-devices.auto-accept.name': '自動承認',
	'settings.paired-devices.auto-accept.desc': 'このデバイスからの転送を自動的に承認',
	'settings.paired-devices.remove.label': 'ペアリングを解除',
	'settings.paired-devices.remove-all.name': 'すべてのペアリング済みデバイスを削除',
	'settings.paired-devices.remove-all.desc': 'すべてのデバイスのペアリングを解除します',
	'settings.paired-devices.remove-all.button': 'すべて削除',
	'settings.paired-devices.remove-confirm.title': 'ペアリング済みデバイスを削除',
	'settings.paired-devices.remove-confirm.message': '「{0}」を削除してもよろしいですか？このデバイスとファイルを共有するには、再度ペアリングする必要があります。',
	'settings.paired-devices.remove-all-confirm.title': 'すべてのペアリング済みデバイスを削除',
	'settings.paired-devices.remove-all-confirm.message': '{0}台のペアリング済みデバイスをすべて削除してもよろしいですか？各デバイスと再度ペアリングする必要があります。',

	// Date formatting
	'date.today': '今日',
	'date.yesterday': '昨日',
	'date.days-ago': '{0}日前',
} as const;
