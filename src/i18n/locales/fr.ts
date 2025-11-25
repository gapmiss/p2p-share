export const fr = {
	// Common
	'common.cancel': 'Annuler',
	'common.close': 'Fermer',
	'common.done': 'Terminé',
	'common.back': 'Retour',
	'common.connect': 'Connecter',
	'common.disconnect': 'Déconnecter',
	'common.connected': 'Connecté',
	'common.disconnected': 'Déconnecté',
	'common.offline': 'Hors ligne',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': 'Afficher les pairs disponibles',
	'command.share-current-file': 'Partager le fichier actuel',
	'command.share-files': 'Partager des fichiers...',
	'command.reconnect': 'Reconnecter au serveur',
	'command.pair-device': 'Associer un appareil',
	'command.toggle-connection': 'Basculer la connexion',

	// Context menu
	'context-menu.share-file': 'Partager via P2P Share',
	'context-menu.share-folder': 'Partager le dossier via P2P Share',

	// Status bar
	'status-bar.peers': '{0} pair{1}',
	'status-bar.offline': 'P2P Share : Hors ligne',
	'status-bar.menu.show-peers': 'Afficher les pairs',
	'status-bar.menu.pair-device': 'Associer un appareil',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share : Connecté',
	'notice.disconnected': 'P2P Share : Déconnecté',
	'notice.configure-server': 'P2P Share : Veuillez configurer une URL de serveur dans les paramètres',
	'notice.failed-to-connect': 'P2P Share : Échec de la connexion au serveur. Vérifiez l\'URL et assurez-vous que le serveur accepte les connexions externes.',
	'notice.transfer-rejected': 'P2P Share : Transfert rejeté',
	'notice.transfer-cancelled': 'P2P Share : Transfert annulé',
	'notice.no-files': 'P2P Share : Aucun fichier à envoyer',
	'notice.error-sending': 'P2P Share : Erreur lors de l\'envoi des fichiers - {0}',
	'notice.device-paired': 'P2P Share : Appareil associé avec succès !',
	'notice.device-removed': 'P2P Share : Un appareil associé a été supprimé',
	'notice.not-connected': 'P2P Share : Non connecté au serveur. Veuillez d\'abord vous reconnecter.',
	'notice.transfer-declined': 'P2P Share : Transfert refusé',
	'notice.auto-accepting': 'P2P Share : Acceptation automatique du transfert de {0}',

	// Peer Modal
	'peer-modal.title': 'Sélectionner un pair',
	'peer-modal.you-appear-as': 'Vous apparaissez comme : {0}',
	'peer-modal.disconnected.title': 'Déconnecté',
	'peer-modal.disconnected.hint': 'Connectez-vous pour découvrir des pairs sur votre réseau.',
	'peer-modal.empty.title': 'Aucun pair trouvé sur votre réseau.',
	'peer-modal.empty.hint': 'Assurez-vous que les autres appareils sont connectés au même serveur PairDrop.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': 'Connexion directe pair-à-pair prise en charge',
	'peer-modal.paired-tooltip': 'Appareil associé',
	'peer-modal.share-with': 'Partager avec {0}',

	// File Picker Modal
	'file-picker.title': 'Sélectionner les fichiers à partager',
	'file-picker.vault': 'Coffre',
	'file-picker.empty-folder': 'Dossier vide',
	'file-picker.select-all': 'Tout sélectionner',
	'file-picker.clear-selection': 'Effacer la sélection',
	'file-picker.share-selected': 'Partager la sélection',
	'file-picker.no-items-selected': 'Aucun élément sélectionné',
	'file-picker.selected': '{0} sélectionné{1} ({2})',
	'file-picker.files': '{0} fichier{1}',
	'file-picker.folders': '{0} dossier{1}',

	// Transfer Modal
	'transfer-modal.sending': 'Envoi de fichiers',
	'transfer-modal.receiving': 'Réception de fichiers',
	'transfer-modal.to': 'À : ',
	'transfer-modal.from': 'De : ',
	'transfer-modal.files-summary': '{0} fichier{1} ({2})',
	'transfer-modal.status.connecting': 'Connexion...',
	'transfer-modal.status.waiting': 'En attente de fichiers...',
	'transfer-modal.status.sending': 'Envoi : {0}/{1} fichiers',
	'transfer-modal.status.receiving': 'Réception : {0}/{1} fichiers',
	'transfer-modal.status.complete': 'Terminé : {0}/{1} fichiers',
	'transfer-modal.status.transfer-complete': 'Transfert terminé !',
	'transfer-modal.status.error': 'Erreur : {0}',
	'transfer-modal.file.pending': 'En attente',
	'transfer-modal.file.complete': 'Terminé',

	// Incoming Transfer Modal
	'incoming-modal.title': 'Transfert entrant',
	'incoming-modal.from': 'De : ',
	'incoming-modal.files-summary': '{0} fichier{1} ({2})',
	'incoming-modal.more-files': '...et {0} de plus',
	'incoming-modal.auto-accept': ' Toujours accepter automatiquement de {0}',
	'incoming-modal.decline': 'Refuser',
	'incoming-modal.accept': 'Accepter',

	// Pairing Modal
	'pairing-modal.title': 'Associer des appareils',
	'pairing-modal.description': 'Associez-vous à un autre appareil pour partager des fichiers sur différents réseaux.',
	'pairing-modal.show-code': 'Afficher le code d\'association',
	'pairing-modal.enter-code': 'Saisir le code d\'association',
	'pairing-modal.code-title': 'Code d\'association',
	'pairing-modal.code-instruction': 'Entrez ce code sur l\'autre appareil pour l\'associer.',
	'pairing-modal.code-expires': 'Le code expire dans {0} seconde{1}.',
	'pairing-modal.code-generating': 'Génération du code d\'association...',
	'pairing-modal.code-copied': '✓ Copié !',
	'pairing-modal.code-click-to-copy': 'Cliquez pour copier le code d\'association',
	'pairing-modal.enter-instruction': 'Entrez le code à 6 chiffres affiché sur l\'autre appareil.',
	'pairing-modal.join': 'Rejoindre',
	'pairing-modal.success.title': 'Association réussie !',
	'pairing-modal.success.message': 'Vous êtes maintenant associé avec "{0}".',
	'pairing-modal.success.hint': 'Vous pouvez désormais partager des fichiers avec cet appareil de n\'importe où.',
	'pairing-modal.error.title': 'Échec de l\'association',
	'pairing-modal.error.unknown': 'Une erreur inconnue s\'est produite.',
	'pairing-modal.error.invalid-code': 'Code d\'association invalide ou expiré.',
	'pairing-modal.error.canceled': 'L\'association a été annulée.',
	'pairing-modal.error.expired': 'Code d\'association expiré. Veuillez réessayer.',
	'pairing-modal.try-again': 'Réessayer',

	// Confirm Modal
	'confirm-modal.remove': 'Supprimer',

	// Settings
	'settings.title': 'Paramètres P2P Share',
	'settings.server.title': 'Configuration du serveur',
	'settings.server.url.name': 'URL du serveur de signalisation',
	'settings.server.url.desc': 'URL WebSocket pour votre serveur PairDrop auto-hébergé (par ex., wss://votre-serveur.com ou ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://votre-serveur-pairdrop.com',

	'settings.files.title': 'Paramètres des fichiers',
	'settings.files.location.name': 'Emplacement de sauvegarde',
	'settings.files.location.desc': 'Dossier dans votre coffre où les fichiers reçus seront enregistrés',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': 'Paramètres de découverte',
	'settings.discovery.mode.name': 'Mode de découverte',
	'settings.discovery.mode.desc': 'Comment découvrir les autres pairs',
	'settings.discovery.mode.auto': 'Découverte automatique sur le réseau',
	'settings.discovery.mode.paired-only': 'Appareils associés uniquement',

	'settings.behavior.title': 'Comportement',
	'settings.behavior.log-level.name': 'Niveau de journal',
	'settings.behavior.log-level.desc': 'Verbosité du journal de console pour le débogage',
	'settings.behavior.log-level.none': 'Aucun',
	'settings.behavior.log-level.error': 'Erreurs uniquement',
	'settings.behavior.log-level.warn': 'Avertissements et erreurs',
	'settings.behavior.log-level.info': 'Info',
	'settings.behavior.log-level.debug': 'Débogage (verbeux)',
	'settings.behavior.auto-connect.name': 'Connexion automatique au démarrage',
	'settings.behavior.auto-connect.desc': 'Se connecter automatiquement au serveur au démarrage d\'Obsidian',

	'settings.connection.title': 'État de la connexion',
	'settings.connection.reconnect.name': 'Reconnecter',
	'settings.connection.reconnect.desc': 'Reconnecter manuellement au serveur de signalisation',
	'settings.connection.reconnect.button': 'Reconnecter',

	'settings.paired-devices.title': 'Appareils associés',
	'settings.paired-devices.empty': 'Aucun appareil associé. Utilisez la commande "Associer un appareil" pour associer des appareils sur différents réseaux.',
	'settings.paired-devices.paired-at': 'Associé {0}',
	'settings.paired-devices.auto-accept.name': 'Acceptation automatique',
	'settings.paired-devices.auto-accept.desc': 'Accepter automatiquement les transferts de cet appareil',
	'settings.paired-devices.remove.label': 'Supprimer l\'association',
	'settings.paired-devices.remove-all.name': 'Supprimer tous les appareils associés',
	'settings.paired-devices.remove-all.desc': 'Cela dissociera tous les appareils',
	'settings.paired-devices.remove-all.button': 'Tout supprimer',
	'settings.paired-devices.remove-confirm.title': 'Supprimer l\'appareil associé',
	'settings.paired-devices.remove-confirm.message': 'Êtes-vous sûr de vouloir supprimer "{0}" ? Vous devrez l\'associer à nouveau pour partager des fichiers avec cet appareil.',
	'settings.paired-devices.remove-all-confirm.title': 'Supprimer tous les appareils associés',
	'settings.paired-devices.remove-all-confirm.message': 'Êtes-vous sûr de vouloir supprimer tous les {0} appareils associés ? Vous devrez les associer à nouveau individuellement.',

	// Date formatting
	'date.today': 'aujourd\'hui',
	'date.yesterday': 'hier',
	'date.days-ago': 'il y a {0} jours',
} as const;
