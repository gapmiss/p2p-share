export const ru = {
	// Common
	'common.cancel': 'Отмена',
	'common.close': 'Закрыть',
	'common.done': 'Готово',
	'common.back': 'Назад',
	'common.connect': 'Подключиться',
	'common.disconnect': 'Отключиться',
	'common.connected': 'Подключено',
	'common.disconnected': 'Отключено',
	'common.offline': 'Не в сети',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': 'Показать доступные устройства',
	'command.share-current-file': 'Поделиться текущим файлом',
	'command.share-files': 'Поделиться файлами...',
	'command.reconnect': 'Переподключиться к серверу',
	'command.pair-device': 'Связать с устройством',
	'command.toggle-connection': 'Переключить подключение',

	// Context menu
	'context-menu.share-file': 'Поделиться через P2P Share',
	'context-menu.share-folder': 'Поделиться папкой через P2P Share',

	// Status bar
	'status-bar.peers': '{0} устройств{1}',
	'status-bar.offline': 'P2P Share: Не в сети',
	'status-bar.menu.show-peers': 'Показать устройства',
	'status-bar.menu.pair-device': 'Связать с устройством',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: Подключено',
	'notice.disconnected': 'P2P Share: Отключено',
	'notice.configure-server': 'P2P Share: Пожалуйста, настройте URL сервера в параметрах',
	'notice.failed-to-connect': 'P2P Share: Не удалось подключиться к серверу. Проверьте URL и убедитесь, что сервер принимает внешние подключения.',
	'notice.transfer-rejected': 'P2P Share: Передача отклонена',
	'notice.transfer-cancelled': 'P2P Share: Передача отменена',
	'notice.no-files': 'P2P Share: Нет файлов для отправки',
	'notice.error-sending': 'P2P Share: Ошибка при отправке файлов - {0}',
	'notice.device-paired': 'P2P Share: Устройство успешно связано!',
	'notice.device-removed': 'P2P Share: Связанное устройство было удалено',
	'notice.not-connected': 'P2P Share: Не подключено к серверу. Пожалуйста, сначала подключитесь.',
	'notice.transfer-declined': 'P2P Share: Передача отклонена',
	'notice.auto-accepting': 'P2P Share: Автоматическое принятие передачи от {0}',

	// Peer Modal
	'peer-modal.title': 'Выберите устройство',
	'peer-modal.you-appear-as': 'Вы отображаетесь как: {0}',
	'peer-modal.empty.title': 'Устройства в вашей сети не найдены.',
	'peer-modal.empty.hint': 'Убедитесь, что другие устройства подключены к тому же серверу PairDrop.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'Поддерживается прямое peer-to-peer соединение',
	'peer-modal.paired-tooltip': 'Связанное устройство',
	'peer-modal.share-with': 'Поделиться с {0}',

	// File Picker Modal
	'file-picker.title': 'Выберите файлы для отправки',
	'file-picker.vault': 'Хранилище',
	'file-picker.empty-folder': 'Пустая папка',
	'file-picker.select-all': 'Выбрать всё',
	'file-picker.clear-selection': 'Очистить выбор',
	'file-picker.share-selected': 'Отправить выбранное',
	'file-picker.no-items-selected': 'Ничего не выбрано',
	'file-picker.selected': '{0} выбрано ({1})',
	'file-picker.files': '{0} файл{1}',
	'file-picker.folders': '{0} папк{1}',

	// Transfer Modal
	'transfer-modal.sending': 'Отправка файлов',
	'transfer-modal.receiving': 'Получение файлов',
	'transfer-modal.to': 'Кому: ',
	'transfer-modal.from': 'От: ',
	'transfer-modal.files-summary': '{0} файл{1} ({2})',
	'transfer-modal.status.connecting': 'Подключение...',
	'transfer-modal.status.waiting': 'Ожидание файлов...',
	'transfer-modal.status.sending': 'Отправка: {0}/{1} файлов',
	'transfer-modal.status.receiving': 'Получение: {0}/{1} файлов',
	'transfer-modal.status.complete': 'Завершено: {0}/{1} файлов',
	'transfer-modal.status.transfer-complete': 'Передача завершена!',
	'transfer-modal.status.error': 'Ошибка: {0}',
	'transfer-modal.file.pending': 'В ожидании',
	'transfer-modal.file.complete': 'Завершён',

	// Incoming Transfer Modal
	'incoming-modal.title': 'Входящая передача',
	'incoming-modal.from': 'От: ',
	'incoming-modal.files-summary': '{0} файл{1} ({2})',
	'incoming-modal.more-files': '...и ещё {0}',
	'incoming-modal.auto-accept': ' Всегда автоматически принимать от {0}',
	'incoming-modal.decline': 'Отклонить',
	'incoming-modal.accept': 'Принять',

	// Pairing Modal
	'pairing-modal.title': 'Сопряжение устройств',
	'pairing-modal.description': 'Свяжите устройство для обмена файлами через разные сети.',
	'pairing-modal.show-code': 'Показать код сопряжения',
	'pairing-modal.enter-code': 'Ввести код сопряжения',
	'pairing-modal.code-title': 'Код сопряжения',
	'pairing-modal.code-instruction': 'Введите этот код на другом устройстве для сопряжения.',
	'pairing-modal.code-expires': 'Код истекает через {0} секунд{1}.',
	'pairing-modal.code-generating': 'Генерация кода сопряжения...',
	'pairing-modal.code-copied': '✓ Скопировано!',
	'pairing-modal.code-click-to-copy': 'Нажмите, чтобы скопировать код сопряжения',
	'pairing-modal.enter-instruction': 'Введите 6-значный код, показанный на другом устройстве.',
	'pairing-modal.join': 'Подключиться',
	'pairing-modal.success.title': 'Сопряжение успешно!',
	'pairing-modal.success.message': 'Вы связаны с "{0}".',
	'pairing-modal.success.hint': 'Теперь вы можете обмениваться файлами с этим устройством откуда угодно.',
	'pairing-modal.error.title': 'Ошибка сопряжения',
	'pairing-modal.error.unknown': 'Произошла неизвестная ошибка.',
	'pairing-modal.error.invalid-code': 'Неверный или истёкший код сопряжения.',
	'pairing-modal.error.canceled': 'Сопряжение было отменено.',
	'pairing-modal.error.expired': 'Код сопряжения истёк. Пожалуйста, попробуйте снова.',
	'pairing-modal.try-again': 'Попробовать снова',

	// Confirm Modal
	'confirm-modal.remove': 'Удалить',

	// Settings
	'settings.title': 'Настройки P2P Share',
	'settings.server.title': 'Конфигурация сервера',
	'settings.server.url.name': 'URL сервера сигнализации',
	'settings.server.url.desc': 'URL WebSocket для вашего самостоятельно размещённого сервера PairDrop (например, wss://your-server.com или ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://your-pairdrop-server.com',

	'settings.files.title': 'Настройки файлов',
	'settings.files.location.name': 'Место сохранения',
	'settings.files.location.desc': 'Папка в вашем хранилище, куда будут сохраняться полученные файлы',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': 'Настройки обнаружения',
	'settings.discovery.mode.name': 'Режим обнаружения',
	'settings.discovery.mode.desc': 'Как обнаруживать другие устройства',
	'settings.discovery.mode.auto': 'Автоматическое обнаружение в сети',
	'settings.discovery.mode.paired-only': 'Только связанные устройства',

	'settings.behavior.title': 'Поведение',
	'settings.behavior.log-level.name': 'Уровень логирования',
	'settings.behavior.log-level.desc': 'Подробность логов в консоли для отладки',
	'settings.behavior.log-level.none': 'Нет',
	'settings.behavior.log-level.error': 'Только ошибки',
	'settings.behavior.log-level.warn': 'Предупреждения и ошибки',
	'settings.behavior.log-level.info': 'Информация',
	'settings.behavior.log-level.debug': 'Отладка (подробно)',

	'settings.connection.title': 'Статус подключения',
	'settings.connection.reconnect.name': 'Переподключение',
	'settings.connection.reconnect.desc': 'Вручную переподключиться к серверу сигнализации',
	'settings.connection.reconnect.button': 'Переподключиться',

	'settings.paired-devices.title': 'Связанные устройства',
	'settings.paired-devices.empty': 'Нет связанных устройств. Используйте команду "Связать с устройством" для связи через разные сети.',
	'settings.paired-devices.paired-at': 'Связано {0}',
	'settings.paired-devices.auto-accept.name': 'Автоматическое принятие',
	'settings.paired-devices.auto-accept.desc': 'Автоматически принимать передачи от этого устройства',
	'settings.paired-devices.remove.label': 'Удалить сопряжение',
	'settings.paired-devices.remove-all.name': 'Удалить все связанные устройства',
	'settings.paired-devices.remove-all.desc': 'Это отвяжет все устройства',
	'settings.paired-devices.remove-all.button': 'Удалить все',
	'settings.paired-devices.remove-confirm.title': 'Удалить связанное устройство',
	'settings.paired-devices.remove-confirm.message': 'Вы уверены, что хотите удалить "{0}"? Вам нужно будет снова выполнить сопряжение, чтобы обмениваться файлами с этим устройством.',
	'settings.paired-devices.remove-all-confirm.title': 'Удалить все связанные устройства',
	'settings.paired-devices.remove-all-confirm.message': 'Вы уверены, что хотите удалить все {0} связанных устройств? Вам нужно будет снова выполнить сопряжение с каждым устройством.',

	// Date formatting
	'date.today': 'сегодня',
	'date.yesterday': 'вчера',
	'date.days-ago': '{0} дн. назад',
} as const;
