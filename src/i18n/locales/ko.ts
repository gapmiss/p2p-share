export const ko = {
	// Common
	'common.cancel': '취소',
	'common.close': '닫기',
	'common.done': '완료',
	'common.back': '뒤로',
	'common.connect': '연결',
	'common.disconnect': '연결 끊기',
	'common.connected': '연결됨',
	'common.disconnected': '연결 끊김',
	'common.offline': '오프라인',

	// Plugin name
	'plugin.name': 'P2P Share',

	// Commands
	'command.show-peers': '사용 가능한 기기 표시',
	'command.share-current-file': '현재 파일 공유',
	'command.share-files': '파일 공유...',
	'command.reconnect': '서버에 재연결',
	'command.pair-device': '기기 페어링',
	'command.toggle-connection': '연결 전환',

	// Context menu
	'context-menu.share-file': 'P2P Share로 공유',
	'context-menu.share-folder': 'P2P Share로 폴더 공유',

	// Status bar
	'status-bar.peers': '{0}개 기기',
	'status-bar.offline': '오프라인',
	'status-bar.menu.you-appear-as': '표시 이름: {0}',
	'status-bar.menu.show-peers': '기기 표시',
	'status-bar.menu.pair-device': '기기 페어링',

	// Ribbon
	'ribbon.tooltip': 'P2P Share',

	// Notices
	'notice.connected': 'P2P Share: 연결됨',
	'notice.disconnected': 'P2P Share: 연결 끊김',
	'notice.configure-server': 'P2P Share: 설정에서 서버 URL을 구성하세요',
	'notice.failed-to-connect': 'P2P Share: 서버 연결에 실패했습니다. URL을 확인하고 서버가 외부 연결을 허용하는지 확인하세요.',
	'notice.transfer-rejected': 'P2P Share: 전송이 거부됨',
	'notice.transfer-cancelled': 'P2P Share: 전송이 취소됨',
	'notice.transfer-cancelled-by-sender': 'P2P Share: 발신자가 전송을 취소했습니다',
	'notice.no-files': 'P2P Share: 전송할 파일이 없습니다',
	'notice.error-sending': 'P2P Share: 파일 전송 오류 - {0}',
	'notice.device-paired': 'P2P Share: 기기가 성공적으로 페어링되었습니다!',
	'notice.device-removed': 'P2P Share: 페어링된 기기가 제거되었습니다',
	'notice.not-connected': 'P2P Share: 서버에 연결되지 않았습니다. 먼저 재연결하세요.',
	'notice.transfer-declined': 'P2P Share: 전송이 거부됨',
	'notice.auto-accepting': 'P2P Share: {0}의 전송을 자동으로 수락하는 중',

	// Peer Modal
	'peer-modal.title': '기기 선택',
	'peer-modal.you-appear-as': '내 표시 이름: {0}',
	'peer-modal.disconnected.title': '연결 끊김',
	'peer-modal.disconnected.hint': '네트워크에서 기기를 검색하려면 연결하세요.',
	'peer-modal.empty.title': '네트워크에서 기기를 찾을 수 없습니다.',
	'peer-modal.empty.hint': '다른 기기가 동일한 PairDrop 서버에 연결되어 있는지 확인하세요.',
	'peer-modal.p2p-badge': 'P2P',
	'peer-modal.p2p-tooltip': '직접 P2P 연결 지원',
	'peer-modal.paired-tooltip': '페어링된 기기',
	'peer-modal.share-with': '{0}와 공유',

	// File Picker Modal
	'file-picker.title': '공유할 파일 선택',
	'file-picker.vault': '볼트',
	'file-picker.empty-folder': '빈 폴더',
	'file-picker.select-all': '모두 선택',
	'file-picker.clear-selection': '선택 해제',
	'file-picker.share-selected': '선택한 항목 공유',
	'file-picker.no-items-selected': '선택된 항목 없음',
	'file-picker.selected': '{0}개 선택됨 ({1})',
	'file-picker.files': '{0}개 파일',
	'file-picker.folders': '{0}개 폴더',

	// Transfer Modal
	'transfer-modal.sending': '파일 전송 중',
	'transfer-modal.receiving': '파일 수신 중',
	'transfer-modal.to': '받는 사람: ',
	'transfer-modal.from': '보낸 사람: ',
	'transfer-modal.files-summary': '{0}개 파일 ({2})',
	'transfer-modal.status.connecting': '연결 중...',
	'transfer-modal.status.waiting': '파일 대기 중...',
	'transfer-modal.status.sending': '전송 중: {0}/{1}개 파일',
	'transfer-modal.status.receiving': '수신 중: {0}/{1}개 파일',
	'transfer-modal.status.complete': '완료: {0}/{1}개 파일',
	'transfer-modal.status.transfer-complete': '전송 완료!',
	'transfer-modal.status.error': '오류: {0}',
	'transfer-modal.file.pending': '대기 중',
	'transfer-modal.file.complete': '완료',

	// Incoming Transfer Modal
	'incoming-modal.title': '수신 전송',
	'incoming-modal.from': '보낸 사람: ',
	'incoming-modal.files-summary': '{0}개 파일 ({2})',
	'incoming-modal.more-files': '...외 {0}개',
	'incoming-modal.auto-accept': ' {0}의 전송 항상 자동 수락',
	'incoming-modal.decline': '거부',
	'incoming-modal.accept': '수락',

	// Pairing Modal
	'pairing-modal.title': '기기 페어링',
	'pairing-modal.description': '다른 네트워크에서 파일을 공유하려면 다른 기기와 페어링하세요.',
	'pairing-modal.show-code': '페어링 코드 표시',
	'pairing-modal.enter-code': '페어링 코드 입력',
	'pairing-modal.code-title': '페어링 코드',
	'pairing-modal.code-instruction': '다른 기기에 이 코드를 입력하여 페어링하세요.',
	'pairing-modal.code-expires': '코드는 {0}초 후에 만료됩니다.',
	'pairing-modal.code-generating': '페어링 코드 생성 중...',
	'pairing-modal.code-copied': '✓ 복사됨!',
	'pairing-modal.code-click-to-copy': '클릭하여 페어링 코드 복사',
	'pairing-modal.enter-instruction': '다른 기기에 표시된 6자리 코드를 입력하세요.',
	'pairing-modal.join': '참여',
	'pairing-modal.success.title': '페어링 성공!',
	'pairing-modal.success.message': '"{0}"와 페어링되었습니다.',
	'pairing-modal.success.hint': '이제 어디서나 이 기기와 파일을 공유할 수 있습니다.',
	'pairing-modal.error.title': '페어링 실패',
	'pairing-modal.error.unknown': '알 수 없는 오류가 발생했습니다.',
	'pairing-modal.error.invalid-code': '잘못되었거나 만료된 페어링 코드입니다.',
	'pairing-modal.error.canceled': '페어링이 취소되었습니다.',
	'pairing-modal.error.expired': '페어링 코드가 만료되었습니다. 다시 시도하세요.',
	'pairing-modal.try-again': '다시 시도',

	// Confirm Modal
	'confirm-modal.remove': '제거',

	// Settings
	'settings.title': 'P2P Share 설정',
	'settings.server.title': '서버 구성',
	'settings.server.url.name': '시그널링 서버 URL',
	'settings.server.url.desc': '자체 호스팅한 PairDrop 서버의 WebSocket URL (예: wss://your-server.com 또는 ws://localhost:3000)',
	'settings.server.url.placeholder': 'wss://your-pairdrop-server.com',

	'settings.files.title': '파일 설정',
	'settings.files.location.name': '저장 위치',
	'settings.files.location.desc': '수신한 파일을 저장할 볼트 내 폴더',
	'settings.files.location.placeholder': 'P2P Share',

	'settings.discovery.title': '검색 설정',
	'settings.discovery.mode.name': '검색 모드',
	'settings.discovery.mode.desc': '다른 기기를 검색하는 방법',
	'settings.discovery.mode.auto': '네트워크에서 자동 검색',
	'settings.discovery.mode.paired-only': '페어링된 기기만',

	'settings.behavior.title': '동작',
	'settings.behavior.log-level.name': '로그 수준',
	'settings.behavior.log-level.desc': '디버깅을 위한 콘솔 로그 상세도',
	'settings.behavior.log-level.none': '무음 (로그 없음)',
	'settings.behavior.log-level.error': '오류 (중요한 것만)',
	'settings.behavior.log-level.warn': '경고 (+ 오류)',
	'settings.behavior.log-level.info': '정보 (+ 상태 메시지)',
	'settings.behavior.log-level.debug': '디버그 (최대 상세도)',
	'settings.behavior.auto-connect.name': '시작 시 자동 연결',
	'settings.behavior.auto-connect.desc': 'Obsidian 시작 시 서버에 자동으로 연결',
	'settings.behavior.system-notifications.name': '시스템 알림',
	'settings.behavior.system-notifications.desc': '수신 전송에 대한 OS 수준 알림 표시 (데스크톱만)',

	'settings.connection.title': '연결 상태',
	'settings.connection.reconnect.name': '재연결',
	'settings.connection.reconnect.desc': '시그널링 서버에 수동으로 재연결',
	'settings.connection.reconnect.button': '재연결',

	'settings.paired-devices.title': '페어링된 기기',
	'settings.paired-devices.empty': '페어링된 기기가 없습니다. "기기 페어링" 명령을 사용하여 네트워크 간에 페어링하세요.',
	'settings.paired-devices.paired-at': '{0}에 페어링됨',
	'settings.paired-devices.auto-accept.name': '자동 수락',
	'settings.paired-devices.auto-accept.desc': '이 기기의 전송을 자동으로 수락',
	'settings.paired-devices.remove.label': '페어링 제거',
	'settings.paired-devices.remove-all.name': '모든 페어링된 기기 제거',
	'settings.paired-devices.remove-all.desc': '모든 기기의 페어링을 해제합니다',
	'settings.paired-devices.remove-all.button': '모두 제거',
	'settings.paired-devices.remove-confirm.title': '페어링된 기기 제거',
	'settings.paired-devices.remove-confirm.message': '"{0}"를 제거하시겠습니까? 이 기기와 파일을 공유하려면 다시 페어링해야 합니다.',
	'settings.paired-devices.remove-all-confirm.title': '모든 페어링된 기기 제거',
	'settings.paired-devices.remove-all-confirm.message': '{0}개의 페어링된 기기를 모두 제거하시겠습니까? 각 기기와 다시 페어링해야 합니다.',

	// Date formatting
	'date.today': '오늘',
	'date.yesterday': '어제',
	'date.days-ago': '{0}일 전',
} as const;
