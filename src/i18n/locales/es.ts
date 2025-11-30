export const es = {
	// Common
	'common.cancel': 'Cancelar',
	'common.close': 'Cerrar',
	'common.done': 'Listo',
	'common.back': 'Atrás',
	'common.connect': 'Conectar',
	'common.disconnect': 'Desconectar',
	'common.connected': 'Conectado',
	'common.disconnected': 'Desconectado',
	'common.offline': 'Desconectado',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': 'Mostrar dispositivos disponibles',
	'command.share-current-file': 'Compartir archivo actual',
	'command.share-files': 'Compartir archivos...',
	'command.reconnect': 'Reconectar al servidor',
	'command.pair-device': 'Emparejar con dispositivo',
	'command.toggle-connection': 'Alternar conexión',

	// Context menu
	'context-menu.share-file': 'Compartir mediante P2P Share',
	'context-menu.share-folder': 'Compartir carpeta mediante P2P Share',

	// Status bar
	'status-bar.peers': '{0} dispositivo{1}',
	'status-bar.offline': 'Desconectado',
	'status-bar.menu.you-appear-as': 'Apareces como: {0}',
	'status-bar.menu.show-peers': 'Mostrar dispositivos',
	'status-bar.menu.pair-device': 'Emparejar con dispositivo',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: Conectado',
	'notice.disconnected': 'P2P Share: Desconectado',
	'notice.configure-server': 'P2P Share: Por favor, configura una URL de servidor en los ajustes',
	'notice.failed-to-connect': 'P2P Share: Error al conectar con el servidor. Verifica la URL y asegúrate de que el servidor acepte conexiones externas.',
	'notice.transfer-rejected': 'P2P Share: Transferencia rechazada',
	'notice.transfer-cancelled': 'P2P Share: Transferencia cancelada',
	'notice.transfer-cancelled-by-sender': 'P2P Share: Transferencia cancelada por el remitente',
	'notice.no-files': 'P2P Share: No hay archivos para enviar',
	'notice.error-sending': 'P2P Share: Error al enviar archivos - {0}',
	'notice.device-paired': 'P2P Share: ¡Dispositivo emparejado correctamente!',
	'notice.device-removed': 'P2P Share: Se eliminó un dispositivo emparejado',
	'notice.not-connected': 'P2P Share: No conectado al servidor. Por favor, reconecta primero.',
	'notice.transfer-declined': 'P2P Share: Transferencia rechazada',
	'notice.auto-accepting': 'P2P Share: Aceptando automáticamente transferencia de {0}',

	// Peer Modal
	'peer-modal.title': 'Seleccionar dispositivo',
	'peer-modal.you-appear-as': 'Apareces como: {0}',
	'peer-modal.disconnected.title': 'Desconectado',
	'peer-modal.disconnected.hint': 'Conéctate para descubrir dispositivos en tu red.',
	'peer-modal.empty.title': 'No se encontraron dispositivos en tu red.',
	'peer-modal.empty.hint': 'Asegúrate de que otros dispositivos estén conectados al mismo servidor PairDrop.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'Conexión directa peer-to-peer compatible',
	'peer-modal.paired-tooltip': 'Dispositivo emparejado',
	'peer-modal.share-with': 'Compartir con {0}',

	// File Picker Modal
	'file-picker.title': 'Seleccionar archivos para compartir',
	'file-picker.vault': 'Bóveda',
	'file-picker.empty-folder': 'Carpeta vacía',
	'file-picker.select-all': 'Seleccionar todo',
	'file-picker.clear-selection': 'Limpiar selección',
	'file-picker.share-selected': 'Compartir seleccionados',
	'file-picker.no-items-selected': 'No hay elementos seleccionados',
	'file-picker.selected': '{0} seleccionado{1} ({2})',
	'file-picker.files': '{0} archivo{1}',
	'file-picker.folders': '{0} carpeta{1}',

	// Transfer Modal
	'transfer-modal.sending': 'Enviando archivos',
	'transfer-modal.receiving': 'Recibiendo archivos',
	'transfer-modal.to': 'Para: ',
	'transfer-modal.from': 'De: ',
	'transfer-modal.files-summary': '{0} archivo{1} ({2})',
	'transfer-modal.status.connecting': 'Conectando...',
	'transfer-modal.status.waiting': 'Esperando archivos...',
	'transfer-modal.status.sending': 'Enviando: {0}/{1} archivos',
	'transfer-modal.status.receiving': 'Recibiendo: {0}/{1} archivos',
	'transfer-modal.status.complete': 'Completado: {0}/{1} archivos',
	'transfer-modal.status.transfer-complete': '¡Transferencia completa!',
	'transfer-modal.status.error': 'Error: {0}',
	'transfer-modal.file.pending': 'Pendiente',
	'transfer-modal.file.complete': 'Completado',

	// Incoming Transfer Modal
	'incoming-modal.title': 'Transferencia entrante',
	'incoming-modal.from': 'De: ',
	'incoming-modal.files-summary': '{0} archivo{1} ({2})',
	'incoming-modal.more-files': '...y {0} más',
	'incoming-modal.auto-accept': ' Siempre aceptar automáticamente de {0}',
	'incoming-modal.decline': 'Rechazar',
	'incoming-modal.accept': 'Aceptar',

	// Pairing Modal
	'pairing-modal.title': 'Emparejar dispositivos',
	'pairing-modal.description': 'Empareja con otro dispositivo para compartir archivos a través de diferentes redes.',
	'pairing-modal.show-code': 'Mostrar código de emparejamiento',
	'pairing-modal.enter-code': 'Introducir código de emparejamiento',
	'pairing-modal.code-title': 'Código de emparejamiento',
	'pairing-modal.code-instruction': 'Introduce este código en el otro dispositivo para emparejarlo.',
	'pairing-modal.code-expires': 'El código expira en {0} segundo{1}.',
	'pairing-modal.code-generating': 'Generando código de emparejamiento...',
	'pairing-modal.code-copied': '✓ ¡Copiado!',
	'pairing-modal.code-click-to-copy': 'Haz clic para copiar el código de emparejamiento',
	'pairing-modal.enter-instruction': 'Introduce el código de 6 dígitos mostrado en el otro dispositivo.',
	'pairing-modal.join': 'Unirse',
	'pairing-modal.success.title': '¡Emparejamiento exitoso!',
	'pairing-modal.success.message': 'Ahora estás emparejado con "{0}".',
	'pairing-modal.success.hint': 'Ahora puedes compartir archivos con este dispositivo desde cualquier lugar.',
	'pairing-modal.error.title': 'Error de emparejamiento',
	'pairing-modal.error.unknown': 'Ocurrió un error desconocido.',
	'pairing-modal.error.invalid-code': 'Código de emparejamiento inválido o expirado.',
	'pairing-modal.error.canceled': 'El emparejamiento fue cancelado.',
	'pairing-modal.error.expired': 'El código de emparejamiento expiró. Por favor, inténtalo de nuevo.',
	'pairing-modal.try-again': 'Intentar de nuevo',

	// Confirm Modal
	'confirm-modal.remove': 'Eliminar',

	// Settings
	'settings.title': 'Ajustes de P2P Share',
	'settings.server.title': 'Configuración del servidor',
	'settings.server.url.name': 'URL del servidor de señalización',
	'settings.server.url.desc': 'URL de WebSocket para tu servidor PairDrop auto-alojado (ej., wss://tu-servidor.com o ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://tu-servidor-pairdrop.com',

	'settings.files.title': 'Ajustes de archivos',
	'settings.files.location.name': 'Ubicación de guardado',
	'settings.files.location.desc': 'Carpeta en tu bóveda donde se guardarán los archivos recibidos',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': 'Ajustes de descubrimiento',
	'settings.discovery.mode.name': 'Modo de descubrimiento',
	'settings.discovery.mode.desc': 'Cómo descubrir otros dispositivos',
	'settings.discovery.mode.auto': 'Descubrimiento automático en la red',
	'settings.discovery.mode.paired-only': 'Solo dispositivos emparejados',

	'settings.behavior.title': 'Comportamiento',
	'settings.behavior.log-level.name': 'Nivel de registro',
	'settings.behavior.log-level.desc': 'Nivel de detalle del registro de consola para depuración',
	'settings.behavior.log-level.none': 'Silencioso (Sin registro)',
	'settings.behavior.log-level.error': 'Error (Solo críticos)',
	'settings.behavior.log-level.warn': 'Advertencia (+ Errores)',
	'settings.behavior.log-level.info': 'Info (+ Mensajes de estado)',
	'settings.behavior.log-level.debug': 'Depuración (Máxima verbosidad)',
	'settings.behavior.auto-connect.name': 'Conectar automáticamente al iniciar',
	'settings.behavior.auto-connect.desc': 'Conectar automáticamente al servidor cuando Obsidian se inicia',
	'settings.behavior.system-notifications.name': 'Notificaciones del sistema',
	'settings.behavior.system-notifications.desc': 'Mostrar notificaciones a nivel del sistema operativo para transferencias entrantes (solo escritorio)',

	'settings.connection.title': 'Estado de conexión',
	'settings.connection.reconnect.name': 'Reconectar',
	'settings.connection.reconnect.desc': 'Reconectar manualmente al servidor de señalización',
	'settings.connection.reconnect.button': 'Reconectar',

	'settings.paired-devices.title': 'Dispositivos emparejados',
	'settings.paired-devices.empty': 'No hay dispositivos emparejados. Usa el comando "Emparejar con dispositivo" para emparejar a través de redes.',
	'settings.paired-devices.paired-at': 'Emparejado {0}',
	'settings.paired-devices.auto-accept.name': 'Aceptar automáticamente',
	'settings.paired-devices.auto-accept.desc': 'Aceptar automáticamente transferencias de este dispositivo',
	'settings.paired-devices.remove.label': 'Eliminar emparejamiento',
	'settings.paired-devices.remove-all.name': 'Eliminar todos los dispositivos emparejados',
	'settings.paired-devices.remove-all.desc': 'Esto desemparejará todos los dispositivos',
	'settings.paired-devices.remove-all.button': 'Eliminar todos',
	'settings.paired-devices.remove-confirm.title': 'Eliminar dispositivo emparejado',
	'settings.paired-devices.remove-confirm.message': '¿Estás seguro de que quieres eliminar "{0}"? Necesitarás emparejar de nuevo para compartir archivos con este dispositivo.',
	'settings.paired-devices.remove-all-confirm.title': 'Eliminar todos los dispositivos emparejados',
	'settings.paired-devices.remove-all-confirm.message': '¿Estás seguro de que quieres eliminar todos los {0} dispositivos emparejados? Necesitarás emparejar de nuevo con cada dispositivo.',

	// Date formatting
	'date.today': 'hoy',
	'date.yesterday': 'ayer',
	'date.days-ago': 'hace {0} días',
} as const;
