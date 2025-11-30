# CLAUDE.md - Development Guidelines for P2P Share

This file provides context for AI assistants (Claude, etc.) working on this codebase.

## Project Overview

P2P Share is an Obsidian plugin that enables peer-to-peer file sharing between vaults using WebRTC. It uses the PairDrop protocol for signaling/peer discovery.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Obsidian Vault │◄──────────────────►│  PairDrop       │
│  (Plugin)       │   (Signaling)      │  Server         │
└────────┬────────┘                    └─────────────────┘
         │
         │ WebRTC (P2P)
         │
┌────────▼────────┐
│  Obsidian Vault │
│  (Plugin)       │
└─────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `src/main.ts` | Plugin entry point, event handlers, UI coordination |
| `src/signaling.ts` | WebSocket connection to PairDrop server, device pairing |
| `src/peer-manager.ts` | Manages peer connections and file transfers |
| `src/rtc-peer.ts` | WebRTC data channel, PairDrop file transfer protocol |
| `src/modals/*.ts` | UI modals (peer selection, file picker, transfer, pairing, confirm) |
| `src/types.ts` | TypeScript interfaces and PairDrop message types |
| `src/logger.ts` | Configurable logging system |
| `src/settings.ts` | Plugin settings UI |
| `src/i18n/` | Internationalization system with English and French translations |

## PairDrop Protocol

The plugin implements the PairDrop signaling protocol:

### Connection Flow
1. Connect to WebSocket at `wss://server/server?webrtc_supported=true`
2. Receive `ws-config` with RTC configuration
3. Receive `display-name` with assigned peer ID
4. Send `join-ip-room` to join room based on IP
5. Receive `peers` list of other peers in room

### Message Types (Server → Client)
- `ws-config` - RTC config and WS fallback settings
- `display-name` - Assigned identity (peerId, peerIdHash, displayName)
- `peers` - List of peers in room (includes roomType, roomId)
- `peer-joined` - New peer entered room (includes roomType, roomId)
- `peer-left` - Peer left room
- `signal` - WebRTC signaling (offer/answer/ICE)
- `ping` - Keepalive (must respond with `pong`)
- `pair-device-initiated` - Pairing code generated (pairKey, roomSecret)
- `pair-device-joined` - Pairing successful (roomSecret, peerId)
- `pair-device-join-key-invalid` - Invalid pairing code
- `pair-device-canceled` - Pairing canceled
- `secret-room-deleted` - Paired room removed

### Message Types (Client → Server)
- `join-ip-room` - Join room based on IP address
- `room-secrets` - Join paired device rooms (array of roomSecrets)
- `room-secrets-deleted` - Leave paired device rooms
- `pair-device-initiate` - Request a pairing code
- `pair-device-join` - Join with a pairing code (pairKey)
- `pair-device-cancel` - Cancel pairing attempt
- `pong` - Keepalive response
- `signal` - WebRTC signaling (requires `to`, `roomType`, `roomId`)
- `disconnect` - Graceful disconnect

### WebRTC Signaling Format
```typescript
// Offer/Answer
{ type: 'signal', to: peerId, roomType: 'ip', roomId: '127.0.0.1', sdp: RTCSessionDescription }

// ICE Candidate
{ type: 'signal', to: peerId, roomType: 'ip', roomId: '127.0.0.1', ice: RTCIceCandidate }
```

## File Transfer Protocol (PairDrop Compatible)

Over the WebRTC data channel, using PairDrop's protocol for compatibility with web/mobile apps:

### Transfer Flow
1. **Sender** sends `request` with file headers array, totalSize, imagesOnly flag
2. **Receiver** shows accept/reject modal
3. **Receiver** sends `files-transfer-response` with accepted: true/false
4. **Sender** sends files sequentially:
   - `header` with name, mime, size
   - Binary chunks (64KB each)
   - `partition` every 1MB (flow control)
   - **Receiver** responds with `partition-received`
   - **Receiver** sends `progress` updates
   - **Receiver** sends `file-transfer-complete` when file done
5. Repeat for each file

### Message Types (Data Channel)
```typescript
// Request to send files
{ type: 'request', header: [{name, mime, size}], totalSize, imagesOnly }

// Accept/reject response
{ type: 'files-transfer-response', accepted: boolean, reason?: string }

// File header (before each file's data)
{ type: 'header', name, mime, size }

// Flow control (every 1MB)
{ type: 'partition', offset }
{ type: 'partition-received', offset }

// Progress update
{ type: 'progress', progress: 0-1 }

// File complete
{ type: 'file-transfer-complete' }

// Transfer cancelled by sender
{ type: 'transfer-canceled' }

// Display name change
{ type: 'display-name-changed', displayName }
```

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Watch mode for development
npm run build    # Production build
```

## Code Conventions

### Obsidian API
- Use `registerEvent()` for event listeners (auto-cleanup)
- Use `addCommand()` for command palette entries
- Use `Notice` for user notifications
- Extend `Modal` for dialogs

### TypeScript
- Strict mode enabled
- Use `instanceof` checks for Obsidian types (TFile, TFolder)
- Handle optional chaining for nullable values

### Logging
- Use `logger` from `src/logger.ts` (not console.log directly)
- Log levels: `debug`, `info`, `warn`, `error`, `none`
- User configurable in settings
- Show user-facing errors with `new Notice('P2P Share: ...')`
- Use timeouts for async operations that may hang

### Internationalization (i18n)
- Use `t()` function from `src/i18n` for translating strings
- Use `tp()` function for pluralized strings (e.g., "1 file" vs "2 files")
- Translation keys defined in `src/i18n/locales/en.ts` (source of truth)
- Current supported languages: English (en), Spanish (es), German (de), French (fr), Russian (ru), Japanese (ja), Korean (ko), Simplified Chinese (zh-CN)
- Language auto-detected from Obsidian's language setting via `moment.locale()`
- Pluralization rules vary by language (simplified implementation):
  - English: 1 vs 2+ (suffix 's')
  - Spanish: 1 vs 2+ (suffix 's')
  - German: 1 vs 2+ (suffix 'e')
  - French: 0-1 vs 2+ (suffix 's')
  - Russian: 1 vs 2+ (suffix 'а', simplified from full 3-form rules)
  - Japanese: No plural suffixes
  - Korean: No plural suffixes
  - Chinese: No plural suffixes
- To add a new language: Create `src/i18n/locales/[code].ts` and add to `translations` object in `src/i18n/index.ts`

## Common Issues & Solutions

### "Unknown message type ws-config"
The plugin wasn't handling PairDrop's initial messages. Fixed by adding handlers for `ws-config` and `display-name`.

### Peers don't see each other
Must send `join-ip-room` after receiving `display-name`. Peers are grouped by IP address on the server.

### WebRTC signals not delivered in multi-room scenarios
**Problem**: When connected to multiple rooms (IP room + paired device rooms), WebRTC signaling was using incorrect room information. The signaling client tracked only the "current" room, which got overwritten each time a new `peers` message arrived.

**Solution** (Fixed in v0.1.3): Track `roomType` and `roomId` for each individual peer in `peer-manager.ts` using the `peerRooms` map. Pass per-peer room info when creating RTCPeer instances and sending signals. This ensures paired device connections use secret room signaling while local network connections use IP room signaling.

**Files**: `src/peer-manager.ts`, `src/rtc-peer.ts`, `src/signaling.ts`

### Discovery mode isolation
**Problem**: When switching between 'auto' and 'paired-only' discovery modes, the client cleared local peers but didn't leave the IP room on the server side (PairDrop protocol doesn't support leaving individual rooms without disconnecting).

**Solution** (Fixed in v0.1.2): Make `switchDiscoveryMode()` async and reconnect when switching modes. This ensures only the appropriate rooms are joined based on the new discovery mode.

**Files**: `src/signaling.ts`, `src/peer-manager.ts`, `src/settings.ts`

### Paired device badge not showing
**Problem**: The paired device badge in the peer list used display name matching to determine if a peer is paired. This caused the badge to not appear until the paired device's display name was updated.

**Solution** (Fixed in v0.1.4): Use the `roomSecret` tracking - if a peer has a roomSecret (is in a secret room), it's a paired device. The badge now appears immediately when the peer connects.

**File**: `src/modals/peer-modal.ts`

### Transfer completes but UI stuck
Race condition - transfer may complete before modal is created. Fixed by implementing request/accept flow.

### querySelector fails on filenames
Filenames with special characters (quotes, brackets) break CSS selectors. Use `CSS.escape()`.

### Peer list shows stale peers after disconnect
The `disconnect()` method was removing the `onclose` handler before the WebSocket closed, preventing the `disconnected` event from firing. Fixed by manually triggering the event after setting `ws = null`.

### Custom display names cause complexity
Custom display names required proactive WebRTC connections and added timing issues. Removed in favor of server-assigned names for simplicity and stability.

### Empty files (0 bytes) handling
Empty files cause issues with PairDrop protocol and WebRTC data channels. Solution: Filter out empty files before transfer in `main.ts` `sendToPeer()` method. Users are notified when empty files are skipped. This prevents stalls and ensures compatibility with PairDrop web/mobile apps.

### Incoming transfer modal dismiss handling
**Problem**: When users closed the incoming transfer modal by clicking the X button, pressing ESC, or clicking outside the modal, the transfer remained in limbo without being explicitly rejected.

**Solution** (Fixed in v0.1.9): Added a `resolved` flag to track whether the user explicitly accepted or declined. In the `onClose()` method, if `resolved` is still `false`, automatically call `onReject()` to properly reject the transfer. This ensures transfers are always handled regardless of how the modal is dismissed.

**File**: `src/modals/incoming-transfer-modal.ts`

### Duplicate transfer rejection notices
**Problem**: When a transfer was rejected, two notices appeared: "Transfer rejected" and "Transfer declined".

**Solution** (Fixed in v0.1.9): Removed the duplicate notice in the rejection callback. The `rejectTransfer()` method triggers a 'transfer-rejected' event that shows its own notice, making the manual notice redundant.

**File**: `src/main.ts`

### File already exists error on duplicate files
**Problem**: When receiving files with names that already exist in the vault, a race condition could occur where multiple files tried to create the same filename simultaneously, causing "File already exists" errors.

**Solution**: Implemented proper race condition handling in `saveReceivedFile()` method. The solution wraps `vault.createBinary()` in a try-catch block and retries with incremented filenames (e.g., "file 1.md", "file 2.md") if the creation fails due to race conditions. This matches Obsidian's native duplicate file naming convention. Additionally, when a file is renamed, a `file-renamed` event is emitted and the transfer modal displays "Saved as: [new name]" in orange italic text to inform the user.

**Files**: `src/peer-manager.ts`, `src/main.ts`, `src/modals/transfer-modal.ts`, `styles.css`

### Sender cancellation not notifying receiver
**Problem**: When the sender cancelled a transfer (by clicking Cancel, X button, ESC, or clicking outside the modal), the receiver was not notified. This left the receiver's modal open in a stuck state, and if they accepted the transfer, it would hang indefinitely.

**Solution**: Implemented a complete sender-to-receiver cancellation flow:
1. Added `PairDropTransferCanceled` message type to the protocol
2. Added `cancelTransfer()` method to RTCPeer that sends the cancel message and clears transfer state
3. Added `handleTransferCanceled()` handler on receiver side to clean up state and emit event
4. Wired up cancel callbacks in TransferModal to call `cancelTransfer()` when modal is closed (via any method)
5. Added `transfer-canceled` event handler in main.ts to close both incoming and progress modals
6. Added `isCancelled` flag to prevent duplicate cancel notifications
7. Translated "Transfer cancelled by sender" message to all 8 supported languages

When sender cancels at any point, the receiver's modal automatically closes and they see a notice explaining the sender cancelled the transfer.

**Files**: `src/types.ts`, `src/rtc-peer.ts`, `src/peer-manager.ts`, `src/main.ts`, `src/modals/transfer-modal.ts`, `src/i18n/locales/*.ts`

## Security & Encryption

P2P Share uses WebRTC's built-in encryption for secure peer-to-peer transfers:

### Encryption Layers
- **Signaling Channel**: WSS (WebSocket Secure) - TLS encrypted connection to PairDrop server
- **WebRTC Handshake**: DTLS (Datagram TLS) - Automatic key exchange
- **File Transfer**: SRTP (Secure Real-time Transport Protocol) - AES-128+ encryption

### What the Server Sees
- **CAN see**: Peer IDs, display names, room membership, connection timing, IP addresses (for STUN)
- **CANNOT see**: File contents, file names, file sizes, any transfer data

### Key Security Points
- WebRTC encryption is **mandatory and automatic** in modern implementations
- Uses industry-standard ciphers (AES-GCM, ChaCha20-Poly1305)
- Perfect Forward Secrecy (PFS) via ephemeral key exchange
- Files **never** pass through the signaling server - only direct peer-to-peer
- More private than HTTPS file uploads (server sees only metadata, not files)

For detailed security information, see **SECURITY.md**.

## Testing

1. Run two Obsidian vaults on the same machine
2. Both should connect to the same signaling server
3. Peers should appear in each other's peer list
4. Test file transfer with accept dialog
5. Test folder transfer (files flattened for PairDrop web compatibility)
6. Test with special characters in filenames
7. Test with PairDrop web/mobile apps
8. Test device pairing across different networks
9. Test connect/disconnect toggle from status bar menu
10. Test transfers with mix of empty and non-empty files (empty files should be filtered)
11. Test multi-room scenarios (paired devices + local network peers simultaneously)
12. Test discovery mode switching (auto ↔ paired-only)
13. Test incoming transfer modal dismiss (X button, ESC key, click outside)
14. Test system notifications (desktop only) - enable in settings
15. Test "...and X more" expansion in incoming transfer modal
16. Test clickable file labels in file picker (click name to toggle checkbox)

## Settings

### Behavior Settings
- **Log level**: Configure console logging verbosity with descriptive labels:
  - Silent (No logging)
  - Error (Critical only)
  - Warning (+ Errors)
  - Info (+ Status messages)
  - Debug (Maximum verbosity)
- **Auto-connect on startup**: Toggle automatic connection to server when Obsidian loads (default: enabled)
- **System notifications**: Show OS-level notifications for incoming transfers (desktop only, default: disabled)

### Discovery Settings
- **Discovery mode**: Choose between auto-discover (local network + paired devices) or paired devices only

### Connection Settings
- Manual connect/disconnect via status bar menu or settings
- Reconnect button in settings for manual reconnection

### Paired Devices
- Persistent device pairing across different networks
- Auto-accept transfers option per paired device
- Device management (view, unpair) in settings

## UI/UX Enhancements

### Incoming Transfer Modal
- **Clickable "...and X more" expansion**: Shows first 5 files by default, click to expand and view all files
- **Proper dismiss handling**: Closing modal (X button, ESC, click outside) properly rejects transfer
- **Visual feedback**: Accent color and hover effects on expandable elements

### File Picker Modal
- **Clickable file labels**: Click on file/folder name or icon to toggle checkbox selection
- **Improved accessibility**: Larger click target area for better UX

### Log Level Settings
- **Descriptive labels**: Clear indication of what each log level includes (e.g., "Warning (+ Errors)")
- **User-friendly**: Easier to understand logging verbosity options

### System Notifications
- **OS-level alerts**: Optional desktop notifications for incoming transfers
- **Persistent notifications**: Stay visible until user interacts (requireInteraction: true)
- **Smart timing**: Only shown for non-auto-accepted transfers

## Future Improvements

- [x] Paired device management (persistent pairing)
- [x] PairDrop protocol compatibility
- [x] Configurable logging
- [x] Connection toggle UI
- [x] Internationalization (8 languages: EN, ES, DE, FR, RU, JA, KO, ZH-CN)
- [x] Auto-connect setting for manual connection control
- [x] System notifications for incoming transfers
- [x] Improved modal UX (expandable file lists, clickable labels)
- [x] Enhanced log level descriptions
- [ ] Additional languages (Spanish, German, Japanese, etc.)
- [ ] TURN server support for restrictive networks
- [ ] Transfer queue for multiple files
- [ ] Resume interrupted transfers
- [ ] End-to-end encryption
- [ ] Mobile-specific optimizations
- [ ] Drag-and-drop file sharing
- [ ] Text/clipboard sharing
