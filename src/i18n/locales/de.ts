export const de = {
	// Common
	'common.cancel': 'Abbrechen',
	'common.close': 'Schließen',
	'common.done': 'Fertig',
	'common.back': 'Zurück',
	'common.connect': 'Verbinden',
	'common.disconnect': 'Trennen',
	'common.connected': 'Verbunden',
	'common.disconnected': 'Getrennt',
	'common.offline': 'Offline',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': 'Verfügbare Geräte anzeigen',
	'command.share-current-file': 'Aktuelle Datei teilen',
	'command.share-files': 'Dateien teilen...',
	'command.reconnect': 'Mit Server neu verbinden',
	'command.pair-device': 'Mit Gerät koppeln',
	'command.toggle-connection': 'Verbindung umschalten',

	// Context menu
	'context-menu.share-file': 'Über P2P Share teilen',
	'context-menu.share-folder': 'Ordner über P2P Share teilen',

	// Status bar
	'status-bar.peers': '{0} Gerät{1}',
	'status-bar.offline': 'Offline',
	'status-bar.menu.show-peers': 'Geräte anzeigen',
	'status-bar.menu.pair-device': 'Mit Gerät koppeln',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: Verbunden',
	'notice.disconnected': 'P2P Share: Getrennt',
	'notice.configure-server': 'P2P Share: Bitte konfiguriere eine Server-URL in den Einstellungen',
	'notice.failed-to-connect': 'P2P Share: Verbindung zum Server fehlgeschlagen. Überprüfe die URL und stelle sicher, dass der Server externe Verbindungen akzeptiert.',
	'notice.transfer-rejected': 'P2P Share: Übertragung abgelehnt',
	'notice.transfer-cancelled': 'P2P Share: Übertragung abgebrochen',
	'notice.no-files': 'P2P Share: Keine Dateien zum Senden',
	'notice.error-sending': 'P2P Share: Fehler beim Senden der Dateien - {0}',
	'notice.device-paired': 'P2P Share: Gerät erfolgreich gekoppelt!',
	'notice.device-removed': 'P2P Share: Ein gekoppeltes Gerät wurde entfernt',
	'notice.not-connected': 'P2P Share: Nicht mit Server verbunden. Bitte zuerst neu verbinden.',
	'notice.transfer-declined': 'P2P Share: Übertragung abgelehnt',
	'notice.auto-accepting': 'P2P Share: Übertragung von {0} wird automatisch akzeptiert',

	// Peer Modal
	'peer-modal.title': 'Gerät auswählen',
	'peer-modal.you-appear-as': 'Du erscheinst als: {0}',
	'peer-modal.disconnected.title': 'Getrennt',
	'peer-modal.disconnected.hint': 'Verbinde dich, um Geräte in deinem Netzwerk zu entdecken.',
	'peer-modal.empty.title': 'Keine Geräte in deinem Netzwerk gefunden.',
	'peer-modal.empty.hint': 'Stelle sicher, dass andere Geräte mit demselben PairDrop-Server verbunden sind.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'Direkte Peer-to-Peer-Verbindung unterstützt',
	'peer-modal.paired-tooltip': 'Gekoppeltes Gerät',
	'peer-modal.share-with': 'Teilen mit {0}',

	// File Picker Modal
	'file-picker.title': 'Dateien zum Teilen auswählen',
	'file-picker.vault': 'Tresor',
	'file-picker.empty-folder': 'Leerer Ordner',
	'file-picker.select-all': 'Alle auswählen',
	'file-picker.clear-selection': 'Auswahl aufheben',
	'file-picker.share-selected': 'Ausgewählte teilen',
	'file-picker.no-items-selected': 'Keine Elemente ausgewählt',
	'file-picker.selected': '{0} ausgewählt ({1})',
	'file-picker.files': '{0} Datei{1}',
	'file-picker.folders': '{0} Ordner',

	// Transfer Modal
	'transfer-modal.sending': 'Dateien werden gesendet',
	'transfer-modal.receiving': 'Dateien werden empfangen',
	'transfer-modal.to': 'An: ',
	'transfer-modal.from': 'Von: ',
	'transfer-modal.files-summary': '{0} Datei{1} ({2})',
	'transfer-modal.status.connecting': 'Verbinde...',
	'transfer-modal.status.waiting': 'Warte auf Dateien...',
	'transfer-modal.status.sending': 'Sende: {0}/{1} Dateien',
	'transfer-modal.status.receiving': 'Empfange: {0}/{1} Dateien',
	'transfer-modal.status.complete': 'Abgeschlossen: {0}/{1} Dateien',
	'transfer-modal.status.transfer-complete': 'Übertragung abgeschlossen!',
	'transfer-modal.status.error': 'Fehler: {0}',
	'transfer-modal.file.pending': 'Ausstehend',
	'transfer-modal.file.complete': 'Abgeschlossen',

	// Incoming Transfer Modal
	'incoming-modal.title': 'Eingehende Übertragung',
	'incoming-modal.from': 'Von: ',
	'incoming-modal.files-summary': '{0} Datei{1} ({2})',
	'incoming-modal.more-files': '...und {0} weitere',
	'incoming-modal.auto-accept': ' Immer automatisch von {0} akzeptieren',
	'incoming-modal.decline': 'Ablehnen',
	'incoming-modal.accept': 'Akzeptieren',

	// Pairing Modal
	'pairing-modal.title': 'Geräte koppeln',
	'pairing-modal.description': 'Koppele mit einem anderen Gerät, um Dateien über verschiedene Netzwerke hinweg zu teilen.',
	'pairing-modal.show-code': 'Kopplungscode anzeigen',
	'pairing-modal.enter-code': 'Kopplungscode eingeben',
	'pairing-modal.code-title': 'Kopplungscode',
	'pairing-modal.code-instruction': 'Gib diesen Code auf dem anderen Gerät ein, um zu koppeln.',
	'pairing-modal.code-expires': 'Der Code läuft in {0} Sekunde{1} ab.',
	'pairing-modal.code-generating': 'Kopplungscode wird generiert...',
	'pairing-modal.code-copied': '✓ Kopiert!',
	'pairing-modal.code-click-to-copy': 'Klicken, um Kopplungscode zu kopieren',
	'pairing-modal.enter-instruction': 'Gib den 6-stelligen Code ein, der auf dem anderen Gerät angezeigt wird.',
	'pairing-modal.join': 'Beitreten',
	'pairing-modal.success.title': 'Erfolgreich gekoppelt!',
	'pairing-modal.success.message': 'Du bist jetzt mit "{0}" gekoppelt.',
	'pairing-modal.success.hint': 'Du kannst jetzt von überall Dateien mit diesem Gerät teilen.',
	'pairing-modal.error.title': 'Kopplung fehlgeschlagen',
	'pairing-modal.error.unknown': 'Ein unbekannter Fehler ist aufgetreten.',
	'pairing-modal.error.invalid-code': 'Ungültiger oder abgelaufener Kopplungscode.',
	'pairing-modal.error.canceled': 'Kopplung wurde abgebrochen.',
	'pairing-modal.error.expired': 'Kopplungscode abgelaufen. Bitte versuche es erneut.',
	'pairing-modal.try-again': 'Erneut versuchen',

	// Confirm Modal
	'confirm-modal.remove': 'Entfernen',

	// Settings
	'settings.title': 'P2P Share Einstellungen',
	'settings.server.title': 'Server-Konfiguration',
	'settings.server.url.name': 'Signalisierungsserver-URL',
	'settings.server.url.desc': 'WebSocket-URL für deinen selbst gehosteten PairDrop-Server (z.B. wss://dein-server.com oder ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://dein-pairdrop-server.com',

	'settings.files.title': 'Datei-Einstellungen',
	'settings.files.location.name': 'Speicherort',
	'settings.files.location.desc': 'Ordner in deinem Tresor, in dem empfangene Dateien gespeichert werden',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': 'Entdeckungseinstellungen',
	'settings.discovery.mode.name': 'Entdeckungsmodus',
	'settings.discovery.mode.desc': 'Wie andere Geräte entdeckt werden',
	'settings.discovery.mode.auto': 'Automatische Entdeckung im Netzwerk',
	'settings.discovery.mode.paired-only': 'Nur gekoppelte Geräte',

	'settings.behavior.title': 'Verhalten',
	'settings.behavior.log-level.name': 'Protokollstufe',
	'settings.behavior.log-level.desc': 'Ausführlichkeit der Konsolenprotokollierung für Fehlersuche',
	'settings.behavior.log-level.none': 'Stumm (Keine Protokollierung)',
	'settings.behavior.log-level.error': 'Fehler (Nur kritische)',
	'settings.behavior.log-level.warn': 'Warnung (+ Fehler)',
	'settings.behavior.log-level.info': 'Info (+ Statusmeldungen)',
	'settings.behavior.log-level.debug': 'Debug (Maximale Ausführlichkeit)',
	'settings.behavior.auto-connect.name': 'Automatisch beim Start verbinden',
	'settings.behavior.auto-connect.desc': 'Automatisch mit Server verbinden, wenn Obsidian startet',
	'settings.behavior.system-notifications.name': 'Systembenachrichtigungen',
	'settings.behavior.system-notifications.desc': 'Benachrichtigungen auf Betriebssystemebene für eingehende Übertragungen anzeigen (nur Desktop)',

	'settings.connection.title': 'Verbindungsstatus',
	'settings.connection.reconnect.name': 'Neu verbinden',
	'settings.connection.reconnect.desc': 'Manuell mit dem Signalisierungsserver neu verbinden',
	'settings.connection.reconnect.button': 'Neu verbinden',

	'settings.paired-devices.title': 'Gekoppelte Geräte',
	'settings.paired-devices.empty': 'Keine gekoppelten Geräte. Verwende den Befehl "Mit Gerät koppeln", um über Netzwerke hinweg zu koppeln.',
	'settings.paired-devices.paired-at': 'Gekoppelt {0}',
	'settings.paired-devices.auto-accept.name': 'Automatisch akzeptieren',
	'settings.paired-devices.auto-accept.desc': 'Übertragungen von diesem Gerät automatisch akzeptieren',
	'settings.paired-devices.remove.label': 'Kopplung entfernen',
	'settings.paired-devices.remove-all.name': 'Alle gekoppelten Geräte entfernen',
	'settings.paired-devices.remove-all.desc': 'Dies wird die Kopplung aller Geräte aufheben',
	'settings.paired-devices.remove-all.button': 'Alle entfernen',
	'settings.paired-devices.remove-confirm.title': 'Gekoppeltes Gerät entfernen',
	'settings.paired-devices.remove-confirm.message': 'Bist du sicher, dass du "{0}" entfernen möchtest? Du musst erneut koppeln, um Dateien mit diesem Gerät zu teilen.',
	'settings.paired-devices.remove-all-confirm.title': 'Alle gekoppelten Geräte entfernen',
	'settings.paired-devices.remove-all-confirm.message': 'Bist du sicher, dass du alle {0} gekoppelten Geräte entfernen möchtest? Du musst mit jedem Gerät erneut koppeln.',

	// Date formatting
	'date.today': 'heute',
	'date.yesterday': 'gestern',
	'date.days-ago': 'vor {0} Tagen',
} as const;
