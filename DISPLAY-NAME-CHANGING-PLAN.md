# Plan: Implement Display Name Changing

## Executive Summary

Implement bidirectional display name change support:
1. **Receive name changes** from PairDrop web/mobile over WebRTC data channel
2. **Send name changes** to all connected peers when user changes their display name in settings
3. **Update all UI locations** that display peer names (modals, peer list, settings)
4. **Persist paired device names** using roomSecret-based matching (most reliable)
5. Works for both local network peers and paired devices

## Problem Statement
- When a display name is changed in the browser (PairDrop web), Obsidian plugin receives `display-name-changed` message but doesn't handle it
- No way for Obsidian users to change their own display name and broadcast it
- Previous attempts struggled with confusion between server-assigned name and user display name
- Need to properly propagate name changes through the UX and handle all edge cases

## Current State (from exploration)

### Name Architecture
1. **Server-Assigned Name**: PairDrop server assigns identity in `display-name` message (stored in `SignalingClient.displayName`)
2. **Peer Display Names**: Come from `PeerInfo.name` object with fallback chain:
   - `peer.name.displayName` → `peer.name.deviceName` → `peer.name.model` → 'Unknown'
3. **Paired Device Names**: Stored persistently in settings (`PairedDevice.displayName`)

### UI Locations Displaying Peer Names
1. **PeerModal**: Shows peer list (dynamically fetched, has refresh)
2. **TransferModal**: Shows peer name during file transfer (cached at creation)
3. **IncomingTransferModal**: Shows sender name (cached at creation)
4. **PairingModal**: Shows paired device name (has `updatePeerDisplayName()` method)
5. **Settings**: Shows paired devices list (refreshes on `display()` call)
6. **Notifications**: Auto-accept messages with peer name

### Critical Gap
- `display-name-changed` message is **documented but NOT handled**
- Message comes over **WebRTC data channel** (peer-to-peer, not signaling)
- No handler in `rtc-peer.ts` `handleControlMessage()` method
- Transfer modals cache names and never update during active transfers

## Recommended Implementation Plan

### Core Approach

Handle `display-name-changed` messages at the data channel level (rtc-peer.ts), update PeerInfo objects in PeerManager, and propagate changes through existing event system to all UI components.

### Implementation Steps

#### 1. Add Data Channel Message Handler (rtc-peer.ts)

**Location**: In `handleControlMessage()` method (around line 492-545)

Add new case:
```typescript
case 'display-name-changed':
  this.handleDisplayNameChanged(message.displayName);
  break;
```

Add new method:
```typescript
private handleDisplayNameChanged(newDisplayName: string): void {
  logger.debug('Peer changed display name to', newDisplayName);
  this.trigger('display-name-changed', newDisplayName);
}
```

#### 2. Update PeerManager to Handle Name Changes (peer-manager.ts)

**Location**: In `setupPeerHandlers()` method (around line 126-162)

Add event listener on RTCPeer:
```typescript
peer.on('display-name-changed', (newDisplayName: string) => {
  this.handlePeerNameChanged(peer.getPeerId(), newDisplayName);
});
```

Add new methods to update peer info and track roomSecrets:
```typescript
private peerRoomSecrets: Map<string, string> = new Map(); // Track peerId -> roomSecret mapping

private handlePeerNameChanged(peerId: string, newDisplayName: string): void {
  const peer = this.peers.get(peerId);
  if (peer) {
    peer.name.displayName = newDisplayName;
    this.peers.set(peerId, peer);

    // Emit event for UI updates
    this.trigger('peer-name-changed', { peerId, displayName: newDisplayName });
    this.trigger('peers-updated', Array.from(this.peers.values()));
  }
}

getRoomSecretForPeer(peerId: string): string | null {
  return this.peerRoomSecrets.get(peerId) || null;
}

// In 'peers' event handler (line 54-56), add tracking:
if (data.roomType === 'secret' && data.roomId) {
  for (const peer of data.peers) {
    this.peerRoomSecrets.set(peer.id, data.roomId);
  }
}

// In 'peer-joined' event handler (line 72-84), add tracking:
if (data.roomType === 'secret' && data.roomId) {
  this.peerRoomSecrets.set(data.peer.id, data.roomId);
}

// In 'peer-left' event handler (line 86-94), clean up:
this.peerRoomSecrets.delete(peerId);
```

#### 3. Update Main Plugin to Handle Name Changes (main.ts)

**Location**: In `setupPeerManagerHandlers()` (around line 137-227)

Add event listener:
```typescript
this.peerManager.on('peer-name-changed', async (data: { peerId: string; displayName: string }) => {
  logger.debug('Peer name changed', data);

  // Update paired device name if applicable
  await this.updatePairedDeviceNameIfMatched(data.peerId, data.displayName);

  // Update active modals if they exist
  this.activeTransferModal?.updatePeerName?.(data.displayName);
  this.activePairingModal?.updatePeerDisplayName?.(data.displayName);
});
```

Add helper method:
```typescript
private async updatePairedDeviceNameIfMatched(peerId: string, newDisplayName: string): Promise<void> {
  // Use PeerManager to look up roomSecret for this peerId
  const roomSecret = this.peerManager.getRoomSecretForPeer(peerId);
  if (!roomSecret) return; // Not a paired device

  // Find paired device by roomSecret
  const pairedDevice = this.settings.pairedDevices.find(d => d.roomSecret === roomSecret);
  if (pairedDevice) {
    await this.updatePairedDeviceName(roomSecret, newDisplayName);
  }
}
```

#### 4. Add Name Update Support to Transfer Modals

**TransferModal** (transfer-modal.ts):

Add method:
```typescript
updatePeerName(newName: string): void {
  this.peerName = newName;
  const peerEl = this.contentEl.querySelector('.p2p-share-peer-name-highlight');
  if (peerEl) {
    peerEl.textContent = newName;
  }
}
```

**IncomingTransferModal** (incoming-transfer-modal.ts):

Add similar method:
```typescript
updatePeerName(newName: string): void {
  this.peerName = newName;
  // Update both the peer name display and auto-accept checkbox text
  const peerEl = this.contentEl.querySelector('.p2p-share-peer-name-highlight');
  if (peerEl) {
    peerEl.textContent = newName;
  }

  const checkboxLabel = this.contentEl.querySelector('.checkbox-container');
  if (checkboxLabel) {
    // Re-render checkbox label with new name
    this.renderAutoAcceptCheckbox(newName);
  }
}
```

#### 5. Add Outgoing Display Name Change Support

**Settings UI** (settings.ts):

Add display name setting in Connection section:
```typescript
new Setting(containerEl)
  .setName(t('settings.connection.display-name.name'))
  .setDesc(t('settings.connection.display-name.desc'))
  .addText((text) =>
    text
      .setPlaceholder(t('settings.connection.display-name.placeholder'))
      .setValue(this.plugin.settings.customDisplayName || '')
      .onChange(async (value) => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== this.plugin.settings.customDisplayName) {
          this.plugin.settings.customDisplayName = trimmed;
          await this.plugin.saveSettings();
          // Broadcast name change to all connected peers
          this.plugin.broadcastDisplayNameChange(trimmed);
        }
      })
  );
```

**Main Plugin** (main.ts):

Add to settings interface:
```typescript
customDisplayName?: string;
```

Add broadcast method:
```typescript
broadcastDisplayNameChange(newDisplayName: string): void {
  if (!this.peerManager) return;
  this.peerManager.broadcastDisplayNameToAllPeers(newDisplayName);
  new Notice(t('notice.display-name-changed', newDisplayName));
}
```

**PeerManager** (peer-manager.ts):

Add broadcast method:
```typescript
broadcastDisplayNameToAllPeers(displayName: string): void {
  for (const connection of this.connections.values()) {
    if (connection.isReady()) {
      connection.sendDisplayNameChange(displayName);
    }
  }
}
```

**RTCPeer** (rtc-peer.ts):

Add send method:
```typescript
sendDisplayNameChange(displayName: string): void {
  if (!this.channel || this.channel.readyState !== 'open') {
    logger.warn('Cannot send display name change, channel not open');
    return;
  }

  const message = {
    type: 'display-name-changed',
    displayName
  };

  logger.debug('Sending display name change to peer', this.peerId, displayName);
  this.channel.send(JSON.stringify(message));
}
```

**Translation keys** (i18n/locales/*.ts):

Add to all language files:
```typescript
'settings.connection.display-name.name': 'Display name',
'settings.connection.display-name.desc': 'How you appear to other peers',
'settings.connection.display-name.placeholder': 'Enter custom name',
'notice.display-name-changed': 'Display name changed to {0}',
```

#### 6. Add Display Name Type Definition (types.ts)

Add to PairDrop message union type:
```typescript
export interface PairDropDisplayNameChanged {
  type: 'display-name-changed';
  displayName: string;
}

export type PairDropMessage =
  | PairDropRequest
  | PairDropFileHeader
  | ...
  | PairDropDisplayNameChanged;
```

### Event Flow Diagram

```
Remote Peer Changes Name
    ↓
WebRTC Data Channel receives 'display-name-changed' message
    ↓
rtc-peer.ts: handleControlMessage() → handleDisplayNameChanged()
    ↓
Emits 'display-name-changed' event
    ↓
peer-manager.ts: handlePeerNameChanged()
    ↓
Updates peers Map with new displayName
    ↓
Emits TWO events:
  ├─ 'peer-name-changed' (specific peer update)
  └─ 'peers-updated' (full peer list refresh)
    ↓
main.ts: Receives events
    ↓
Three actions in parallel:
  ├─ Update paired device in settings (if applicable)
  ├─ Update activeTransferModal (if exists)
  └─ Update activePairingModal (if exists)
    ↓
PeerModal automatically refreshes (listens to 'peers-updated')
```

### Edge Cases & Handling

1. **Name change during active transfer**: TransferModal.updatePeerName() updates the display in real-time
2. **Name change for paired device**: Automatically persists to settings via updatePairedDeviceNameIfMatched()
3. **Name change for temporary peer**: Updates in-memory only, lost on disconnect
4. **Empty/invalid display name**: Keep existing name (add validation in handleDisplayNameChanged)
5. **Modal doesn't exist**: Optional chaining (.updatePeerName?.()) prevents errors
6. **Multiple peers with same name**: Each peer has unique peerId, so no conflict
7. **Name change before pairing completes**: PairingModal.updatePeerDisplayName() already handles this

### Summary of Changes

**Incoming Name Changes (Receiving):**
- rtc-peer.ts: Handle `display-name-changed` message
- peer-manager.ts: Update PeerInfo, track roomSecrets, emit events
- main.ts: Update paired devices, refresh active modals
- transfer-modal.ts: Add `updatePeerName()` method
- incoming-transfer-modal.ts: Add `updatePeerName()` method

**Outgoing Name Changes (Sending):**
- settings.ts: Add display name text input in Connection section
- main.ts: Add `broadcastDisplayNameChange()` method and `customDisplayName` setting
- peer-manager.ts: Add `broadcastDisplayNameToAllPeers()` method
- rtc-peer.ts: Add `sendDisplayNameChange()` method
- types.ts: Add PairDropDisplayNameChanged interface
- i18n: Add translation keys for all languages

### Critical Files to Modify

1. **src/rtc-peer.ts** - Add incoming handler and outgoing send method
2. **src/peer-manager.ts** - Update peer info, track roomSecrets, broadcast method
3. **src/main.ts** - Coordinate UI updates, update paired devices, broadcast support
4. **src/modals/transfer-modal.ts** - Add updatePeerName() method
5. **src/modals/incoming-transfer-modal.ts** - Add updatePeerName() method
6. **src/settings.ts** - Add display name input field
7. **src/types.ts** - Add PairDropDisplayNameChanged interface, add customDisplayName to settings
8. **src/i18n/locales/*.ts** - Add translation keys (en, fr, ru, zh-CN)

### Files to Read Before Implementation

- src/rtc-peer.ts (lines 492-545) - Current message handler
- src/peer-manager.ts (lines 54-124) - Peer info management
- src/main.ts (lines 137-227) - Event handler setup
- src/modals/transfer-modal.ts (entire file) - Modal structure
- src/modals/incoming-transfer-modal.ts (entire file) - Modal structure

### Testing Strategy

1. **Manual testing with PairDrop web**: Change name in browser, verify Obsidian updates
2. **Test during transfer**: Start transfer, change name mid-transfer, verify modal updates
3. **Test paired device**: Pair device, change name, verify settings persist new name
4. **Test peer modal**: Change name, verify peer list updates immediately
5. **Test edge cases**: Empty name, very long name, special characters

### Validation Rules

Add robust validation in handleDisplayNameChanged():
```typescript
private handleDisplayNameChanged(newDisplayName: string): void {
  // Sanitize and validate
  const trimmed = newDisplayName?.trim() || '';

  // Reject empty/invalid names
  if (!trimmed || trimmed.length === 0) {
    logger.warn('Rejected empty display name change');
    return;
  }

  // Length limits
  const maxLength = 50;
  const sanitized = trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;

  // Basic XSS prevention (strip HTML tags)
  const cleaned = sanitized.replace(/<[^>]*>/g, '');

  logger.debug('Peer changed display name to', cleaned);
  this.trigger('display-name-changed', cleaned);
}
```

### Improved Modal Tracking

**Current Issue**: Single `activeTransferModal` reference breaks with multiple simultaneous transfers.

**Solution**: Track modals by peerId in main.ts:

```typescript
private activeTransferModals: Map<string, TransferModal> = new Map();

// When creating transfer modal:
const modal = new TransferModal(...);
this.activeTransferModals.set(peerId, modal);
modal.onClose = () => this.activeTransferModals.delete(peerId);

// In peer-name-changed handler:
this.peerManager.on('peer-name-changed', async (data: { peerId: string; displayName: string }) => {
  logger.debug('Peer name changed', data);

  // Update paired device name if applicable
  await this.updatePairedDeviceNameIfMatched(data.peerId, data.displayName);

  // Update the specific modal for this peer
  const modal = this.activeTransferModals.get(data.peerId);
  modal?.updatePeerName(data.displayName);

  // PairingModal still tracked separately (only one pairing at a time)
  this.activePairingModal?.updatePeerDisplayName?.(data.displayName);
});
```
